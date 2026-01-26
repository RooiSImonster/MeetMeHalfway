import { Place } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Using Overpass API (OpenStreetMap) to find restaurants near coordinates
export const getNearbyPlaces = async (lat: number, lng: number, radius: number = 2000): Promise<Place[]> => {
  // Search for restaurants, cafes, and bars within the specified radius (default 2km)
  // We strictly require a "name" tag to avoid unnamed nodes
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"~"^(restaurant|cafe|bar|pub|biergarten|fast_food|food_court|ice_cream)$"]["name"](around:${radius},${lat},${lng});
    );
    out body 15;
  `;

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "data=" + encodeURIComponent(query),
      });

      // Handle rate limiting (429) and gateway timeouts (502, 504) by retrying
      if (response.status === 429 || response.status === 504 || response.status === 502) {
        attempt++;
        if (attempt < maxAttempts) {
          const waitTime = 2000 * attempt;
          console.warn(`Overpass API ${response.status}. Retrying attempt ${attempt} in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("Overpass API warning:", errorText);
        throw new Error(`Failed to fetch places: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements) return [];

      return data.elements.map((element: any) => {
        const tags = element.tags || {};
        
        // Helper for formatting text: replace underscores with spaces and Title Case
        const formatText = (text: string) => {
          if (!text) return "";
          return text.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        };

        const type = tags.amenity || "restaurant";
        // Format type (e.g. "fast_food" -> "Fast Food")
        const formattedType = formatText(type);

        // Determine category for filtering (Cuisine or fallback to Type)
        let category = formattedType;
        if (tags.cuisine) {
          // Cuisine tags can be semicolon separated (e.g., "pizza;italian")
          const firstCuisine = tags.cuisine.split(';')[0];
          category = formatText(firstCuisine);
        }

        // Parse Cuisines
        const cuisines = tags.cuisine 
          ? tags.cuisine.split(';').map((c: string) => formatText(c.trim())) 
          : [];

        // Parse Dietary Options
        const dietaryOptions: string[] = [];
        ['vegan', 'vegetarian', 'gluten_free', 'halal', 'kosher'].forEach(diet => {
           const val = tags[`diet:${diet}`];
           if (val === 'yes' || val === 'only') {
             dietaryOptions.push(formatText(diet));
           }
        });

        // Parse Address
        const addressParts = [
            tags["addr:housenumber"], 
            tags["addr:street"]
        ].filter(Boolean);
        let address = addressParts.length > 0 ? addressParts.join(' ') : undefined;
        if (tags["addr:city"]) {
            address = address ? `${address}, ${tags["addr:city"]}` : tags["addr:city"];
        }

        // Parse Outdoor Seating
        let outdoorSeating;
        if (tags.outdoor_seating === 'yes') outdoorSeating = 'Yes';
        else if (tags.outdoor_seating === 'no') outdoorSeating = 'No';
        else if (tags.outdoor_seating) outdoorSeating = formatText(tags.outdoor_seating);

        // Parse Wheelchair
        let wheelchairAccess;
        if (tags.wheelchair === 'yes') wheelchairAccess = 'Accessible';
        else if (tags.wheelchair === 'limited') wheelchairAccess = 'Limited';
        else if (tags.wheelchair === 'no') wheelchairAccess = 'Not Accessible';

        return {
          id: element.id.toString(),
          name: tags.name,
          type: formattedType,
          category: category,
          lat: element.lat,
          lng: element.lon,
          
          // Detailed fields
          address: address,
          cuisines: cuisines.length > 0 ? cuisines : undefined,
          dietaryOptions: dietaryOptions.length > 0 ? dietaryOptions : undefined,
          email: tags.email || tags['contact:email'],
          openingHours: tags.opening_hours,
          image: tags.image,
          menuUri: tags['url:menu'] || tags['contact:menu'],
          outdoorSeating: outdoorSeating,
          phone: tags.phone || tags['contact:phone'],
          websiteUri: tags.website || tags['contact:website'] || tags.url,
          wheelchairAccess: wheelchairAccess,
          
          // Computed URI
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tags.name)}+${element.lat},${element.lon}`
        };
      });

    } catch (error) {
      console.error(`Error fetching places (attempt ${attempt + 1}):`, error);
      attempt++;
      if (attempt < maxAttempts) {
        await delay(2000 * attempt);
      } else {
        return [];
      }
    }
  }
  
  return [];
};