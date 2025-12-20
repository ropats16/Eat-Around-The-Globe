"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, MapPin, SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useFoodGlobeStore } from "@/lib/store";
import {
  getAutocompletePredictions,
  getPlaceDetails,
  convertGooglePlaceToFoodPlace,
} from "@/lib/google-places";
import PlaceDetailsOverlay from "./PlaceDetailsOverlay";
import { Recommender } from "@/lib/types";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { addFood, setIsAddingPlace, setPreviewPlace, centerGlobe } =
    useFoodGlobeStore();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (!query || query.length < 3) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await getAutocompletePredictions(query);
        setPredictions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPlace = async (placeId: string) => {
    try {
      setIsLoadingPlace(true);
      setShowSuggestions(false);

      const placeDetails = await getPlaceDetails(placeId);
      setSelectedPlace(placeDetails);
      setQuery("");
      setPredictions([]);

      // Show temporary pin on globe and center on it
      const lat = placeDetails.geometry?.location?.lat();
      const lng = placeDetails.geometry?.location?.lng();
      if (lat !== undefined && lng !== undefined) {
        setPreviewPlace({
          lat,
          lng,
          name: placeDetails.name || "Selected Place",
        });
        centerGlobe(lat, lng);
      }
    } catch (error) {
      console.error("Error loading place:", error);
      alert("Failed to load place details. Please try again.");
    } finally {
      setIsLoadingPlace(false);
    }
  };

  const handleSaveToMap = async (recommender: Recommender) => {
    if (!selectedPlace) return;

    try {
      setIsAdding(true);
      setIsAddingPlace(true);

      // Use recommender's category if provided, otherwise default to "traditional"
      const category = recommender.category || "traditional";

      // Use recommender's dietary info if provided (user selection takes precedence over auto-detection)
      const dietaryInfo = recommender.dietaryInfo;

      const foodPlace = convertGooglePlaceToFoodPlace(
        selectedPlace,
        category,
        dietaryInfo
      );

      console.log("🔍 DIAGNOSTIC: About to add food");
      console.log("📍 FoodPlace category:", foodPlace.category);
      console.log("📍 FoodPlace dietaryInfo:", foodPlace.dietaryInfo);
      console.log("👤 Recommender category:", recommender.category);
      console.log("👤 Recommender dietaryInfo:", recommender.dietaryInfo);

      // Pass recommender as second parameter - store will handle merging duplicates
      addFood(foodPlace, recommender);
      setSelectedPlace(null);
      setPreviewPlace(null); // Clear temporary pin
    } catch (error) {
      console.error("Error adding place:", error);
      alert("Failed to add place. Please try again.");
    } finally {
      setIsAdding(false);
      setIsAddingPlace(false);
    }
  };

  const handleCloseOverlay = () => {
    setSelectedPlace(null);
    setPreviewPlace(null); // Clear temporary pin
  };

  return (
    <div
      ref={searchRef}
      className="w-full md:absolute md:top-26 md:right-12 md:w-96 pointer-events-auto z-40 h-11 md:h-12"
    >
      {/* Main Search Input - Shadcn Input Group */}
      <InputGroup className="h-11 md:h-12 rounded-lg bg-white shadow-[0_1px_6px_rgba(32,33,36,0.28)] hover:shadow-[0_2px_8px_rgba(32,33,36,0.28)] transition-shadow duration-200">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for a food place anywhere..."
          disabled={isAdding}
          className="text-sm md:text-base placeholder:text-gray-500"
        />
        {isSearching && (
          <InputGroupAddon align="inline-end">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </InputGroupAddon>
        )}
        {isAdding && (
          <InputGroupAddon align="inline-end">
            <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
          </InputGroupAddon>
        )}
      </InputGroup>

      {/* Suggestions Dropdown - Google Style */}
      <AnimatePresence>
        {showSuggestions && predictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="mt-2 bg-white rounded-3xl shadow-[0_1px_6px_rgba(32,33,36,0.28)] overflow-hidden max-h-[calc(100dvh-12rem)] sm:max-h-96 overflow-y-auto"
          >
            <div className="py-2">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectPlace(prediction.place_id)}
                  disabled={isAdding}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text - Google Style */}
      <AnimatePresence>
        {query.length > 0 && query.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-2 text-xs text-gray-500 text-center bg-white rounded-full py-2 px-4 shadow-[0_1px_6px_rgba(32,33,36,0.28)]"
          >
            Type at least 3 characters to search
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Details Overlay */}
      {selectedPlace && (
        <div className="mt-4">
          <PlaceDetailsOverlay
            place={selectedPlace}
            onClose={handleCloseOverlay}
            onSaveToMap={handleSaveToMap}
            isSaving={isAdding}
          />
        </div>
      )}

      {/* Loading Place Details */}
      {isLoadingPlace && (
        <div className="mt-4 bg-white rounded-3xl shadow-[0_2px_12px_rgba(32,33,36,0.28)] p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
