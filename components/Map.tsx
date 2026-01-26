import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationInput, Place } from '../types';
import { PencilIcon, CheckIcon, ExpandIcon, XIcon } from './Icons';

interface MapProps {
  locations: LocationInput[];
  midpoint?: { lat: number; lng: number } | null;
  places?: Place[];
  radius?: number; // Radius in meters
  onMidpointChange?: (lat: number, lng: number, radius: number) => void;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (placeId: string) => void;
}

export const Map: React.FC<MapProps> = ({ 
  locations, 
  midpoint, 
  places = [], 
  radius = 2000, 
  onMidpointChange,
  selectedPlaceId,
  onPlaceSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const midpointMarkerRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const prevLocationsRef = useRef<string>("");
  const placeMarkersRef = useRef<{[id: string]: L.Marker}>({});
  
  // Track temporary position during editing so re-renders (like slider changes) don't reset it
  const tempMidpointRef = useRef<{lat: number; lng: number} | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentRadius, setCurrentRadius] = useState(radius);

  // Sync internal radius state with prop when not editing
  useEffect(() => {
    if (!isEditing) {
        setCurrentRadius(radius);
    }
  }, [radius, isEditing]);

  // Reset temp midpoint when the actual midpoint prop changes (e.g. new search or saved update)
  useEffect(() => {
    tempMidpointRef.current = null;
  }, [midpoint]);

  // Cape Town Coordinates
  const DEFAULT_CENTER: [number, number] = [-33.9249, 18.4241];

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear existing layers
    layerGroup.clearLayers();
    midpointMarkerRef.current = null;
    polylinesRef.current = [];
    placeMarkersRef.current = {};

    const validLocations = locations.filter(loc => loc.coords);
    
    // Icons
    const createUserIcon = (avatar: string) => L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #4F46E5; width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 16px;">${avatar}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    const midpointIcon = L.divIcon({
      className: 'midpoint-icon',
      html: `<div style="background-color: #F59E0B; width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: ${isEditing ? 'move' : 'default'};">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18]
    });

    const createPlaceIcon = (idx: number) => L.divIcon({
      className: 'place-icon',
      html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 10px;">${idx + 1}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const bounds = L.latLngBounds([]);

    // 1. Add User Markers
    validLocations.forEach((loc) => {
      if (loc.coords) {
        const point: [number, number] = [loc.coords.lat, loc.coords.lng];
        L.marker(point, { icon: createUserIcon(loc.avatar) })
          .bindPopup(`<b>${loc.name}</b><br>${loc.value}`)
          .addTo(layerGroup);
        bounds.extend(point);
      }
    });

    // 2. Add Midpoint and Search Radius
    // Determine which coordinates to use: temp (dragged) or prop (saved)
    let displayMidpoint = midpoint;
    if (isEditing && tempMidpointRef.current) {
        displayMidpoint = tempMidpointRef.current;
    }

    if (displayMidpoint) {
      const midPointTuple: [number, number] = [displayMidpoint.lat, displayMidpoint.lng];
      
      // Add Search Area Circle (uses currentRadius state)
      const midpointCircle = L.circle(midPointTuple, {
        color: '#F59E0B',      // Same orange as the pin
        fillColor: '#F59E0B',
        fillOpacity: 0.15,     // Faint search area
        weight: 1,
        radius: currentRadius
      }).addTo(layerGroup);

      const marker = L.marker(midPointTuple, { 
        icon: midpointIcon,
        draggable: isEditing,
        zIndexOffset: 1000 // Keep on top
      });

      if (isEditing) {
        marker.on('drag', (e) => {
          const newLatLng = e.target.getLatLng();
          // Store temp position so re-renders (slider updates) use this position
          tempMidpointRef.current = { lat: newLatLng.lat, lng: newLatLng.lng };
          
          // Move the circle along with the marker
          midpointCircle.setLatLng(newLatLng);

          // Update all polylines connected to this midpoint
          polylinesRef.current.forEach((poly) => {
             const latLngs = poly.getLatLngs() as L.LatLng[];
             // Assuming [start, end] where end is midpoint
             if (latLngs.length === 2) {
                 poly.setLatLngs([latLngs[0], newLatLng]);
             }
          });
        });
        
        marker.on('dragend', () => {
           setHasChanges(true);
        });
      } else {
         marker.bindPopup(`<b>Geometric Midpoint</b><br>Diameter: ${((currentRadius * 2)/1000).toFixed(1)}km`);
      }

      marker.addTo(layerGroup);
      midpointMarkerRef.current = marker;
      bounds.extend(midPointTuple);
      // Ensure circle is included in bounds if we were to fitBounds
      bounds.extend(midpointCircle.getBounds());

      // Add dashed lines
      validLocations.forEach(loc => {
        if (loc.coords) {
          const poly = L.polyline([[loc.coords.lat, loc.coords.lng], midPointTuple], {
            color: '#6366f1',
            weight: 2,
            opacity: 0.5,
            dashArray: '6, 8'
          }).addTo(layerGroup);
          polylinesRef.current.push(poly);
        }
      });
    }

    // 3. Add Restaurant Markers
    if (places && places.length > 0) {
      places.forEach((place, idx) => {
        const marker = L.marker([place.lat, place.lng], { icon: createPlaceIcon(idx) })
          .bindPopup(`<b>${place.name}</b><br>${place.type}`)
          .addTo(layerGroup);
        
        // Add click listener to select place
        marker.on('click', () => {
          if (onPlaceSelect) {
            onPlaceSelect(place.id);
          }
        });
        
        placeMarkersRef.current[place.id] = marker;
        bounds.extend([place.lat, place.lng]);
      });
    }

    // Fit bounds only if locations (inputs) have changed or it's the first significant load
    // This prevents zooming out when dragging the midpoint pin (editing) or changing radius
    const locationsKey = JSON.stringify(validLocations.map(l => l.coords));
    const locationsChanged = locationsKey !== prevLocationsRef.current;

    if (validLocations.length > 0 && !isEditing) {
      if (locationsChanged) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        prevLocationsRef.current = locationsKey;
      }
    } else if (validLocations.length === 0) {
      map.setView(DEFAULT_CENTER, 11);
    }

  }, [locations, midpoint, places, isEditing, currentRadius]);

  // Handle flying to selected place
  useEffect(() => {
    if (selectedPlaceId && mapInstanceRef.current && placeMarkersRef.current[selectedPlaceId]) {
      const marker = placeMarkersRef.current[selectedPlaceId];
      mapInstanceRef.current.flyTo(marker.getLatLng(), 16, {
        animate: true,
        duration: 1.5
      });
      marker.openPopup();
    }
  }, [selectedPlaceId]);

  const toggleEdit = () => {
    if (isEditing) {
      // CANCEL Changes: Revert to original props
      setIsEditing(false);
      setHasChanges(false);
      setCurrentRadius(radius);
      tempMidpointRef.current = null;
    } else {
      // Start Editing
      setIsEditing(true);
      setHasChanges(false);
      setCurrentRadius(radius); // Ensure we start with current prop radius
    }
  };

  const saveChanges = () => {
    if (midpointMarkerRef.current && onMidpointChange) {
      const { lat, lng } = midpointMarkerRef.current.getLatLng();
      onMidpointChange(lat, lng, currentRadius);
    }
    setIsEditing(false);
    setHasChanges(false);
    tempMidpointRef.current = null;
  };

  const handleZoomToFriends = () => {
     if (!mapInstanceRef.current) return;
     const validLocations = locations.filter(loc => loc.coords);
     if (validLocations.length === 0) return;
     
     const bounds = L.latLngBounds(validLocations.map(l => [l.coords!.lat, l.coords!.lng]));
     if (midpoint) bounds.extend([midpoint.lat, midpoint.lng]); 
     
     mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  const handleZoomToPlaces = () => {
    if (!mapInstanceRef.current || places.length === 0) return;
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
    if (midpoint) bounds.extend([midpoint.lat, midpoint.lng]);
    
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Slider Control Container */}
      {midpoint && isEditing && (
         <div className="absolute top-4 right-16 z-[400] flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            
            {/* Check/Save Button - Only visible if changes made */}
            {hasChanges && (
                <button
                    onClick={saveChanges}
                    className="w-8 h-8 flex items-center justify-center rounded-full shadow-md bg-green-500 hover:bg-green-600 text-white transition-all transform hover:scale-110"
                    title="Save changes"
                >
                    <CheckIcon className="w-4 h-4" />
                </button>
            )}

            {/* Slider Pill */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm py-2 px-4 rounded-full shadow-md border border-gray-200">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">2km</span>
                <input
                    type="range"
                    min="2000"
                    max="10000"
                    step="100"
                    value={currentRadius * 2}
                    onChange={(e) => {
                        setCurrentRadius(Number(e.target.value) / 2);
                        setHasChanges(true);
                    }}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">10km</span>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap z-50">
                    {((currentRadius * 2) / 1000).toFixed(1)} km
                </div>
            </div>
         </div>
      )}

      {/* Button Controls Container */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3 items-end">
        
        {/* 1. Edit/Cancel Button */}
        {midpoint && onMidpointChange && (
            <button
              onClick={toggleEdit}
              className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white text-white transition-all transform hover:scale-110 ${
                isEditing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#F59E0B] hover:bg-amber-600'
              }`}
              title={isEditing ? "Cancel changes" : "Move midpoint & adjust radius"}
            >
              {isEditing ? <XIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
            </button>
        )}

        {/* 2. Zoom to Friends (Blue) */}
        {locations.some(l => l.coords) && (
            <button
                onClick={handleZoomToFriends}
                className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white text-white bg-blue-500 hover:bg-blue-600 transition-all transform hover:scale-110"
                title="Fit all friends"
            >
                <ExpandIcon className="w-5 h-5" />
            </button>
        )}

        {/* 3. Zoom to Places (Red) */}
        {places.length > 0 && (
            <button
                onClick={handleZoomToPlaces}
                className="w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white text-white bg-red-500 hover:bg-red-600 transition-all transform hover:scale-110"
                title="Fit all restaurants"
            >
                <ExpandIcon className="w-5 h-5" />
            </button>
        )}

      </div>
    </div>
  );
};