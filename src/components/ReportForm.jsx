import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { X, MapPin, Droplets, Navigation, Trash2, Camera, Upload, AlertTriangle } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Location picker marker
const pickerIcon = L.divIcon({
  html: `<div style="background-color: #6366f1; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);"></div>`,
  className: 'picker-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Component to handle map clicks
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

// Component to recenter map when location changes
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}


const ReportForm = ({ onClose, initialLocation, editingReport, reports = [] }) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pinError, setPinError] = useState('');
  const [locationErrorMsg, setLocationErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    location_name: '',
    water_level: 'Low',
    description: '',
    reporter_name: '',
    radius: 50,
    latitude: 14.5995,
    longitude: 120.9842,
    image_url: null
  });

  useEffect(() => {
    setFormData({
      location_name: editingReport?.location_name || '',
      water_level: editingReport?.water_level || 'Low',
      description: editingReport?.description || '',
      reporter_name: editingReport?.reporter_name || '',
      radius: editingReport?.radius || 50,
      latitude: initialLocation?.lat || editingReport?.latitude || 14.5995,
      longitude: initialLocation?.lng || editingReport?.longitude || 120.9842,
      image_url: editingReport?.image_url || null
    });
    
    if (editingReport?.image_url) {
      setImagePreview(editingReport.image_url);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
  }, [editingReport, initialLocation]);

  // Validate boundaries and perform reverse geocoding
  const validateAndSetLocation = async (lat, lng) => {
    setPinError('');
    
    // 1. Check existing reports
    for (const report of reports) {
      if (editingReport && report.id === editingReport.id) continue;
      const dist = getDistance(lat, lng, report.latitude, report.longitude);
      if (dist <= report.radius) {
        setPinError(`Cannot pin here. This location is already marked as flooded (within ${report.location_name || 'an existing area'}'s radius).`);
        return; // Stop update
      }
    }
    
    // Temporarily set coords to allow UI marker to move while geocoding
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    
    // 2. Reverse geocode and check water bodies
    setGeocoding(true);
    let waterBodyDetected = false;
    let locationName = '';
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // Prioritize bodies of water if present
        const waterBody = addr.waterway || addr.river || addr.lake || addr.bay || addr.ocean || addr.sea || (addr.natural === 'water' ? 'body of water' : null);
        if (waterBody) {
          waterBodyDetected = true;
          setPinError(`Cannot pin directly inside a body of water (${waterBody}). Please pin the flooded land area.`);
        } else {
          // Build a readable location name
          const parts = [];
          if (addr.road || addr.street) parts.push(addr.road || addr.street);
          if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
          if (addr.city || addr.town || addr.village || addr.municipality) {
            parts.push(addr.city || addr.town || addr.village || addr.municipality);
          }
          
          locationName = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',');
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    setGeocoding(false);
    
    if (waterBodyDetected) {
      return; // Stop update
    }

    setFormData(prev => ({
      ...prev,
      location_name: locationName || prev.location_name || ''
    }));
  };

  const handleGetCurrentLocation = () => {
    setLocating(true);
    setLocationErrorMsg('');
    
    if (!navigator.geolocation) {
      setLocationErrorMsg("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        validateAndSetLocation(lat, lng);
        setLocating(false);
      },
      (error) => {
        let errorMsg = "Unable to retrieve your location: " + error.message;
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please allow location permissions in your device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is currently unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "The request to get your location timed out. Please try again.";
        }
        
        setLocationErrorMsg(errorMsg);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('report-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      alert('Error uploading image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let imageUrl = formData.image_url;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setLoading(false);
        return; // Stop submission if upload fails
      }
    }
    
    const finalFormData = { ...formData, image_url: imageUrl };
    
    let result;
    if (editingReport) {
      result = await supabase
        .from('reports')
        .update(finalFormData)
        .eq('id', editingReport.id);
    } else {
      result = await supabase
        .from('reports')
        .insert([finalFormData]);
    }
    
    const { error } = result;

    if (error) {
      alert('Error submitting report: ' + error.message);
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('reports')
      .update({ is_deleted: true })
      .eq('id', editingReport.id);

    if (error) {
      alert('Error deleting report: ' + error.message);
      setDeleting(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 4000,
      padding: '20px'
    }}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: '20px'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{
              padding: '28px',
              borderRadius: '18px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(220, 38, 38, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trash2 size={28} style={{ color: '#dc2626' }} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: '700', color: '#f0f4f8' }}>Delete Report?</h3>
            <p style={{ color: '#8899a6', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f0f4f8',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}

      <Motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="glass modal-content" 
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            color: '#8899a6', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          fontSize: '1.4rem',
          fontWeight: '700',
          color: '#f0f4f8'
        }}>
          <div style={{
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
            borderRadius: '12px'
          }}>
            <Droplets size={24} style={{ color: '#0891b2' }} />
          </div>
          {editingReport ? 'Update Report' : 'Report Flood'}
        </h2>


        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {!editingReport && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>
                  Location Name {geocoding && <span style={{ color: '#0891b2', fontSize: '0.75rem' }}>(detecting...)</span>}
                </label>
                <input 
                  required
                  type="text" 
                  placeholder={geocoding ? 'Getting location name...' : 'e.g. Taft Avenue, Manila'}
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    color: '#f0f4f8',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.95rem'
                  }}
                  value={formData.location_name}
                  onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>Pin Location</label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locating}
                    style={{
                      background: 'rgba(8, 145, 178, 0.1)',
                      border: '1px solid rgba(8, 145, 178, 0.3)',
                      color: '#0891b2',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(8, 145, 178, 0.2)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(8, 145, 178, 0.1)'}
                  >
                    <Navigation size={12} />
                    {locating ? 'Locating...' : 'Use My Location'}
                  </button>
                </div>
                <div style={{ 
                  height: '180px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={12} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <Marker 
                      position={[formData.latitude, formData.longitude]}
                      icon={pickerIcon}
                    />
                    <LocationPicker 
                      onLocationSelect={(latlng) => {
                        validateAndSetLocation(latlng.lat, latlng.lng);
                      }}
                    />
                    <MapRecenter lat={formData.latitude} lng={formData.longitude} />
                  </MapContainer>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#5c6b7a', marginTop: '8px' }}>
                  Click on the map to pin flood location
                </p>
                {pinError && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '10px', color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', lineHeight: '1.4' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    {pinError}
                  </div>
                )}
                {locationErrorMsg && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '10px', color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', lineHeight: '1.4' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    {locationErrorMsg}
                  </div>
                )}
              </div>
            </>
          )}

          {editingReport && (
            <div style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)', border: '1px solid rgba(8, 145, 178, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', color: '#0891b2', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editing Details for:</span>
              <strong style={{ fontSize: '1.1rem', color: '#f0f4f8', fontWeight: '600' }}>{formData.location_name}</strong>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>Water Level</label>
            <select 
              style={{ 
                width: '100%', 
                padding: '12px 14px', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                color: '#f0f4f8',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
              value={formData.water_level}
              onChange={(e) => setFormData({...formData, water_level: e.target.value})}
            >
              <option value="Low">Low (Ankle deep)</option>
              <option value="Medium">Medium (Knee deep)</option>
              <option value="High">High (Waist deep)</option>
              <option value="Extreme">Extreme (Submerged)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>
              Flood Radius: <span style={{ color: '#0891b2', fontWeight: '700' }}>{formData.radius}m</span>
            </label>
            <input 
              type="range"
              min="50"
              max="2000"
              step="50"
              style={{ width: '100%', accentColor: '#0891b2', height: '6px' }}
              value={formData.radius}
              onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>
              Photo (Optional)
            </label>
            <div style={{
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: imagePreview ? '8px' : '24px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => document.getElementById('image-upload').click()}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(8, 145, 178, 0.5)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            >
              <input 
                id="image-upload"
                type="file" 
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              
              {imagePreview ? (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'white',
                    fontWeight: '600'
                  }} className="hover-overlay-btn"
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <Upload size={20} /> <span style={{ marginLeft: '8px' }}>Change Photo</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#8899a6' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(8, 145, 178, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={22} style={{ color: '#0891b2' }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Click to upload a photo</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Max 5MB • JPG, PNG</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#8899a6', fontSize: '0.85rem', fontWeight: '500' }}>Description (Optional)</label>
            <textarea 
              rows="3"
              placeholder="Any additional details..."
              style={{ 
                width: '100%', 
                padding: '12px 14px', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                color: '#f0f4f8',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.95rem',
                resize: 'vertical',
                minHeight: '80px'
              }}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            disabled={loading || uploadingImage || !!pinError}
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '0.95rem' }}
          >
            {loading || uploadingImage ? 'Submitting...' : editingReport ? 'Update Report' : 'Submit Report'}
          </button>

          {editingReport && (
            <button 
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              style={{ 
                width: '100%', 
                padding: '12px', 
                marginTop: '6px',
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: '#dc2626',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.15)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.08)'}
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete This Report'}
            </button>
          )}
        </form>
      </Motion.div>
    </div>
  );
};

export default ReportForm;
