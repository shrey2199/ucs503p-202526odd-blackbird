import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure Leaflet is available globally
if (typeof window !== 'undefined') {
  window.L = L;
}

// Fix for default marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e);
      }
    },
  });
  return null;
}

// Component to update map center when coordinates change externally (not during drag)
function MapCenter({ center, zoom, shouldUpdate }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  useEffect(() => {
    if (shouldUpdate && center) {
      const centerStr = `${center[0]},${center[1]}`;
      const lastCenterStr = lastCenterRef.current ? `${lastCenterRef.current[0]},${lastCenterRef.current[1]}` : null;
      
      // Only update if center actually changed
      if (centerStr !== lastCenterStr) {
        map.setView(center, zoom);
        lastCenterRef.current = center;
      }
    }
  }, [center, zoom, map, shouldUpdate]);

  return null;
}

const LocationMap = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  storedLocation = null 
}) => {
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldUpdateCenter, setShouldUpdateCenter] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const lastStoredLocationRef = useRef(null);

  // Initialize position from props
  useEffect(() => {
    if (latitude && longitude && !isDragging) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const newPos = [lat, lng];
        setPosition((prevPos) => {
          // Only update if position actually changed
          if (!prevPos || Math.abs(prevPos[0] - newPos[0]) > 0.0001 || Math.abs(prevPos[1] - newPos[1]) > 0.0001) {
            setShouldUpdateCenter(true);
            setTimeout(() => setShouldUpdateCenter(false), 200);
            return newPos;
          }
          return prevPos;
        });
      }
    } else if (!latitude || !longitude) {
      setPosition(null);
    }
  }, [latitude, longitude, isDragging]);

  // Handle stored location update
  useEffect(() => {
    if (storedLocation && storedLocation.coordinates && storedLocation.coordinates.length === 2 && !isDragging) {
      const [lng, lat] = storedLocation.coordinates;
      const storedKey = `${lat},${lng}`;
      const lastKey = lastStoredLocationRef.current;
      
      // Only update if this is a new stored location
      if (storedKey !== lastKey) {
        const newPosition = [lat, lng];
        setPosition(newPosition);
        setShouldUpdateCenter(true);
        lastStoredLocationRef.current = storedKey;
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
        setTimeout(() => setShouldUpdateCenter(false), 200);
      }
    }
  }, [storedLocation, onLocationChange, isDragging]);

  const handleMarkerDragStart = () => {
    setIsDragging(true);
  };

  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    const newPosition = [lat, lng];
    setPosition(newPosition);
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  const handleMarkerDragEnd = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e) => {
    // Always allow clicking anywhere on the map to place pin
    const { lat, lng } = e.latlng;
    console.log('Map clicked at:', lat, lng); // Debug log
    const newPosition = [lat, lng];
    setPosition(newPosition);
    setIsDragging(false); // Reset dragging state
    setShouldUpdateCenter(true); // Center map on clicked location with zoom
    setTimeout(() => setShouldUpdateCenter(false), 100);
    if (onLocationChange) {
      onLocationChange(lat, lng);
    }
  };

  // Default center to India if no position
  const defaultCenter = [20.5937, 78.9629];
  const currentCenter = position || defaultCenter;
  const currentZoom = position ? 16 : 5; // Zoom in more when position is set

  // Ensure map is ready after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof L !== 'undefined') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Format coordinates for display
  const formatCoordinate = (coord) => {
    if (!coord) return 'N/A';
    const num = parseFloat(coord);
    return isNaN(num) ? 'N/A' : num.toFixed(6);
  };

  return (
    <div className="w-full">
      <div className="relative h-64 rounded-xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {/* Coordinate Labels */}
        {position && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Lat:</span>
                <span className="font-mono text-primary-600 dark:text-primary-400">{formatCoordinate(latitude || position[0])}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Lng:</span>
                <span className="font-mono text-primary-600 dark:text-primary-400">{formatCoordinate(longitude || position[1])}</span>
              </div>
            </div>
          </div>
        )}
        {typeof window !== 'undefined' && typeof L !== 'undefined' && mapReady && (
          <MapContainer
            center={currentCenter}
            zoom={currentZoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            zoomControl={true}
            ref={mapRef}
            dragging={true}
            whenReady={() => {
              // Force map to invalidate size after tiles load
              if (mapRef.current) {
                const map = mapRef.current;
                setTimeout(() => {
                  map.invalidateSize();
                }, 100);
              }
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
              minZoom={1}
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {position && (
              <Marker
                position={position}
                draggable={true}
                eventHandlers={{
                  dragstart: handleMarkerDragStart,
                  drag: handleMarkerDrag,
                  dragend: handleMarkerDragEnd,
                }}
              />
            )}
            <MapCenter center={currentCenter} zoom={currentZoom} shouldUpdate={shouldUpdateCenter} />
          </MapContainer>
        )}
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-700/80 z-[1000] pointer-events-none">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Click on the map or use buttons above to set location
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;

