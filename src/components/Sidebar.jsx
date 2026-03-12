import React, { useState, useEffect } from 'react';
import { List, ChevronRight, MessageSquare, Clock, MapPin, History, Trash2, X } from 'lucide-react';
import { motion as Motion } from 'framer-motion';


const Sidebar = ({ reports, deletedReports = [], onEditReport, onGoToLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLevelColor = (level) => {
    const colors = {
      Low: '#22c55e',
      Medium: '#eab308',
      High: '#f97316',
      Extreme: '#dc2626'
    };
    return colors[level] || '#0891b2';
  };

  return (
    <>
      <Motion.button 
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'absolute',
          top: isMobile ? '70px' : '80px',
          left: '12px',
          zIndex: 1001,
          background: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f0f4f8',
          padding: '6px',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? <X size={18} /> : <List size={18} />}
      </Motion.button>

      <Motion.div 
        initial={{ x: -400 }}
        animate={{ x: isOpen ? 0 : -400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="glass sidebar-panel"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          bottom: '0',
          width: '340px',
          maxWidth: '85vw',
          zIndex: 1000,
          margin: '12px',
          marginTop: isMobile ? '120px' : '130px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(17, 24, 39, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header with tabs */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setActiveTab('recent')}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: activeTab === 'recent' 
                  ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)'
                  : 'transparent',
                border: activeTab === 'recent' ? '1px solid rgba(8, 145, 178, 0.3)' : '1px solid transparent',
                borderRadius: '10px',
                color: activeTab === 'recent' ? '#f0f4f8' : '#8899a6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'recent' ? '600' : '500',
                transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <Clock size={14} />
              Recent
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: activeTab === 'history' 
                  ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)'
                  : 'transparent',
                border: activeTab === 'history' ? '1px solid rgba(8, 145, 178, 0.3)' : '1px solid transparent',
                borderRadius: '10px',
                color: activeTab === 'history' ? '#f0f4f8' : '#8899a6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'history' ? '600' : '500',
                transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <History size={14} />
              History
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
          {activeTab === 'recent' ? (
            reports.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px', 
                color: '#8899a6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(8, 145, 178, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={24} style={{ color: '#0891b2' }} />
                </div>
                <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>No reports yet</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Be the first to report flooding!</p>
              </div>
            ) : (
              reports.map((report, index) => (
                <Motion.div 
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  onClick={() => onGoToLocation({ lat: report.latitude, lng: report.longitude })}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: getLevelColor(report.water_level),
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: `${getLevelColor(report.water_level)}15`,
                      border: `1px solid ${getLevelColor(report.water_level)}30`
                    }}>
                      {report.water_level}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#8899a6',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <h4 style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '0.95rem', 
                    fontWeight: '600',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: '#f0f4f8'
                  }}>
                    <MapPin size={14} style={{ color: '#0891b2', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.location_name}
                    </span>
                  </h4>
                  
                  {report.image_url && (
                    <div style={{ 
                      marginTop: '10px', 
                      marginBottom: '10px', 
                      width: '100%', 
                      height: '100px', 
                      borderRadius: '10px', 
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <img 
                        src={report.image_url} 
                        alt="Flood" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  )}

                  {report.description && (
                    <p style={{ 
                      margin: '8px 0 0 0', 
                      fontSize: '0.8rem', 
                      color: '#8899a6', 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: '6px',
                      lineHeight: '1.5'
                    }}>
                      <MessageSquare size={13} style={{ marginTop: '3px', flexShrink: 0, opacity: 0.7 }} />
                      <span style={{ wordBreak: 'break-word' }}>{report.description}</span>
                    </p>
                  )}

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditReport(report);
                      }}
                      style={{
                        background: 'rgba(8, 145, 178, 0.1)',
                        border: '1px solid rgba(8, 145, 178, 0.3)',
                        color: '#0891b2',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(8, 145, 178, 0.2)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'rgba(8, 145, 178, 0.1)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Edit Details
                    </button>
                  </div>
                </Motion.div>
              ))
            )
          ) : (
            deletedReports.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px', 
                color: '#8899a6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trash2 size={24} style={{ color: '#ef4444', opacity: 0.7 }} />
                </div>
                <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>No deleted reports</p>
              </div>
            ) : (
              deletedReports.map((report, index) => (
                <Motion.div 
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  style={{
                    background: 'rgba(220, 38, 38, 0.05)',
                    border: '1px solid rgba(220, 38, 38, 0.15)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '10px',
                    opacity: 0.7
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: '#dc2626',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid rgba(220, 38, 38, 0.2)'
                    }}>
                      Deleted
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#8899a6',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 style={{ 
                    margin: '0 0 6px 0', 
                    fontSize: '0.95rem', 
                    fontWeight: '600',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: '#8899a6'
                  }}>
                    <MapPin size={14} style={{ color: '#5c6b7a', flexShrink: 0 }} />
                    {report.location_name}
                  </h4>
                  
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#5c6b7a' }}>
                    Was: {report.water_level}
                  </p>
                </Motion.div>
              ))
            )
          )}
        </div>
      </Motion.div>
    </>
  );
};

export default Sidebar;
