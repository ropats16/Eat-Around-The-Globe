"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import {
  X,
  MapPin,
  Star,
  Phone,
  Globe as GlobeIcon,
  Clock,
  Plus,
  User,
  MessageSquare,
  UtensilsCrossed,
  Leaf,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Recommender, FoodCategory, DietaryTag } from "@/lib/types";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import {
  CATEGORY_OPTIONS,
  DIETARY_OPTIONS,
  getDietaryConfig,
} from "@/lib/category-config";
import { trackRecommendationSubmit } from "@/lib/analytics";

interface PlaceDetailsOverlayProps {
  place: google.maps.places.PlaceResult | null;
  onClose: () => void;
  onSaveToMap: (recommender: Recommender) => void;
  isSaving?: boolean;
}

export default function PlaceDetailsOverlay({
  place,
  onClose,
  onSaveToMap,
  isSaving = false,
}: PlaceDetailsOverlayProps) {
  const foods = useFoodGlobeStore((state) => state.foods);
  const walletAddress = useFoodGlobeStore((state) => state.walletAddress);
  const walletType = useFoodGlobeStore((state) => state.walletType);
  // const walletProvider = useFoodGlobeStore((state) => state.walletProvider);
  const userProfile = useFoodGlobeStore((state) => state.userProfile);
  const openProfileModal = useFoodGlobeStore((state) => state.openProfileModal);
  const openWalletModal = useFoodGlobeStore((state) => state.openWalletModal);

  const { uploadRecommendation } = useArweaveUpload();

  // Memoized duplicate detection - check if this place already exists
  const existingPlace = useMemo(() => {
    if (!place?.place_id) return null;
    return foods.find((f) => f.placeId === place.place_id);
  }, [foods, place]);

  // Detect category from Google types
  const detectedCategory = useMemo((): FoodCategory | "" => {
    if (!place?.types) return "";
    const types = place.types;
    if (types.includes("bakery")) return "bakery";
    if (types.includes("bar") || types.includes("night_club")) return "bar";
    if (types.includes("cafe")) return "cafe";
    return "";
  }, [place]);

  // Detect dietary info from Google types
  const detectedDietary = useMemo((): DietaryTag[] => {
    if (!place?.types) return [];
    const dietary: DietaryTag[] = [];
    const searchText = `${place.name} ${place.types.join(" ")}`.toLowerCase();

    if (
      place.types.includes("vegetarian_restaurant") ||
      searchText.includes("vegetarian")
    ) {
      dietary.push("vegetarian");
    }
    if (
      place.types.includes("vegan_restaurant") ||
      searchText.includes("vegan")
    ) {
      dietary.push("vegan");
    }
    if (searchText.includes("halal")) dietary.push("halal");
    if (searchText.includes("kosher")) dietary.push("kosher");
    if (searchText.includes("gluten")) dietary.push("gluten-free");

    return dietary;
  }, [place]);

  const [showForm, setShowForm] = useState(false);
  const [recommenderCaption, setRecommenderCaption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "">(
    detectedCategory
  );
  const [selectedDietary, setSelectedDietary] =
    useState<DietaryTag[]>(detectedDietary);
  const [currentRecommenderIndex, setCurrentRecommenderIndex] = useState(0);

  // Check if current user (by wallet address) has already added this place
  const hasUserAlreadyAdded = useMemo(() => {
    if (!existingPlace || !walletAddress) return false;
    return existingPlace.recommenders.some(
      (r) => r.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }, [existingPlace, walletAddress]);

  // Auto-show form when profile is set (after profile modal closes)
  // MUST be before early return to follow Rules of Hooks
  useEffect(() => {
    if (userProfile && !showForm && walletAddress) {
      setShowForm(true);
    }
    // Note: showForm intentionally excluded from deps to prevent cascading renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, walletAddress]);

  // Auto-rotate recommenders carousel
  useEffect(() => {
    if (
      !existingPlace?.recommenders ||
      existingPlace.recommenders.length <= 1
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentRecommenderIndex((prev) =>
        prev === existingPlace.recommenders.length - 1 ? 0 : prev + 1
      );
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [existingPlace?.recommenders]);

  if (!place) return null;

  const photos = place.photos?.slice(0, 3) || [];

  const handleSubmit = async () => {
    if (!userProfile || !walletAddress || hasUserAlreadyAdded) {
      return;
    }

    const recommender: Recommender = {
      name: userProfile.username || "anon",
      walletAddress: walletAddress, // For duplicate detection
      profilePicture: userProfile.avatar || undefined,
      caption: recommenderCaption.trim() || undefined,
      category: selectedCategory || undefined,
      dietaryInfo: selectedDietary.length > 0 ? selectedDietary : undefined,
      dateRecommended: new Date().toISOString(),
    };

    // If wallet connected, upload to Arweave FIRST before saving locally
    if (walletType && walletAddress && place?.place_id) {
      try {
        // Extract place information for tags
        const countryComponent = place.address_components?.find((comp) =>
          comp.types.includes("country")
        );
        const country = countryComponent?.long_name || "Unknown";
        const countryCode = countryComponent?.short_name || "XX";

        const cityComponent =
          place.address_components?.find((comp) =>
            comp.types.includes("locality")
          ) ||
          place.address_components?.find((comp) =>
            comp.types.includes("administrative_area_level_1")
          );
        const city = cityComponent?.long_name || "Unknown";

        await uploadRecommendation(
          place.place_id,
          {
            caption: recommenderCaption.trim(),
            category: selectedCategory || "traditional",
            dietaryTags: selectedDietary,
          },
          {
            name: place.name || "Unnamed Place",
            country,
            countryCode,
            city,
            address: place.formatted_address,
          }
        );

        // Track recommendation submission
        trackRecommendationSubmit(
          place.place_id,
          place.name || "Unnamed Place",
          selectedCategory || "traditional",
          country
        );

        // Only save locally AFTER Arweave succeeds
        onSaveToMap(recommender);
      } catch {
        // Don't save locally - show error to user
        alert("Failed to save recommendation to Arweave. Please try again.");
        return; // Don't proceed
      }
    } else {
      // No wallet connected - just save locally
      onSaveToMap(recommender);
    }
  };

  const toggleDietary = (tag: DietaryTag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed md:relative bottom-4 md:bottom-auto left-4 md:left-auto right-4 md:right-auto w-[calc(100%-2rem)] md:w-auto md:mb-6 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden max-h-[calc(100dvh-14rem)] md:max-h-[calc(100vh-12rem)] flex flex-col z-30 md:z-10 hover:shadow-2xl hover:shadow-black/15 transition-shadow duration-200"
      >
        {/* Scrollable wrapper */}
        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Header with Photos */}
          {photos.length > 0 && (
            <div className="relative h-48 bg-gray-100">
              <div className="grid grid-cols-3 gap-1 h-full">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-full h-full">
                    <Image
                      src={photo.getUrl({ maxWidth: 400 })}
                      alt={`${place.name} photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="absolute top-2 right-2 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm shadow-black/10 flex items-center justify-center hover:bg-gray-100 hover:shadow-md hover:shadow-black/15 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5 text-gray-700" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-3 md:p-4 space-y-3">
            {/* Title and Rating */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {place.name}
              </h2>
              <div className="flex items-center gap-2">
                {place.rating && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm shadow-black/5">
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs md:text-sm font-semibold text-gray-900">
                      {place.rating.toFixed(1)}
                    </span>
                    {place.user_ratings_total && (
                      <span className="text-[10px] md:text-xs text-gray-500">
                        ({place.user_ratings_total.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {place.price_level && (
                  <div className="flex items-center gap-0.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-white rounded-lg border border-gray-200 shadow-sm shadow-black/5">
                    {Array.from({ length: place.price_level }).map((_, i) => (
                      <span
                        key={i}
                        className="text-green-700 text-xs md:text-sm"
                      >
                        $
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2">
              {place.formatted_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-gray-700">
                    {place.formatted_address}
                  </span>
                </div>
              )}

              {place.international_phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                  <span className="text-xs md:text-sm text-gray-700">
                    {place.international_phone_number}
                  </span>
                </div>
              )}

              {place.website && (
                <div className="flex items-center gap-2">
                  <GlobeIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm text-blue-600 hover:underline truncate"
                  >
                    {new URL(place.website).hostname}
                  </a>
                </div>
              )}

              {place.opening_hours?.weekday_text && (
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-gray-700">
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-900 font-medium">
                        {/* Using deprecated open_now for backwards compatibility */}
                        {place.opening_hours.open_now ? (
                          <span className="text-green-600">Open now</span>
                        ) : (
                          <span className="text-red-600">Closed</span>
                        )}
                      </summary>
                      <ul className="mt-1.5 space-y-0.5 text-[10px] md:text-xs text-gray-600">
                        {place.opening_hours.weekday_text.map((day, index) => (
                          <li key={index}>{day}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Existing Recommendations Carousel */}
            {existingPlace?.recommenders &&
              existingPlace.recommenders.length > 0 &&
              (() => {
                // Ensure valid index
                const validIndex = Math.min(
                  currentRecommenderIndex,
                  existingPlace.recommenders.length - 1
                );
                const currentRecommender =
                  existingPlace.recommenders[validIndex];

                // Find the original recommender (oldest timestamp)
                const originalRecommender = existingPlace.recommenders.reduce(
                  (oldest, current) =>
                    new Date(current.dateRecommended).getTime() <
                    new Date(oldest.dateRecommended).getTime()
                      ? current
                      : oldest
                );

                const isOriginal =
                  currentRecommender?.walletAddress ===
                  originalRecommender?.walletAddress;

                return (
                  <div className="p-3 bg-linear-to-br from-fuchsia-50/10 to-fuchsia-100/30 rounded-xl border border-fuchsia-200 shadow-sm shadow-black/5">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-fuchsia-600" />
                      Already recommended by {existingPlace.recommenders.length}{" "}
                      {existingPlace.recommenders.length === 1
                        ? "person"
                        : "people"}
                    </h3>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentRecommenderIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3"
                      >
                        {currentRecommender.profilePicture ? (
                          <Image
                            src={currentRecommender.profilePicture}
                            alt={currentRecommender.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover shadow-md shadow-fuchsia-600/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-fuchsia-200 to-fuchsia-400 flex items-center justify-center shadow-md shadow-fuchsia-600/20">
                            <span className="text-white font-bold text-lg">
                              {currentRecommender.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm md:text-base font-bold text-gray-900">
                              {currentRecommender.name}
                            </p>
                            {isOriginal && (
                              <span className="px-2 py-0.5 bg-fuchsia-200 text-fuchsia-800 text-[10px] md:text-xs rounded-md font-medium shadow-sm shadow-fuchsia-600/10">
                                Original
                              </span>
                            )}
                          </div>
                          {currentRecommender.caption && (
                            <p className="text-xs md:text-sm text-gray-600 mt-1 italic leading-relaxed">
                              &ldquo;{currentRecommender.caption}&rdquo;
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Carousel dots */}
                    {existingPlace.recommenders.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-4">
                        {existingPlace.recommenders.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentRecommenderIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-200 ${
                              idx === currentRecommenderIndex
                                ? "bg-fuchsia-300/50 w-6 shadow-sm shadow-fuchsia-600/30"
                                : "bg-fuchsia-200 w-1.5 hover:bg-fuchsia-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Action Button / Form */}
            {!showForm ? (
              <Button
                onClick={() => {
                  // Check wallet connection first
                  if (!walletAddress) {
                    // No wallet connected - open wallet modal
                    openWalletModal();
                  } else if (!userProfile) {
                    // Wallet connected but no profile - open profile modal
                    openProfileModal();
                  } else {
                    // Wallet connected and has profile - show form
                    setShowForm(true);
                  }
                }}
                disabled={isSaving}
                className="w-full bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg py-3 text-sm font-medium shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add to My Map
                </span>
              </Button>
            ) : (
              <div className="space-y-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
                  {/* <User className="w-3.5 h-3.5 text-purple-600" /> */}
                  Your Recommendation
                </h3>

                {/* User info display */}
                {userProfile && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm shadow-black/5">
                    {userProfile.avatar ? (
                      <div className="relative w-7 h-7">
                        <Image
                          src={userProfile.avatar}
                          alt={userProfile.username || "anon"}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">
                        {userProfile.username}
                      </p>
                    </div>
                  </div>
                )}

                {hasUserAlreadyAdded && (
                  <p className="text-[10px] text-red-600 flex items-center gap-1 bg-red-50 p-1.5 rounded-lg border border-red-200">
                    <span className="font-medium">
                      ⚠️ You have already added this place
                    </span>
                  </p>
                )}
                {existingPlace && userProfile && !hasUserAlreadyAdded && (
                  <p className="text-[10px] text-purple-600 flex items-center gap-1 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                    <span className="font-medium">
                      ✨ Adding your recommendation to{" "}
                      {existingPlace.recommenders[0].name}&apos;s place
                    </span>
                  </p>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Caption (optional)
                    </label>
                    <Textarea
                      placeholder="Why do you recommend this place?"
                      value={recommenderCaption}
                      onChange={(e) => setRecommenderCaption(e.target.value)}
                      className="bg-white resize-none text-xs border-gray-200"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3 h-3" />
                      Category (optional)
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(e.target.value as FoodCategory | "")
                      }
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm shadow-black/5"
                    >
                      <option value="">Select a category</option>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Leaf className="w-3 h-3" />
                      Dietary Options (Friendly)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DIETARY_OPTIONS.map((opt) => {
                        const dietaryConfig = getDietaryConfig(opt.value);
                        const DietaryIcon = dietaryConfig.icon;
                        const isSelected = selectedDietary.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleDietary(opt.value)}
                            className={`px-2 py-1 text-[10px] md:text-xs rounded-lg font-medium transition-all duration-200 border flex items-center gap-1 ${
                              isSelected
                                ? `${dietaryConfig.bgColor} ${dietaryConfig.textColor} ${dietaryConfig.borderColor} shadow-md ${dietaryConfig.shadowColor}`
                                : "bg-white text-gray-700 border-gray-200 shadow-sm shadow-black/5 hover:bg-gray-50 hover:shadow-md hover:shadow-black/10"
                            }`}
                          >
                            <DietaryIcon className="w-2.5 h-2.5" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1 rounded-lg border-gray-200 text-xs py-2 h-auto shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving || !userProfile || hasUserAlreadyAdded}
                    className="flex-1 bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs py-2 h-auto shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 disabled:bg-gray-400 disabled:shadow-none transition-all duration-200"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : hasUserAlreadyAdded ? (
                      <span className="text-xs">Already Added</span>
                    ) : (
                      "Save to Map"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Google Maps Link */}
            {place.url && (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs text-gray-700 font-medium border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
              >
                <GlobeIcon className="w-3 h-3" />
                View on Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
