 import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const AlertBanner = ({ reports }) => {
  const extremeReports = reports.filter(r => 
    r.water_level === 'Extreme' && 
    (new Date() - new Date(r.created_at)) < (1000 * 60 * 60 * 3) // Last 3 hours
  );

  if (extremeReports.length === 0) return null;

  return (
    <Motion.div 
      className="alert-banner"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      style={{
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.85) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 3000,
        position: 'relative',
        boxShadow: '0 4px 30px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Animated pulse background */}
      <Motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
          pointerEvents: 'none'
        }}
      />
      
      <Motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '8px',
          borderRadius: '10px'
        }}
      >
        <AlertOctagon size={22} strokeWidth={2.5} />
      </Motion.div>
      
      <div style={{ 
        fontWeight: '600', 
        fontSize: '0.9rem', 
        letterSpacing: '0.02em',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
      }}>
        <span style={{ 
          fontWeight: '700', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em',
          marginRight: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem'
        }}>
          Critical
        </span>
        {extremeReports.length} Extreme flood{extremeReports.length > 1 ? 's' : ''} reported — {extremeReports.slice(0, 2).map(r => r.location_name).join(', ')}{extremeReports.length > 2 ? ` +${extremeReports.length - 2} more` : ''}
      </div>
      
      <div style={{ 
        marginLeft: 'auto', 
        fontSize: '0.8rem', 
        opacity: 0.85,
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ 
          width: '6px', 
          height: '6px', 
          background: '#fff', 
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite'
        }} />
        Avoid these areas
      </div>
    </Motion.div>
  );
};

export default AlertBanner;
