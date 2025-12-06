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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetailPanel}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-[#0a0a0a] z-50 overflow-y-auto custom-scrollbar border-l border-white/10"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold text-white truncate pr-4">
                  {selectedFood.name}
                </h2>
                <button
                  onClick={closeDetailPanel}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Images */}
            {selectedFood.images.length > 0 && (
              <div className="relative aspect-video bg-white/5">
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
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "bg-white w-6"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Location & Category */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-2xl">
                    {getFlagEmoji(selectedFood.countryCode)}
                  </span>
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {selectedFood.city}, {selectedFood.country}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {CATEGORY_LABELS[selectedFood.category]}
                  </span>
                  {selectedFood.dietaryInfo.map((diet) => (
                    <span
                      key={diet}
                      className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full capitalize"
                    >
                      {diet}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rating & Price */}
              <div className="flex items-center gap-6">
                {selectedFood.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold">
                      {selectedFood.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: selectedFood.priceRange }).map(
                    (_, i) => (
                      <DollarSign key={i} className="w-4 h-4" />
                    )
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  About
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {selectedFood.description}
                </p>
              </div>

              {/* Recommender Info */}
              {selectedFood.recommender && (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">✨</span>
                    Recommended by
                  </h3>
                  <div className="flex items-start gap-3">
                    {selectedFood.recommender.profilePicture ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-green-400/50">
                        <Image
                          src={selectedFood.recommender.profilePicture}
                          alt={selectedFood.recommender.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-green-400/50">
                        {selectedFood.recommender.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">
                        {selectedFood.recommender.name}
                      </p>
                      {selectedFood.recommender.caption && (
                        <p className="text-sm text-white/70 mt-1 italic">
                          "{selectedFood.recommender.caption}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              {selectedFood.address && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Address
                  </h3>
                  <p className="text-sm text-white/70">{selectedFood.address}</p>
                </div>
              )}

              {/* Fun Facts */}
              {selectedFood.funFacts && selectedFood.funFacts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Fun Facts
                  </h3>
                  <ul className="space-y-1">
                    {selectedFood.funFacts.map((fact, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-white/70 flex items-start gap-2"
                      >
                        <span className="text-blue-400">•</span>
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
                      className="flex items-center gap-2 p-3 glass hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">Visit Website</span>
                    </a>
                  )}
                  {selectedFood.externalLinks.wiki && (
                    <a
                      href={selectedFood.externalLinks.wiki}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 glass hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">View on Maps</span>
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                    isFavorite
                      ? "bg-red-500 text-white"
                      : "glass hover:bg-white/10 text-white"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite ? "fill-white" : ""
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isFavorite ? "Saved" : "Save"}
                  </span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 glass hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
