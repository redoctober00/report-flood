import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored markers based on water level and optional image
const getMarkerIcon = (report) => {
  const colors = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Extreme: '#dc2626'
  };
  
  const color = colors[report.water_level] || '#0891b2';
  
  if (report.image_url) {
    return L.divIcon({
      html: `
        <div style="
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          border: 3px solid ${color}; 
          box-shadow: 0 0 20px ${color}60, 0 4px 12px rgba(0,0,0,0.4);
          overflow: hidden;
          background-color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <img src="${report.image_url}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 14px;
            height: 14px;
            background-color: ${color};
            border-radius: 50%;
            border: 2px solid #111827;
          "></div>
        </div>
      `,
      className: 'custom-image-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 0 12px ${color}90, 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const getUserIcon = (num) => {
  return L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #0891b2 0%, #14b8a6 100%); 
        color: white; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        border: 2px solid rgba(255,255,255,0.9); 
        box-shadow: 0 0 16px rgba(8, 145, 178, 0.6), 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">${num}</div>`,
    className: 'custom-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const getRoadBlockIcon = () => {
  return L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
        color: white; 
        width: 12px; 
        height: 12px; 
        border-radius: 4px; 
        border: 2px solid rgba(255,255,255,0.9); 
        box-shadow: 0 0 12px rgba(220, 38, 38, 0.6), 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
      ">⛔</div>`,
    className: 'custom-roadblock-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function MapEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Component to fly to a location
function FlyToLocation({ location }) {
  const map = useMap();
  
  useEffect(() => {
    if (location && location.lat && location.lng) {
      map.flyTo([location.lat, location.lng], 15, {
        duration: 1.5
      });
    }
  }, [location, map]);
  
  return null;
}

const Map = ({ reports, activeUsers = [], onMapClick, flyToLocation, isDarkMode = true, showRoadblocks = false, onMapReady, onRoadblocksReady }) => {
  const center = [14.5995, 120.9842]; // Manila default

  const [roadBlockings, setRoadBlockings] = React.useState([]);

  React.useEffect(() => {
    if (onMapReady) onMapReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const fetchRoadBlockings = async () => {
      try {
        const cachedData = sessionStorage.getItem('roadBlockingsData');
        const cacheTime = sessionStorage.getItem('roadBlockingsTime');
        const now = new Date().getTime();

        // Use cache if less than 15 minutes old (900000 ms)
        if (cachedData && cacheTime && now - parseInt(cacheTime) < 900000) {
          setRoadBlockings(JSON.parse(cachedData));
          if (onRoadblocksReady) onRoadblocksReady();
          return;
        }

        const query = `
          [out:json][timeout:25];
          (
            node["barrier"="block"](14.3, 120.8, 14.8, 121.1);
            way["highway"="construction"](14.3, 120.8, 14.8, 121.1);
          );
          out center;
        `;
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'data=' + encodeURIComponent(query)
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Overpass API rate limit reached, will retry later.');
            return;
          }
          throw new Error(`API returned ${response.status}`);
        }

        const textRes = await response.text();
        let data;
        try {
          data = JSON.parse(textRes);
        } catch {
          console.warn('Overpass API returned non-JSON data (possibly an XML error message):', textRes.substring(0, 100));
          return;
        }

        if (data && data.elements) {
          const blockings = data.elements.map(el => {
            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;
            return {
              id: el.id,
              lat,
              lon,
              type: el.tags?.barrier || el.tags?.highway || 'road closure',
              description: el.tags?.description || el.tags?.note || 'Road blocked or under construction'
            };
          }).filter(b => b.lat && b.lon);
          
          sessionStorage.setItem('roadBlockingsData', JSON.stringify(blockings));
          sessionStorage.setItem('roadBlockingsTime', now.toString());
          
          setRoadBlockings(blockings);
        }
      } catch (err) {
        console.error('Failed to fetch road blockings:', err);
      } finally {
        if (onRoadblocksReady) onRoadblocksReady();
      }
    };
    
    fetchRoadBlockings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lightTileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer center={center} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          key={isDarkMode ? 'dark' : 'light'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDarkMode ? darkTileUrl : lightTileUrl}
        />
      
      {reports.map((report) => (
        <React.Fragment key={report.id}>
          <Marker 
            position={[report.latitude, report.longitude]}
            icon={getMarkerIcon(report)}
          >
            <Popup>
              <div style={{ color: 'var(--text-primary)' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{report.location_name}</h3>
                <p><strong>Level:</strong> <span style={{ color: getMarkerIcon(report).options.html.match(/(#[a-f0-9]+)/)[1] }}>{report.water_level}</span></p>
                <p>{report.description}</p>
                <p><strong>Radius:</strong> {report.radius || 500}m</p>
                <small>{new Date(report.created_at).toLocaleString()}</small>
              </div>
            </Popup>
          </Marker>
          <Circle 
            center={[report.latitude, report.longitude]}
            radius={report.radius || 500}
            pathOptions={{
              color: getMarkerIcon(report).options.html.match(/(#[a-f0-9]+)/)[1],
              fillColor: getMarkerIcon(report).options.html.match(/(#[a-f0-9]+)/)[1],
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        </React.Fragment>
      ))}

      {activeUsers && activeUsers.map(user => (
        <Marker
          key={user.id}
          position={[user.lat, user.lng]}
          icon={getUserIcon(user.num)}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>User #{user.num}</strong><br/>
              <small>Live Location</small>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapEvents onClick={onMapClick} />
      <FlyToLocation location={flyToLocation} />

      {showRoadblocks && roadBlockings.map(block => (
        <Marker
          key={`block-${block.id}`}
          position={[block.lat, block.lon]}
          icon={getRoadBlockIcon()}
        >
          <Popup>
            <div style={{ color: 'var(--text-primary)' }}>
              <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '18px' }}>⛔</span> Road Blocking
              </h3>
              <p><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{block.type}</span></p>
              <p>{block.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </div>
  );
};

export default Map;
