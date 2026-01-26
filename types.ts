export interface LocationInput {
  id: string;
  value: string;
  coords?: {
    lat: number;
    lng: number;
  };
  name: string;
  avatar: string;
}

export interface Place {
  id: string;
  name: string;
  type: string;
  category: string;
  lat: number;
  lng: number;
  uri?: string; // Google Maps link

  // Extended details
  address?: string;
  cuisines?: string[];
  dietaryOptions?: string[];
  email?: string;
  openingHours?: string;
  image?: string;
  menuUri?: string;
  outdoorSeating?: string;
  phone?: string;
  websiteUri?: string;
  wheelchairAccess?: string;
}

export interface RecommendationResult {
  places: Place[];
  midpointCoords: {
    lat: number;
    lng: number;
  };
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}