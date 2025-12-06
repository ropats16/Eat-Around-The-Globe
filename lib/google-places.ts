import { FoodPlace, FoodCategory, DietaryTag } from "./types";

let googleMapsLoaded = false;
let apiKey: string = "";

// Session token for autocomplete billing optimization
export interface AutocompleteSession {
  token: string;
  createdAt: number;
}

// Autocomplete request options
export interface AutocompleteOptions {
  input: string;
  sessionToken?: string;
  locationRestriction?: {
    circle?: {
      center: { latitude: number; longitude: number };
      radius: number; // in meters
    };
    rectangle?: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  };
  origin?: { latitude: number; longitude: number };
  includedPrimaryTypes?: string[];
  languageCode?: string;
  regionCode?: string;
}

// Generate a unique session token for autocomplete billing
export const createAutocompleteSession = (): AutocompleteSession => {
  return {
    token: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: Date.now(),
  };
};

export const initGoogleMaps = async (key: string) => {
  if (googleMapsLoaded) return;

  try {
    apiKey = key;

    // Load Google Maps script dynamically with new Places library
    await new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is undefined"));
        return;
      }

      const globalWindow = window as unknown as Record<string, unknown>;
      if (globalWindow.google &&
          typeof globalWindow.google === 'object' &&
          (globalWindow.google as Record<string, unknown>).maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      // Use the new Places API with libraries parameter
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });

    googleMapsLoaded = true;
  } catch (error) {
    console.error("Failed to load Google Maps:", error);
    throw error;
  }
};

export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<google.maps.places.PlaceResult> => {
  if (!googleMapsLoaded || !apiKey) {
    console.error("Google Maps not initialized. Cannot fetch place details.");
    throw new Error("Google Maps not initialized. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local");
  }

  try {
    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "photos",
      "rating",
      "types",
      "websiteUri",
      "internationalPhoneNumber",
      "regularOpeningHours",
      "priceLevel",
      "reviews",
      "googleMapsUri",
      "addressComponents",
    ].join(",");

    // Build URL with session token if provided (completes the autocomplete session)
    let url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fieldMask}&languageCode=en`;
    if (sessionToken) {
      url += `&sessionToken=${sessionToken}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Place details API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert new API response to legacy PlaceResult format
    const placeResult: google.maps.places.PlaceResult = {
      place_id: placeId,
      name: data.displayName?.text || "",
      formatted_address: data.formattedAddress || "",
      geometry: data.location
        ? {
            location: {
              lat: () => data.location.latitude,
              lng: () => data.location.longitude,
            } as google.maps.LatLng,
          }
        : undefined,
      photos: data.photos?.map((photo: { name: string }) => ({
        getUrl: ({ maxWidth }: { maxWidth?: number }) => {
          const width = maxWidth || 800;
          return `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=${width}`;
        },
      })),
      rating: data.rating,
      types: data.types || [],
      website: data.websiteUri,
      international_phone_number: data.internationalPhoneNumber,
      opening_hours: data.regularOpeningHours
        ? ({
            weekday_text: data.regularOpeningHours.weekdayDescriptions || [],
          } as google.maps.places.PlaceOpeningHours)
        : undefined,
      price_level: data.priceLevel === "PRICE_LEVEL_FREE" ? 0 :
                   data.priceLevel === "PRICE_LEVEL_INEXPENSIVE" ? 1 :
                   data.priceLevel === "PRICE_LEVEL_MODERATE" ? 2 :
                   data.priceLevel === "PRICE_LEVEL_EXPENSIVE" ? 3 :
                   data.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE" ? 4 : undefined,
      reviews: data.reviews?.map((review: {
        authorAttribution?: { displayName: string };
        rating: number;
        text?: { text: string };
        publishTime?: string;
      }) => ({
        author_name: review.authorAttribution?.displayName || "",
        rating: review.rating || 0,
        text: review.text?.text || "",
        time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : 0,
      })),
      url: data.googleMapsUri,
      address_components: data.addressComponents?.map((component: {
        longText: string;
        shortText: string;
        types: string[];
      }) => ({
        long_name: component.longText || "",
        short_name: component.shortText || "",
        types: component.types || [],
      })),
    };

    return placeResult;
  } catch (error) {
    console.error("Place details error:", error);
    throw error;
  }
};

// Convert Google Place to our FoodPlace format
export const convertGooglePlaceToFoodPlace = (
  place: google.maps.places.PlaceResult,
  category: FoodCategory = "traditional"
): FoodPlace => {
  const lat = place.geometry?.location?.lat() || 0;
  const lng = place.geometry?.location?.lng() || 0;

  // Extract country from address components
  const countryComponent = place.address_components?.find((comp) =>
    comp.types.includes("country")
  );
  const country = countryComponent?.long_name || "Unknown";
  const countryCode = countryComponent?.short_name || "XX";

  // Extract city from address components
  const cityComponent =
    place.address_components?.find((comp) =>
      comp.types.includes("locality")
    ) ||
    place.address_components?.find((comp) =>
      comp.types.includes("administrative_area_level_1")
    );
  const city = cityComponent?.long_name || "Unknown";

  // Get photos
  const images = place.photos
    ? place.photos.slice(0, 5).map((photo) => photo.getUrl({ maxWidth: 800 }))
    : [];

  // Determine dietary info from types and name/description
  const dietaryInfo: DietaryTag[] = [];
  const searchText = `${place.name} ${place.types?.join(" ")}`.toLowerCase();

  if (place.types?.includes("vegetarian_restaurant") || searchText.includes("vegetarian")) {
    dietaryInfo.push("vegetarian");
  }
  if (place.types?.includes("vegan_restaurant") || searchText.includes("vegan")) {
    dietaryInfo.push("vegan");
  }
  if (searchText.includes("halal")) {
    dietaryInfo.push("halal");
  }
  if (searchText.includes("kosher")) {
    dietaryInfo.push("kosher");
  }
  if (searchText.includes("gluten-free") || searchText.includes("gluten free")) {
    dietaryInfo.push("gluten-free");
  }
  if (searchText.includes("dairy-free") || searchText.includes("dairy free")) {
    dietaryInfo.push("dairy-free");
  }
  if (searchText.includes("nut-free") || searchText.includes("nut free")) {
    dietaryInfo.push("nut-free");
  }

  const foodPlace: FoodPlace = {
    id: place.place_id || Math.random().toString(36).substring(2, 11),
    name: place.name || "Unnamed Place",
    country,
    countryCode,
    city,
    coordinates: [lat, lng],
    category,
    description: place.reviews?.[0]?.text || "No description available",
    shortDescription: place.name || "Food place",
    images,
    dietaryInfo,
    priceRange: (place.price_level as 1 | 2 | 3) || 2,
    funFacts: [],
    externalLinks: {
      restaurant: place.website,
      wiki: place.url,
    },
    popularity: Math.round((place.rating || 4) * 20),
    dateAdded: new Date().toISOString(),
    tags: place.types || [],
    placeId: place.place_id,
    rating: place.rating,
    address: place.formatted_address,
    phone: place.international_phone_number || place.formatted_phone_number,
    openingHours: place.opening_hours?.weekday_text,
    isOpenNow: place.opening_hours?.open_now,
    totalReviews: place.user_ratings_total,
  };

  return foodPlace;
};

// Autocomplete helper using new Places API with session token support
export const getAutocompletePredictions = async (
  options: AutocompleteOptions | string
): Promise<google.maps.places.AutocompletePrediction[]> => {
  if (!googleMapsLoaded || !apiKey) {
    console.warn("Google Maps not initialized yet. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local");
    return [];
  }

  // Support both string input (legacy) and options object
  const autocompleteOptions: AutocompleteOptions =
    typeof options === "string" ? { input: options } : options;

  const {
    input,
    sessionToken,
    locationRestriction,
    origin,
    includedPrimaryTypes = ["restaurant", "cafe", "bakery", "bar"],
    languageCode = "en",
    regionCode,
  } = autocompleteOptions;

  try {
    const requestBody: Record<string, unknown> = {
      input,
      includedPrimaryTypes,
      languageCode,
    };

    // Add session token if provided (important for billing optimization)
    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    }

    // Add location restriction if provided (helps narrow down results)
    if (locationRestriction) {
      requestBody.locationRestriction = locationRestriction;
    }

    // Add origin for distance calculations
    if (origin) {
      requestBody.origin = origin;
    }

    // Add region code if provided
    if (regionCode) {
      requestBody.regionCode = regionCode;
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Autocomplete API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert new API response to legacy format for compatibility
    const predictions: google.maps.places.AutocompletePrediction[] = (
      data.suggestions || []
    ).map((suggestion: {
      placePrediction?: {
        text?: { text: string };
        placeId: string;
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
        types: string[];
      };
    }) => {
      const placePrediction = suggestion.placePrediction;
      if (!placePrediction) return null;

      return {
        description: placePrediction.text?.text || "",
        place_id: placePrediction.placeId || "",
        structured_formatting: {
          main_text: placePrediction.structuredFormat?.mainText?.text || "",
          main_text_matched_substrings: [],
          secondary_text: placePrediction.structuredFormat?.secondaryText?.text || "",
        },
        terms: [],
        types: placePrediction.types || [],
        matched_substrings: [],
      } as google.maps.places.AutocompletePrediction;
    }).filter(Boolean);

    return predictions;
  } catch (error) {
    console.error("Autocomplete error:", error);
    return [];
  }
};
