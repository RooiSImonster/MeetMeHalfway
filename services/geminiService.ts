import { GoogleGenAI } from "@google/genai";
import { LocationInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Only asking Gemini for the "Vibe" and description of the area now.
// Actual places are fetched via placesService.ts
export const getMidpointDescription = async (
  locations: LocationInput[], 
  midpointCoords: { lat: number, lng: number }
): Promise<string> => {

  const locationDetails = locations.map((loc, idx) => {
    return `Person ${idx + 1}: ${loc.value}`;
  }).join("\n");
  
  const prompt = `
    I have a group of people meeting up.
    
    The calculated geometric midpoint coordinates are exactly: Latitude ${midpointCoords.lat}, Longitude ${midpointCoords.lng}.
    
    The group is coming from:
    ${locationDetails}
    
    Please provide a helpful description of the area located at these exact midpoint coordinates.
    1. Identify the specific neighborhood, suburb, or town.
    2. Describe the general "vibe" (e.g., is it residential, industrial, a city center, a park?).
    3. Mention if it's a convenient meeting spot based on major roads or transit that might be visible on a map nearby.
    
    Keep the response concise (under 150 words). Do not recommend specific restaurants, just describe the location context.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a local guide expert. You provide concise, accurate geographic context.",
      },
    });

    const candidate = response.candidates?.[0];
    return candidate?.content?.parts?.map(p => p.text).join('') || "Midpoint calculated.";
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Located the geographic midpoint for your group.";
  }
};