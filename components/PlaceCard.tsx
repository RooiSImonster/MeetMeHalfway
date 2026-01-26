import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { styles } from '../styles';

interface PlaceCardProps {
  place: Place;
  index: number;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, index, onSelect, isSelected = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand if selected
  useEffect(() => {
    if (isSelected) {
      setIsOpen(true);
    }
  }, [isSelected]);

  // Helper to determine if amenities tags should be shown
  const hasOutdoorSeating = place.outdoorSeating && place.outdoorSeating !== 'No';
  const hasWheelchairAccess = place.wheelchairAccess && place.wheelchairAccess !== 'Not Accessible';

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && onSelect) {
      onSelect();
    }
  };

  const containerStyle = isSelected ? styles.component.listItemSelected : styles.component.listItem;

  return (
    <div 
      id={`place-card-${place.id}`}
      className={`${containerStyle} flex flex-col h-full`}
    >
      {/* Summary Header - Clickable */}
      <div 
        className="flex items-start justify-between mb-3 cursor-pointer group/header"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 pr-2">
          <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border-2 border-white ring-1 ring-gray-200 group-hover/header:scale-110 transition-transform">
            {index + 1}
          </div>
          <div>
            <h3 className={`${styles.typography.itemTitle} group-hover/header:text-indigo-600 transition-colors`}>{place.name}</h3>
            <span className={styles.typography.itemSubtitle}>{place.type}</span>
          </div>
        </div>

        {/* Chevron Icon - Top Right */}
        <div className="text-gray-400 group-hover/header:text-indigo-600 transition-colors mt-1 p-1">
             {isOpen ? <ChevronUpIcon className={styles.icon.small} /> : <ChevronDownIcon className={styles.icon.small} />}
        </div>
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-1.5 mb-2 pointer-events-none">
        {/* Cuisines */}
        {place.cuisines?.map(c => (
          <span key={`cuisine-${c}`} className={`${styles.component.tagBase} ${styles.component.tagGray}`}>
            {c}
          </span>
        ))}
        
        {/* Dietary Options */}
        {place.dietaryOptions?.map(d => (
          <span key={`diet-${d}`} className={`${styles.component.tagBase} ${styles.component.tagGreen}`}>
            {d}
          </span>
        ))}

        {/* Amenities */}
        {hasOutdoorSeating && (
          <span className={`${styles.component.tagBase} ${styles.component.tagBlue}`}>
            Outdoor Seating
          </span>
        )}
        
        {hasWheelchairAccess && (
          <span className={`${styles.component.tagBase} ${styles.component.tagPurple}`}>
            Wheelchair Access
          </span>
        )}
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
          
          {/* Image */}
          {place.image && (
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3 border border-gray-100">
              <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            
            {place.address && (
              <div className="flex flex-col">
                <span className={styles.typography.label}>Address</span>
                <span>{place.address}</span>
              </div>
            )}

            {(place.openingHours) && (
              <div className="flex flex-col">
                <span className={styles.typography.label}>Hours</span>
                <span className="break-words">{place.openingHours.split(';').join(', ')}</span>
              </div>
            )}
            
            {(place.phone || place.email) && (
              <div className="flex flex-col">
                <span className={styles.typography.label}>Contact</span>
                <div className="flex flex-col gap-1">
                  {place.phone && (
                    <a href={`tel:${place.phone}`} className="text-indigo-600 hover:underline">{place.phone}</a>
                  )}
                  {place.email && (
                    <a href={`mailto:${place.email}`} className="text-indigo-600 hover:underline truncate">{place.email}</a>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            {(place.websiteUri || place.menuUri) && (
              <div className="flex gap-4 mt-1">
                 {place.websiteUri && (
                   <a href={place.websiteUri} target="_blank" rel="noopener noreferrer" className={styles.typography.link}>
                     Website <ExternalLinkIcon className={styles.icon.small} />
                   </a>
                 )}
                 {place.menuUri && (
                   <a href={place.menuUri} target="_blank" rel="noopener noreferrer" className={styles.typography.link}>
                     Menu <ExternalLinkIcon className={styles.icon.small} />
                   </a>
                 )}
              </div>
            )}
            
            {/* Google Maps Link */}
            <div className="pt-2 mt-1 border-t border-gray-50">
               <a 
                 href={place.uri} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-gray-500 hover:text-gray-900 text-xs flex items-center gap-1"
               >
                 View location on Google Maps <ExternalLinkIcon className={styles.icon.small} />
               </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};