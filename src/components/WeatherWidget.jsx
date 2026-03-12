import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  Sun, CloudSun, Cloud, CloudFog, CloudRain, 
  CloudDrizzle, CloudLightning, Snowflake, Wind, AlertCircle 
} from 'lucide-react';

// Open-Meteo weather code mapping
const getWeatherDetails = (code) => {
  // WMO Weather interpretation codes (WW)
  switch (true) {
    case code === 0:
      return { icon: Sun, label: 'Clear sky', color: '#f59e0b' };
    case code === 1:
      return { icon: CloudSun, label: 'Mainly clear', color: '#fbbf24' };
    case code === 2:
      return { icon: CloudSun, label: 'Partly cloudy', color: '#8899a6' };
    case code === 3:
      return { icon: Cloud, label: 'Overcast', color: '#64748b' };
    case [45, 48].includes(code):
      return { icon: CloudFog, label: 'Fog', color: '#94a3b8' };
    case [51, 53, 55, 56, 57].includes(code):
      return { icon: CloudDrizzle, label: 'Drizzle', color: '#0891b2' };
    case [61, 63, 65, 66, 67, 80, 81, 82].includes(code):
      return { icon: CloudRain, label: 'Rain', color: '#0ea5e9' };
    case [71, 73, 75, 77, 85, 86].includes(code):
      return { icon: Snowflake, label: 'Snow', color: '#e0f2fe' };
    case [95, 96, 99].includes(code):
      return { icon: CloudLightning, label: 'Thunderstorm', color: '#fbbf24' };
    default:
      return { icon: Wind, label: 'Unknown', color: '#8899a6' };
  }
};

const WeatherWidget = ({ isWeatherEnabled, onToggleWeather, onResetWeather, onWeatherReady }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isWeatherEnabled) {
      setError(null);
      setWeather(null);
      if (onWeatherReady) onWeatherReady();
      return;
    }

    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      if (onWeatherReady) onWeatherReady();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Open-Meteo API doesn't require an API key
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          
          if (!response.ok) throw new Error("Failed to fetch weather");
          
          const data = await response.json();
          setWeather(data.current_weather);
          setError(null);
        } catch (err) {
          console.error("Weather fetch error:", err);
          setError("Failed to load");
        } finally {
          setLoading(false);
          if (onWeatherReady) onWeatherReady();
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setError("Location denied");
        setLoading(false);
        if (onWeatherReady) onWeatherReady();
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeatherEnabled]);

  if (!isWeatherEnabled) {
    return (
      <Motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggleWeather}
        className="glass"
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(17, 24, 39, 0.8)',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.25s ease'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5px',
          background: 'rgba(14, 165, 233, 0.15)',
          borderRadius: '6px'
        }}>
          <CloudSun size={16} style={{ color: '#0ea5e9' }} />
        </div>
        <span style={{ color: '#f0f4f8', fontWeight: '600', fontSize: '0.85rem' }}>
          Enable Weather
        </span>
      </Motion.button>
    );
  }

  if (loading) return null;

  const weatherDetails = weather ? getWeatherDetails(weather.weathercode) : null;

  return (
    <Motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass weather-container"
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
      {error ? (
        <Motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onResetWeather}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: 0,
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <AlertCircle size={18} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.8rem', color: '#8899a6' }}>{error} <span style={{ color: '#0891b2' }}>(Retry)</span></span>
        </Motion.button>
      ) : weather ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            background: `linear-gradient(135deg, ${weatherDetails.color}22 0%, ${weatherDetails.color}11 100%)`,
            borderRadius: '8px'
          }}>
            {React.createElement(weatherDetails.icon, { 
              size: 18, 
              style: { color: weatherDetails.color } 
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              lineHeight: '1.2',
              color: '#f0f4f8',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {Math.round(weather.temperature)}°C
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              color: '#8899a6', 
              textTransform: 'capitalize',
              fontWeight: '500'
            }}>
              {weatherDetails.label}
            </span>
          </div>
        </>
      ) : null}
    </Motion.div>
  );
};

export default WeatherWidget;
