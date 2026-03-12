import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import Map from './components/Map';
import ReportForm from './components/ReportForm';
import AlertBanner from './components/AlertBanner';
import Sidebar from './components/Sidebar';
import Clock from './components/Clock';
import WeatherWidget from './components/WeatherWidget';
import LoadingScreen from './components/LoadingScreen';
import { Plus, Sun, Moon, MapPin, AlertTriangle, AlertCircle, Layers, X } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

function App() {
  const [reports, setReports] = useState([]);
  const [deletedReports, setDeletedReports] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showRoadblocks, setShowRoadblocks] = useState(false);
  const [isWeatherEnabled, setIsWeatherEnabled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  
  const [loadingStages, setLoadingStages] = useState({
    map: false,
    reports: false,
    roadblocks: false,
    weather: false
  });
  
  const locationChannelRef = useRef(null);
  const watchIdRef = useRef(null);
  const assignedNumberRef = useRef(null);

  // Helper to filter reports older than 24 hours
  const filterOldReports = (reports) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return reports.filter(r => new Date(r.created_at) > oneDayAgo);
  };

  // Auto-delete expired reports
  const autoDeleteExpiredReports = async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('reports')
      .update({ is_deleted: true })
      .eq('is_deleted', false)
      .lt('created_at', oneDayAgo);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsRightPanelOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('is_deleted', false)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });
      
      if (error) console.error('Error fetching reports:', error);
      else setReports(data || []);
      
      setLoadingStages(prev => ({ ...prev, reports: true }));
    };

    const fetchDeletedReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('is_deleted', true)
        .order('created_at', { ascending: false });
      
      if (error) console.error('Error fetching deleted reports:', error);
      else setDeletedReports(data || []);
    };

    fetchReports();
    fetchDeletedReports();
    autoDeleteExpiredReports();

    // Check for expired reports every minute
    const expiryInterval = setInterval(() => {
      setReports(prev => filterOldReports(prev));
      autoDeleteExpiredReports();
    }, 60000);
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('reports-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        console.log('Change received!', payload);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (payload.eventType === 'INSERT' && !payload.new.is_deleted) {
          // Only add if less than 24 hours old
          if (new Date(payload.new.created_at) > oneDayAgo) {
            setReports(prev => [payload.new, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.is_deleted) {
            setReports(prev => prev.filter(r => r.id !== payload.new.id));
            setDeletedReports(prev => [payload.new, ...prev]);
          } else {
            setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          }
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
          setDeletedReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    // Setup presence channel for live locations
    locationChannelRef.current = supabase.channel('live-locations');
    
    locationChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = locationChannelRef.current.presenceState();
        const users = [];
        for (const id in state) {
          for (const presence of state[id]) {
            if (presence.lat && presence.lng) {
              users.push({ id, ...presence });
            }
          }
        }
        setActiveUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(expiryInterval);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (locationChannelRef.current) supabase.removeChannel(locationChannelRef.current);
    };
  }, []);

  const handleMarkerClick = (report) => {
    setEditingReport(report);
    setSelectedLocation({ lat: report.latitude, lng: report.longitude });
    setIsFormOpen(true);
  };

  const handleGoToLocation = (location) => {
    setFlyToLocation({ ...location, timestamp: Date.now() });
  };

  const toggleLocationSharing = async () => {
    if (isSharingLocation) {
      // Turn off
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationChannelRef.current) {
        await locationChannelRef.current.untrack();
      }
      assignedNumberRef.current = null;
      setIsSharingLocation(false);
    } else {
      setShowLocationModal(true);
    }
  };

  const confirmLocationSharing = async () => {
    setShowLocationModal(false);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    if (locationChannelRef.current) {
      // Determine number
      const state = locationChannelRef.current.presenceState();
      const usedNumbers = new Set();
      for (const id in state) {
        for (const presence of state[id]) {
          if (presence.num) usedNumbers.add(presence.num);
        }
      }
      let myNum = 1;
      while (usedNumbers.has(myNum) && myNum <= 10) myNum++;
      if (myNum > 10) myNum = Math.floor(Math.random() * 10) + 1; // Fallback
      assignedNumberRef.current = myNum;

      setIsSharingLocation(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          if (locationChannelRef.current) {
            await locationChannelRef.current.track({
              num: assignedNumberRef.current,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              updatedAt: new Date().toISOString()
            });
          }
        },
        (err) => {
          console.error("Error watching position:", err);
          setIsSharingLocation(false);
          setLocationError("Location access denied or unavailable.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(() => {
    return sessionStorage.getItem('hasVisitedBefore') === 'true';
  });

  useEffect(() => {
    if (!minLoadingTimeElapsed) {
      const timer = setTimeout(() => {
        setMinLoadingTimeElapsed(true);
        sessionStorage.setItem('hasVisitedBefore', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [minLoadingTimeElapsed]);

  const isAppReady = loadingStages.map && loadingStages.reports && loadingStages.roadblocks && (!isWeatherEnabled || loadingStages.weather) && minLoadingTimeElapsed;

  return (
    <div className="app-container" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AnimatePresence>
        {!isAppReady && <LoadingScreen key="loading-screen" stages={loadingStages} />}
      </AnimatePresence>

      <AnimatePresence>
        {showLocationModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(4px)',
              zIndex: 9999
            }}
          >
            <div className="glass modal-content" style={{ 
              padding: '32px', 
              maxWidth: '380px', 
              width: '90%', 
              textAlign: 'center',
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                alignItems: 'center',
                margin: '0 auto 20px'
              }}>
                <MapPin size={32} style={{ color: '#0891b2' }} />
              </div>
              <h2 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: '700', color: '#f0f4f8' }}>Share Live Location?</h2>
              <p style={{ color: '#8899a6', marginBottom: '28px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                This will anonymously share your live location on the map with other users. You can stop sharing at any time.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowLocationModal(false)}
                  style={{ 
                    padding: '12px 20px', 
                    borderRadius: '10px', 
                    background: 'transparent', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#f0f4f8', 
                    cursor: 'pointer',
                    fontWeight: 600,
                    width: '100%',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={confirmLocationSharing}
                  style={{ width: '100%', padding: '12px 20px', borderRadius: '10px' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AlertBanner reports={reports} />
      
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Map 
          reports={reports} 
          activeUsers={activeUsers} 
          onMarkerClick={handleMarkerClick} 
          flyToLocation={flyToLocation} 
          isDarkMode={isDarkMode} 
          showRoadblocks={showRoadblocks} 
          onMapReady={() => setLoadingStages(prev => ({ ...prev, map: true }))}
          onRoadblocksReady={() => setLoadingStages(prev => ({ ...prev, roadblocks: true }))}
        />
        
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          gap: '8px'
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Clock />
          </div>

          {isMobile && !isRightPanelOpen && (
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRightPanelOpen(true)}
              className="glass"
              style={{
                pointerEvents: 'auto',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(17, 24, 39, 0.85)',
                color: '#f0f4f8',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
              }}
            >
              <Layers size={22} />
            </Motion.button>
          )}

          <AnimatePresence>
            {(!isMobile || isRightPanelOpen) && (
              <Motion.div 
                initial={isMobile ? { opacity: 0, scale: 0.9, originX: 1, originY: 0 } : false}
                animate={{ opacity: 1, scale: 1 }}
                exit={isMobile ? { opacity: 0, scale: 0.9, originX: 1, originY: 0 } : false}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px', alignItems: 'flex-end' }}
              >
                {isMobile && (
                  <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsRightPanelOpen(false)}
                    className="glass"
                    style={{
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      background: 'rgba(220, 38, 38, 0.15)',
                      color: '#dc2626',
                      cursor: 'pointer',
                      marginBottom: '4px'
                    }}
                  >
                    <X size={18} />
                  </Motion.button>
                )}
                
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <WeatherWidget 
                    isWeatherEnabled={isWeatherEnabled} 
                    onToggleWeather={() => setIsWeatherEnabled(true)}
                    onResetWeather={() => setIsWeatherEnabled(false)}
                    onWeatherReady={() => setLoadingStages(prev => ({ ...prev, weather: true }))} 
                  />
                  
                  {locationError ? (
                    <Motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLocationError(null)}
                      className="glass"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '14px',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        background: 'rgba(17, 24, 39, 0.85)',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.8rem', lineHeight: '1.3' }}>
                        {locationError} <br/><span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Tap to Retry)</span>
                      </span>
                    </Motion.button>
                  ) : (
                    <Motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleLocationSharing}
                      className="glass"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '14px',
                        border: isSharingLocation ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSharingLocation ? 'rgba(20, 184, 166, 0.15)' : 'rgba(17, 24, 39, 0.85)',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <MapPin size={18} style={{ color: isSharingLocation ? '#14b8a6' : '#f0f4f8' }} />
                      <span style={{ color: isSharingLocation ? '#14b8a6' : '#f0f4f8', fontWeight: '600', fontSize: '0.85rem' }}>
                        {isSharingLocation ? 'Sharing Location' : 'Share Location'}
                      </span>
                    </Motion.button>
                  )}
                  
                  <Motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="glass"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(17, 24, 39, 0.85)',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    {isDarkMode ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#8899a6' }} />}
                    <span style={{ color: '#f0f4f8', fontWeight: '600', fontSize: '0.85rem' }}>
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </Motion.button>

                  <Motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRoadblocks(!showRoadblocks)}
                    className="glass"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '14px',
                      border: showRoadblocks ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: showRoadblocks ? 'rgba(220, 38, 38, 0.15)' : 'rgba(17, 24, 39, 0.85)',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: showRoadblocks ? '#dc2626' : '#f0f4f8' }} />
                    <span style={{ color: showRoadblocks ? '#dc2626' : '#f0f4f8', fontWeight: '600', fontSize: '0.85rem' }}>
                      {showRoadblocks ? 'Hide Roadblocks' : 'Show Roadblocks'}
                    </span>
                  </Motion.button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        <Sidebar reports={reports} deletedReports={deletedReports} onEditReport={handleMarkerClick} onGoToLocation={handleGoToLocation} />

        <Motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary report-btn"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(8, 145, 178, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
            padding: '14px 28px',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '0.95rem',
            letterSpacing: '0.02em'
          }}
          onClick={() => {
            setEditingReport(null);
            setSelectedLocation(null);
            setIsFormOpen(true);
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          Report Flood
        </Motion.button>
      </main>

      <AnimatePresence>
        {isFormOpen && (
          <ReportForm 
            onClose={() => {
              setIsFormOpen(false);
              setSelectedLocation(null);
              setEditingReport(null);
            }} 
            initialLocation={selectedLocation}
            editingReport={editingReport}
            reports={reports}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
