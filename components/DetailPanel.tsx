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
  Phone,
  Clock,
  Award,
  Sparkles,
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

const DIETARY_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  halal: "Halal",
  kosher: "Kosher",
  "dairy-free": "Dairy-Free",
  "nut-free": "Nut-Free",
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
    } catch {
      console.log("Share canceled");
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-h-[calc(100vh-7rem)] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={closeDetailPanel}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto custom-scrollbar">
              {/* Images */}
              {selectedFood.images.length > 0 && (
                <div className="relative h-56 bg-gray-100">
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
              <div className="p-6 space-y-5">
                {/* Title & Location */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedFood.name}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xl">
                      {getFlagEmoji(selectedFood.countryCode)}
                    </span>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {selectedFood.city}, {selectedFood.country}
                    </span>
                  </div>
                </div>

                {/* Rating & Price */}
                <div className="flex items-center gap-4">
                  {selectedFood.rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-200">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedFood.rating.toFixed(1)}
                      </span>
                      {selectedFood.totalReviews && (
                        <span className="text-xs text-gray-500">
                          ({selectedFood.totalReviews})
                        </span>
                      )}
                    </div>
                  )}
                  {selectedFood.priceRange && (
                    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                      {Array.from({ length: selectedFood.priceRange }).map(
                        (_, i) => (
                          <DollarSign
                            key={i}
                            className="w-3.5 h-3.5 text-green-600"
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Category & Dietary Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium border border-purple-200">
                    {CATEGORY_LABELS[selectedFood.category]}
                  </span>
                  {selectedFood.dietaryInfo.map((diet) => (
                    <span
                      key={diet}
                      className="px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-full font-medium border border-green-200"
                    >
                      {DIETARY_LABELS[diet]}
                    </span>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    About
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedFood.description}
                  </p>
                </div>

                {/* Recommender Info */}
                {selectedFood.recommenders && selectedFood.recommenders.length > 0 && (
                  <div className="p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      Recommended by {selectedFood.recommenders.length} {selectedFood.recommenders.length === 1 ? 'person' : 'people'}
                    </h3>
                    <div className="space-y-3">
                      {/* First recommender (original) - shown prominently */}
                      {selectedFood.recommenders.map((recommender, idx) => (
                        <div key={idx} className={`flex items-start gap-3 ${idx > 0 ? 'pt-3 border-t border-purple-200' : ''}`}>
                          {recommender.profilePicture ? (
                            <Image
                              src={recommender.profilePicture}
                              alt={recommender.name}
                              width={idx === 0 ? 48 : 40}
                              height={idx === 0 ? 48 : 40}
                              className={`${idx === 0 ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover ring-2 ${idx === 0 ? 'ring-purple-400' : 'ring-purple-200'}`}
                            />
                          ) : (
                            <div className={`${idx === 0 ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-linear-to-br from-purple-400 to-pink-500 flex items-center justify-center ring-2 ${idx === 0 ? 'ring-purple-400' : 'ring-purple-200'}`}>
                              <span className={`text-white font-bold ${idx === 0 ? 'text-lg' : 'text-base'}`}>
                                {recommender.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`${idx === 0 ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                                {recommender.name}
                              </p>
                              {idx === 0 && (
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full font-medium">
                                  Original
                                </span>
                              )}
                            </div>
                            {recommender.caption && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                &ldquo;{recommender.caption}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(selectedFood.address ||
                  selectedFood.phone ||
                  selectedFood.isOpenNow !== undefined) && (
                  <div className="space-y-3">
                    {selectedFood.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {selectedFood.address}
                        </span>
                      </div>
                    )}
                    {selectedFood.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {selectedFood.phone}
                        </span>
                      </div>
                    )}
                    {selectedFood.isOpenNow !== undefined && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          className={`text-sm font-medium ${
                            selectedFood.isOpenNow
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedFood.isOpenNow ? "Open now" : "Closed"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Fun Facts */}
                {selectedFood.funFacts && selectedFood.funFacts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Fun Facts
                    </h3>
                    <ul className="space-y-2">
                      {selectedFood.funFacts.map((fact, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <span className="text-purple-500 mt-1">•</span>
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
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <ExternalLink className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-900 font-medium">
                          Visit Website
                        </span>
                      </a>
                    )}
                    {selectedFood.externalLinks.wiki && (
                      <a
                        href={selectedFood.externalLinks.wiki}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-900 font-medium">
                          View on Maps
                        </span>
                      </a>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-sm border ${
                      isFavorite
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`}
                    />
                    <span>{isFavorite ? "Saved" : "Save"}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-medium text-sm border border-gray-200"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
    </AnimatePresence>
  );
}
