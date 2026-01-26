import React, { useState } from 'react';
import { LocationInput } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, MapPinIcon } from './Icons';
import { AutocompleteInput } from './AutocompleteInput';
import { styles } from '../styles';

interface FriendItemProps {
  friend: LocationInput;
  onUpdate: (id: string, updates: Partial<LocationInput>) => void;
  onRemove: (id: string) => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({ friend, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(friend.name);
  const [editValue, setEditValue] = useState(friend.value);
  const [editCoords, setEditCoords] = useState(friend.coords);

  const handleSave = () => {
    if (editValue.trim()) {
        onUpdate(friend.id, { 
            name: editName, 
            value: editValue,
            coords: editCoords
        });
        setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(friend.name);
    setEditValue(friend.value);
    setEditCoords(friend.coords);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.component.listItemEditing}>
        <div>
           <label className={styles.typography.label}>Name</label>
           <input 
             type="text" 
             value={editName}
             onChange={(e) => setEditName(e.target.value)}
             className={styles.input.field}
             placeholder="Friend's Name"
           />
        </div>
        <div>
           <label className={styles.typography.label}>Location</label>
           <AutocompleteInput 
             value={editValue}
             onChange={(val, coords) => {
                setEditValue(val);
                if (coords) setEditCoords(coords);
             }}
             placeholder="Search location..."
             className="w-full"
           />
        </div>
        <div className="flex justify-end gap-2 pt-1">
             <button onClick={handleCancel} className={styles.button.cancel}>Cancel</button>
             <button onClick={handleSave} className={styles.button.save}>
                <CheckIcon className="w-3 h-3" /> Save
             </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.component.listItem} flex items-center gap-3`}>
      {/* Avatar */}
      <div className={styles.component.avatar}>
        {friend.avatar}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
            <h4 className={styles.typography.itemTitle}>{friend.name}</h4>
        </div>
        <div className={styles.typography.itemSubtitle}>
            <MapPinIcon className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">{friend.value || "No location set"}</span>
        </div>
      </div>

      {/* Actions (Visible on Hover) */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => setIsEditing(true)}
            className={styles.component.iconButton}
            title="Edit friend"
        >
            <PencilIcon className={styles.icon.small} />
        </button>
        <button 
            onClick={() => onRemove(friend.id)}
            className={styles.component.iconButtonDanger}
            title="Remove friend"
        >
            <TrashIcon className={styles.icon.small} />
        </button>
      </div>
    </div>
  );
};