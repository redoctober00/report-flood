import React from 'react';
import { motion as Motion } from 'framer-motion';
import { CheckCircle2, CircleDashed, Droplets } from 'lucide-react';

const ProgressItem = ({ label, isDone, delay }) => (
  <Motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.4, ease: "easeOut" }}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '14px', 
      background: isDone 
        ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)'
        : 'rgba(255,255,255,0.02)', 
      padding: '14px 18px', 
      borderRadius: '12px', 
      border: `1px solid ${isDone ? 'rgba(8, 145, 178, 0.3)' : 'rgba(255,255,255,0.06)'}`,
      backdropFilter: 'blur(8px)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
  >
    {isDone ? (
      <Motion.div 
        initial={{ scale: 0, rotate: -180 }} 
        animate={{ scale: 1, rotate: 0 }} 
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <CheckCircle2 style={{ color: '#14b8a6' }} size={22} />
      </Motion.div>
    ) : (
      <Motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      >
        <CircleDashed style={{ color: '#0891b2' }} size={22} />
      </Motion.div>
    )}
    <span style={{ 
      color: isDone ? '#f0f4f8' : '#8899a6', 
      fontWeight: isDone ? '600' : '400',
      fontSize: '0.95rem',
      letterSpacing: '0.01em',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {label}
    </span>
  </Motion.div>
);

const LoadingScreen = ({ stages }) => {
  return (
    <Motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999,
        background: '#0a0f1a',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* Animated gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 100% 80% at 50% 0%, rgba(8, 145, 178, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 100% 100%, rgba(20, 184, 166, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 0% 80%, rgba(245, 158, 11, 0.04) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />

      {/* Floating particles */}
      <Motion.div 
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        style={{ 
          position: 'absolute', 
          top: '15%', 
          left: '20%', 
          width: 6, 
          height: 6, 
          background: '#0891b2', 
          borderRadius: '50%', 
          filter: 'blur(1px)',
          opacity: 0.6
        }}
      />
      <Motion.div 
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 0.5 }}
        style={{ 
          position: 'absolute', 
          top: '60%', 
          right: '25%', 
          width: 4, 
          height: 4, 
          background: '#14b8a6', 
          borderRadius: '50%', 
          filter: 'blur(1px)',
          opacity: 0.5
        }}
      />
      <Motion.div 
        animate={{ y: [-15, 15, -15], x: [5, -5, 5] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
        style={{ 
          position: 'absolute', 
          bottom: '25%', 
          left: '15%', 
          width: 5, 
          height: 5, 
          background: '#f59e0b', 
          borderRadius: '50%', 
          filter: 'blur(1px)',
          opacity: 0.4
        }}
      />

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
        {/* Logo and Title */}
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <Motion.div
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(8, 145, 178, 0)',
                '0 0 0 12px rgba(8, 145, 178, 0.1)',
                '0 0 0 0 rgba(8, 145, 178, 0)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #14b8a6 100%)',
              padding: '16px', 
              borderRadius: '18px',
            }}
          >
            <Droplets size={40} color="white" strokeWidth={2.5} />
          </Motion.div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 8vw, 2.75rem)', 
            fontWeight: '800', 
            margin: 0, 
            letterSpacing: '-0.03em', 
            color: '#f0f4f8',
            background: 'linear-gradient(135deg, #f0f4f8 0%, #8899a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ReportFlood
          </h1>
        </Motion.div>
        
        <Motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ 
            fontSize: '1rem', 
            color: '#8899a6', 
            marginBottom: '40px', 
            fontWeight: '500', 
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Real-time Flood Monitoring
        </Motion.p>

        {/* Progress Items */}
        <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ProgressItem label="Initializing Map" isDone={stages.map} delay={0} />
          <ProgressItem label="Loading Flood Reports" isDone={stages.reports} delay={1} />
          <ProgressItem label="Fetching Road Closures" isDone={stages.roadblocks} delay={2} />
          <ProgressItem label="Loading Weather Data" isDone={stages.weather} delay={3} />
        </div>

        {/* Loading bar */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '32px',
            width: '200px',
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <Motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #0891b2, transparent)',
              borderRadius: '2px'
            }}
          />
        </Motion.div>
      </div>
    </Motion.div>
  );
};

export default LoadingScreen;
