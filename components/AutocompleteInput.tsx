import React, { useState, useEffect, useRef } from 'react';
import { LocationInput, Suggestion } from '../types';
import { MapPinIcon, LoaderIcon, TrashIcon } from './Icons';
import { styles } from '../styles';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  onSelect?: () => void; // Called when a suggestion is clicked
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search location...",
  label,
  className,
  autoFocus
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only search if we have input and it doesn't look like a coordinate pair or full address we just selected
      // We rely on the parent clearing coords if user types, but here we just check length
      if (value.length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
            { headers: { 'User-Agent': 'MeetHalfwayApp/1.0' } }
          );
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
            
            // Only show suggestions if the input is currently focused
            // This prevents popups on initial load (editing) or after selection
            if (document.activeElement === inputRef.current) {
               setShowSuggestions(true);
            }
          }
        } catch (error) {
          console.error("Autocomplete error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (s: Suggestion) => {
    onChange(s.display_name, { lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelect) onSelect();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, undefined);
  };

  return (
    <div className={`${styles.input.group} ${className || ''}`} ref={wrapperRef}>
      {label && (
        <label className={styles.input.label}>
          {label}
        </label>
      )}
      <div className={styles.input.wrapper}>
        <div className={styles.input.container}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={styles.input.field}
            autoComplete="off"
            autoFocus={autoFocus}
          />
          <div className={styles.input.iconLeft}>
             <MapPinIcon className={styles.icon.small} />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.input.dropdown}>
          <ul>
            {suggestions.map((s) => (
              <li key={s.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={styles.input.dropdownItem}
                >
                  <MapPinIcon className={`${styles.icon.small} mt-0.5 shrink-0 opacity-50`} />
                  <span className="line-clamp-2">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isSearching && (
         <div className={styles.input.loader}>
            <LoaderIcon className={`${styles.icon.small} animate-spin text-gray-400`} />
         </div>
      )}
    </div>
  );
};