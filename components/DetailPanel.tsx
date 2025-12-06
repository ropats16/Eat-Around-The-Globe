"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import {
  X,
  MapPin,
  Star,
  DollarSign,
  ExternalLink,
  Share2,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  "street-food": "Street Food",
  "fine-dining": "Fine Dining",
  traditional: "Traditional",
  dessert: "Dessert",
  drink: "Drink",
  seafood: "Seafood",
  vegetarian: "Vegetarian",
  "fast-food": "Fast Food",
  bakery: "Bakery",
};

export default function DetailPanel() {
  const { selectedFood, isDetailPanelOpen, closeDetailPanel } =
    useFoodGlobeStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!selectedFood) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedFood.name,
          text: `Check out ${selectedFood.name} from ${selectedFood.country}!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <AnimatePresence>
      {isDetailPanelOpen && (
        <div className="fixed top-20 right-12 w-96 z-50 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-3xl shadow-[0_2px_12px_rgba(32,33,36,0.28)] overflow-hidden max-h-[calc(100vh-7rem)] flex flex-col"
          >
              {/* Close Button */}
              <button
                onClick={closeDetailPanel}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>

              {/* Scrollable Content */}
              <div className="overflow-y-auto custom-scrollbar">

                {/* Images */}
                {selectedFood.images.length > 0 && (
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={selectedFood.images[currentImageIndex]}
                      alt={selectedFood.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    {selectedFood.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedFood.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentImageIndex
                                ? "bg-white w-6 shadow-md"
                                : "bg-white/70 w-2"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {selectedFood.name}
                    </h2>
                  </div>

                  {/* Location & Rating */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-xl">
                        {getFlagEmoji(selectedFood.countryCode)}
                      </span>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedFood.city}, {selectedFood.country}
                      </span>
                    </div>

                    {/* Rating & Price */}
                    <div className="flex items-center gap-4 text-sm">
                      {selectedFood.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium text-gray-900">
                            {selectedFood.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {selectedFood.priceRange && (
                        <div className="flex items-center gap-1 text-gray-600">
                          {Array.from({ length: selectedFood.priceRange }).map(
                            (_, i) => (
                              <DollarSign key={i} className="w-4 h-4" />
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Category & Dietary Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                        {CATEGORY_LABELS[selectedFood.category]}
                      </span>
                      {selectedFood.dietaryInfo.map((diet) => (
                        <span
                          key={diet}
                          className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full capitalize font-medium"
                        >
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      About
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedFood.description}
                    </p>
                  </div>

                  {/* Recommender Info */}
                  {selectedFood.recommender && (
                    <div className="p-4 bg-linear-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-green-600">✨</span>
                        Recommended by
                      </h3>
                      <div className="flex items-start gap-3">
                        {selectedFood.recommender.profilePicture ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-green-300">
                            <Image
                              src={selectedFood.recommender.profilePicture}
                              alt={selectedFood.recommender.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0 ring-2 ring-green-300">
                            {selectedFood.recommender.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {selectedFood.recommender.name}
                          </p>
                          {selectedFood.recommender.caption && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              &ldquo;{selectedFood.recommender.caption}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {selectedFood.address && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Address
                      </h3>
                      <p className="text-sm text-gray-700">
                        {selectedFood.address}
                      </p>
                    </div>
                  )}

                  {/* Fun Facts */}
                  {selectedFood.funFacts && selectedFood.funFacts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Fun Facts
                      </h3>
                      <ul className="space-y-1">
                        {selectedFood.funFacts.map((fact, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <span className="text-blue-600">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* External Links */}
                  {selectedFood.externalLinks && (
                    <div className="space-y-2">
                      {selectedFood.externalLinks.restaurant && (
                        <a
                          href={selectedFood.externalLinks.restaurant}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-900">
                            Visit Website
                          </span>
                        </a>
                      )}
                      {selectedFood.externalLinks.wiki && (
                        <a
                          href={selectedFood.externalLinks.wiki}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-900">
                            View on Maps
                          </span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-sm ${
                        isFavorite
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite ? "fill-white" : ""}`}
                      />
                      <span>{isFavorite ? "Saved" : "Save"}</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-900 font-medium text-sm"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>
  );
}
