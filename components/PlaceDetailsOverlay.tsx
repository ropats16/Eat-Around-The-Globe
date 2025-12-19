"use client";

import { useState, useMemo } from "react";
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
  Image as ImageIcon,
  UtensilsCrossed,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Recommender, FoodCategory, DietaryTag } from "@/lib/types";
import { uploadRecommendation } from "@/lib/arweave";

interface PlaceDetailsOverlayProps {
  place: google.maps.places.PlaceResult | null;
  onClose: () => void;
  onSaveToMap: (recommender: Recommender) => void;
  isSaving?: boolean;
}

const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = [
  { value: "traditional", label: "Traditional" },
  { value: "street-food", label: "Street Food" },
  { value: "fine-dining", label: "Fine Dining" },
  { value: "fast-food", label: "Fast Food" },
  { value: "dessert", label: "Dessert" },
  { value: "bakery", label: "Bakery" },
  { value: "seafood", label: "Seafood" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "drink", label: "Drinks/Bar" },
];

const DIETARY_OPTIONS: { value: DietaryTag; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
];

export default function PlaceDetailsOverlay({
  place,
  onClose,
  onSaveToMap,
  isSaving = false,
}: PlaceDetailsOverlayProps) {
  const foods = useFoodGlobeStore((state) => state.foods);
  const walletAddress = useFoodGlobeStore((state) => state.walletAddress);
  const walletType = useFoodGlobeStore((state) => state.walletType);
  const walletProvider = useFoodGlobeStore((state) => state.walletProvider);

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
    if (types.includes("bar") || types.includes("night_club")) return "drink";
    if (types.includes("cafe")) return "dessert";
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
  const [recommenderName, setRecommenderName] = useState("");
  const [recommenderPfp, setRecommenderPfp] = useState("");
  const [recommenderCaption, setRecommenderCaption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "">(
    detectedCategory
  );
  const [selectedDietary, setSelectedDietary] =
    useState<DietaryTag[]>(detectedDietary);

  // Check if current user (by name) has already added this place
  const hasUserAlreadyAdded = useMemo(() => {
    if (!existingPlace || !recommenderName.trim()) return false;
    return existingPlace.recommenders.some(
      (r) => r.name.toLowerCase() === recommenderName.trim().toLowerCase()
    );
  }, [existingPlace, recommenderName]);

  if (!place) return null;

  const photos = place.photos?.slice(0, 3) || [];
  const priceLevel = place.price_level ? "$".repeat(place.price_level) : null;

  const handleSubmit = async () => {
    if (!recommenderName.trim() || hasUserAlreadyAdded) {
      return;
    }

    const recommender: Recommender = {
      name: recommenderName.trim(),
      profilePicture: recommenderPfp.trim() || undefined,
      caption: recommenderCaption.trim() || undefined,
      category: selectedCategory || undefined,
      dietaryInfo: selectedDietary.length > 0 ? selectedDietary : undefined,
      dateRecommended: new Date().toISOString(),
    };

    // If wallet connected, upload to Arweave FIRST before saving locally
    if (walletType && walletAddress && place?.place_id) {
      try {
        console.log(
          `📤 Uploading recommendation to Arweave via ${walletType}...`
        );
        const result = await uploadRecommendation(
          place.place_id,
          {
            caption: recommenderCaption.trim(),
            category: selectedCategory || "traditional",
            dietaryTags: selectedDietary,
          },
          {
            walletType,
            walletAddress,
            provider: walletProvider, // Pass provider for ETH/SOL
          }
        );
        console.log("✅ Recommendation saved to Arweave:", result.id);

        // Only save locally AFTER Arweave succeeds
        onSaveToMap(recommender);
      } catch (arweaveError) {
        console.error("❌ Failed to save to Arweave:", arweaveError);
        // Don't save locally - show error to user
        alert("Failed to save recommendation to Arweave. Please try again.");
        return; // Don't proceed
      }
    } else {
      // No wallet connected - just save locally
      console.log("ℹ️ No wallet connected - saving locally only");
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-h-[calc(100vh-7rem)] flex flex-col z-10"
      >
        {/* Scrollable wrapper */}
        <div className="overflow-y-auto custom-scrollbar">
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
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Title and Rating */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {place.name}
              </h2>
              <div className="flex items-center gap-3">
                {place.rating && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-200">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {place.rating}
                    </span>
                    {place.user_ratings_total && (
                      <span className="text-xs text-gray-500">
                        ({place.user_ratings_total.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {priceLevel && (
                  <span className="px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 text-sm text-gray-700 font-medium">
                    {priceLevel}
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              {place.formatted_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {place.formatted_address}
                  </span>
                </div>
              )}

              {place.international_phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">
                    {place.international_phone_number}
                  </span>
                </div>
              )}

              {place.website && (
                <div className="flex items-center gap-3">
                  <GlobeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline truncate"
                  >
                    {new URL(place.website).hostname}
                  </a>
                </div>
              )}

              {place.opening_hours?.weekday_text && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-900 font-medium">
                        {place.opening_hours.open_now ? (
                          <span className="text-green-600">Open now</span>
                        ) : (
                          <span className="text-red-600">Closed</span>
                        )}
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
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

            {/* Action Button / Form */}
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add to My Map
                </span>
              </Button>
            ) : (
              <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Your Recommendation
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <InputGroup className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <InputGroupAddon>
                        <User className="w-4 h-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder="Enter your name"
                        value={recommenderName}
                        onChange={(e) => setRecommenderName(e.target.value)}
                        className="text-sm"
                      />
                    </InputGroup>
                    {hasUserAlreadyAdded && (
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <span className="font-medium">
                          ⚠️ You have already added this place
                        </span>
                      </p>
                    )}
                    {existingPlace &&
                      recommenderName.trim() &&
                      !hasUserAlreadyAdded && (
                        <p className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                          <span className="font-medium">
                            ✨ Adding your recommendation to{" "}
                            {existingPlace.recommenders[0].name}&apos;s place
                          </span>
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture URL (optional)
                    </label>
                    <InputGroup className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <InputGroupAddon>
                        <ImageIcon className="w-4 h-4" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder="https://example.com/your-photo.jpg"
                        value={recommenderPfp}
                        onChange={(e) => setRecommenderPfp(e.target.value)}
                        className="text-sm"
                      />
                    </InputGroup>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Caption (optional)
                    </label>
                    <Textarea
                      placeholder="Why do you recommend this place?"
                      value={recommenderCaption}
                      onChange={(e) => setRecommenderCaption(e.target.value)}
                      className="bg-white resize-none text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Category (optional)
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(e.target.value as FoodCategory | "")
                      }
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Dietary Tags (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleDietary(opt.value)}
                          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${
                            selectedDietary.includes(opt.value)
                              ? "bg-green-500 text-white border-green-500 shadow-sm"
                              : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1 rounded-lg border-gray-200"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSaving || !recommenderName.trim() || hasUserAlreadyAdded
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : hasUserAlreadyAdded ? (
                      <span className="text-sm">Already Added</span>
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
                className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700 font-medium border border-gray-200"
              >
                <GlobeIcon className="w-4 h-4" />
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
