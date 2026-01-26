import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { getNearbyPlaces } from './services/placesService';
import { LocationInput, LoadingState, RecommendationResult } from './types';
import { MapPinIcon, PlusIcon, NavigationIcon, LoaderIcon } from './components/Icons';
import { PlaceCard } from './components/PlaceCard';
import { AutocompleteInput } from './components/AutocompleteInput';
import { FriendItem } from './components/FriendItem';
import { Map } from './components/Map';
import { styles } from './styles';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substr(2, 9);
const ANIMALS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦'];

const App: React.FC = () => {
  const [friends, setFriends] = useState<LocationInput[]>([]);
  
  // State for the "Add New" input
  const [pendingLocation, setPendingLocation] = useState<{value: string, coords?: {lat: number, lng: number}}>({ value: '' });
  const [isLocating, setIsLocating] = useState(false);

  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(2000); // Default 2km
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  
  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Scroll to selected place in list
  useEffect(() => {
    if (selectedPlaceId) {
      const element = document.getElementById(`place-card-${selectedPlaceId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedPlaceId]);

  // Add a friend logic
  const addFriend = (value: string, coords?: { lat: number; lng: number }) => {
    if (!value.trim()) return;

    const newFriend: LocationInput = {
      id: generateId(),
      name: `Friend ${friends.length + 1}`,
      avatar: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
      value: value,
      coords: coords
    };

    setFriends([...friends, newFriend]);
    setPendingLocation({ value: '' });
    setError(null);
  };

  const updateFriend = (id: string, updates: Partial<LocationInput>) => {
    setFriends(friends.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFriend = (id: string) => {
    setFriends(friends.filter(f => f.id !== id));
  };

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    setPendingLocation({ value: "Locating..." });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
           const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
           const data = await response.json();
           const address = data.display_name || `${latitude}, ${longitude}`;
           // Auto-add
           addFriend(address, { lat: latitude, lng: longitude });
        } catch (e) {
           addFriend(`${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        } finally {
           setIsLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setPendingLocation({ value: "" });
        setIsLocating(false);
        alert("Unable to retrieve your location");
      }
    );
  }, [friends]); // Dependencies for addFriend

  const fetchRecommendations = async (validLocations: LocationInput[], midpoint: { lat: number, lng: number }, radius: number) => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    setSelectedPlaceId(null);
    
    try {
      // Fetch Places only (Overpass)
      const places = await getNearbyPlaces(midpoint.lat, midpoint.lng, radius);

      setResult({
        places: places,
        midpointCoords: midpoint
      });
      
      setLoadingState(LoadingState.SUCCESS);
      setSelectedFilters([]); // Reset filters on new fetch
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching data. Please try again.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLocations = friends.filter(i => i.value.trim().length > 0);
    
    if (validLocations.length < 2) {
      setError("Please add at least two friends to find a meeting point.");
      return;
    }

    const hasMissingCoords = validLocations.some(l => !l.coords);
    if (hasMissingCoords) {
      setError("Some friends have invalid locations. Please edit them.");
      return;
    }

    // 1. Calculate Geometric Midpoint Locally
    const validCoords = validLocations.map(l => l.coords!);
    const avgLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
    const avgLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;
    const midpoint = { lat: avgLat, lng: avgLng };

    // Reset radius to default on new search
    setSearchRadius(2000);

    // 2. Fetch
    await fetchRecommendations(validLocations, midpoint, 2000);
  };

  const handleMidpointUpdate = (lat: number, lng: number, newRadius: number) => {
    setSearchRadius(newRadius);
    setResult(prev => prev ? { ...prev, places: [], midpointCoords: { lat, lng } } : { places: [], midpointCoords: { lat, lng } });

    const validLocations = friends.filter(i => i.value.trim().length > 0 && i.coords);
    if (validLocations.length >= 2) {
      fetchRecommendations(validLocations, { lat, lng }, newRadius);
    }
  };

  const handleToggleFilter = (category: string) => {
    setSelectedFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Derive categories and filtered places
  const availableCategories = useMemo(() => {
    if (!result?.places) return [];
    return Array.from(new Set(result.places.map(p => p.category))).sort();
  }, [result]);

  const filteredPlaces = useMemo(() => {
    if (!result?.places) return [];
    if (selectedFilters.length === 0) return result.places;
    return result.places.filter(p => selectedFilters.includes(p.category));
  }, [result, selectedFilters]);

  return (
    <div className={styles.layout.pageContainer}>
      {/* Header */}
      <header className={styles.layout.header}>
        <div className={styles.layout.headerContent}>
          <div className="flex items-center gap-2">
            <div className={styles.button.iconContainer}>
              <MapPinIcon className={styles.icon.base} />
            </div>
            <h1 className={styles.typography.h1}>MeetHalfway</h1>
          </div>
          <button 
            className={styles.button.reset}
            onClick={() => window.location.reload()}
          >
            Reset
          </button>
        </div>
      </header>

      <main className={styles.layout.mainContent}>
        <div className={styles.layout.gridContainer}>
          
          {/* Left Column: Input Form */}
          <div className={styles.layout.leftColumn}>
            <div className={styles.card.container}>
              <h2 className={styles.typography.h2}>
                <NavigationIcon className={styles.icon.nav} />
                Planning
              </h2>
              
              <div className="space-y-4">
                
                {/* Add New Section */}
                <div>
                   <label className={styles.typography.label}>Add a new location</label>
                   <div className="flex gap-2">
                      <AutocompleteInput 
                         value={pendingLocation.value}
                         onChange={(val, coords) => setPendingLocation({ value: val, coords })}
                         onSelect={() => {
                            // Auto-add is handled by user action to keep it simple, or we could add auto-logic here
                         }}
                         placeholder="e.g. Times Square, NY"
                         className="flex-grow"
                      />
                      
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-lg px-3 flex items-center justify-center border border-gray-200 transition-colors"
                        title="Use my location"
                      >
                         {isLocating ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                               <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                         )}
                      </button>
                   </div>
                   
                   {/* Dotted Add Button */}
                   <button
                      type="button"
                      onClick={() => addFriend(pendingLocation.value, pendingLocation.coords)}
                      disabled={!pendingLocation.value.trim()}
                      className={`${styles.button.secondary} mt-3 ${!pendingLocation.value.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     <PlusIcon className={styles.icon.small} />
                     Add a friend
                   </button>
                </div>

                {/* Friend List */}
                {friends.length > 0 && (
                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {friends.map((friend) => (
                        <FriendItem 
                           key={friend.id} 
                           friend={friend} 
                           onUpdate={updateFriend}
                           onRemove={removeFriend}
                        />
                      ))}
                   </div>
                )}
                
                {friends.length === 0 && (
                   <div className={styles.typography.emptyState}>
                      No friends added yet.
                   </div>
                )}

                <div className="pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loadingState === LoadingState.LOADING || friends.length < 2}
                    className={styles.button.primary(loadingState === LoadingState.LOADING || friends.length < 2)}
                  >
                    {loadingState === LoadingState.LOADING ? (
                      <>
                        <LoaderIcon className={`${styles.icon.base} animate-spin`} />
                        Calculating...
                      </>
                    ) : (
                      'Find Meeting Point'
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className={styles.typography.errorText}>
                  {error}
                </div>
              )}
            </div>
            
             <div className={styles.card.infoBox}>
              <h3 className={styles.typography.h3}>Interactive Map</h3>
              <p className={styles.typography.bodySmall}>
                Add locations using the inputs above. We'll find the geometric middle and search for nearby restaurants using real-time map data.
              </p>
            </div>
          </div>

          {/* Center Column: Map */}
          <div className={styles.layout.centerColumn}>
             <div className={styles.card.mapContainer}>
               <Map 
                  locations={friends} 
                  midpoint={result?.midpointCoords || null}
                  places={filteredPlaces}
                  radius={searchRadius}
                  onMidpointChange={handleMidpointUpdate}
                  selectedPlaceId={selectedPlaceId}
                  onPlaceSelect={setSelectedPlaceId}
               />
             </div>
             
             {loadingState === LoadingState.IDLE && (
                 <div className={styles.typography.emptyState}>
                    Add friends and click 'Find Meeting Point' to see the analysis.
                 </div>
             )}
          </div>

          {/* Right Column: Results */}
          <div className={styles.layout.rightColumn}>
            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                <div className={styles.card.resultsWrapper}>
                  {/* Fixed Header */}
                  <div className="p-4 border-b border-gray-100 bg-white z-10 shrink-0">
                    <h3 className={styles.typography.subHeader}>
                       {filteredPlaces.length > 0 
                         ? `Nearby Places (${filteredPlaces.length})` 
                         : (loadingState === LoadingState.LOADING ? 'Searching...' : 'No places found')}
                    </h3>

                    {/* Filter Pills */}
                    {availableCategories.length > 0 && (
                      <div className={styles.filter.container}>
                        {availableCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => handleToggleFilter(category)}
                            className={styles.filter.pill(selectedFilters.includes(category))}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scrollable List */}
                  <div className="overflow-y-auto p-4 flex-1 suggestions-list">
                    {loadingState === LoadingState.LOADING ? (
                      <div className="flex flex-col items-center justify-center h-32 space-y-3">
                         <LoaderIcon className="w-8 h-8 animate-spin text-indigo-500" />
                         <p className="text-sm text-gray-500">Updating results...</p>
                      </div>
                    ) : filteredPlaces.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredPlaces.map((place, idx) => (
                          <PlaceCard 
                            key={`${place.id}-${idx}`} 
                            place={place} 
                            index={idx}
                            onSelect={() => setSelectedPlaceId(place.id)}
                            isSelected={selectedPlaceId === place.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 p-2">
                         {result.places.length > 0 
                          ? "No places match your selected filters." 
                          : `We couldn't find any restaurants or cafes strictly within ${(searchRadius / 1000).toFixed(1)}km of the mathematical midpoint.`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;