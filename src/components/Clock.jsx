import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Clock as ClockIcon } from 'lucide-react';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass clock-container"
      style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderRadius: '14px',
        width: '100%',
        boxSizing: 'border-box',
        background: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
        borderRadius: '8px'
      }}>
        <ClockIcon size={16} className="clock-icon" style={{ color: '#0891b2' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span 
          className="clock-time" 
          style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            lineHeight: '1.2',
            color: '#f0f4f8',
            letterSpacing: '0.02em'
          }}
        >
          {formatTime(time)}
        </span>
        <span 
          className="clock-date" 
          style={{ 
            fontSize: '0.7rem', 
            color: '#8899a6',
            fontWeight: '500',
            letterSpacing: '0.01em'
          }}
        >
          {formatDate(time)}
        </span>
      </div>
    </Motion.div>
  );
};

export default Clock;
