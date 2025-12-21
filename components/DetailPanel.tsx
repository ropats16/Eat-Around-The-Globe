"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import {
  X,
  MapPin,
  Star,
  ExternalLink,
  Share2,
  Heart,
  Phone,
  Clock,
  Award,
  Sparkles,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { uploadLikeAction } from "@/lib/arweave";
import { getUserLikeStatus, getPlaceLikeCount } from "@/lib/arweave-query";
import { getCategoryConfig, getDietaryConfig } from "@/lib/category-config";

export default function DetailPanel() {
  const {
    selectedFood,
    isDetailPanelOpen,
    closeDetailPanel,
    walletAddress,
    walletType,
    walletProvider,
    openWalletModal,
    userProfile,
  } = useFoodGlobeStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRecommenderIndex, setCurrentRecommenderIndex] = useState(0);

  // Fetch like status when place changes
  useEffect(() => {
    const placeId = selectedFood?.placeId;
    if (!placeId) return;

    const fetchLikeData = async () => {
      try {
        // Get like count
        const count = await getPlaceLikeCount(placeId);
        setLikeCount(count);

        // Get user's like status if connected
        if (walletAddress) {
          const liked = await getUserLikeStatus(placeId, walletAddress);
          setIsLiked(liked ?? false);
        }
      } catch (err) {
        console.error("Failed to fetch like data:", err);
      }
    };

    fetchLikeData();
  }, [selectedFood?.placeId, walletAddress]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isDetailPanelOpen) {
      setIsLiked(false);
      setLikeCount(0);
      setCurrentImageIndex(0);
      setCurrentRecommenderIndex(0);
    }
  }, [isDetailPanelOpen]);

  // Auto-rotate recommenders carousel
  useEffect(() => {
    if (!selectedFood?.recommenders || selectedFood.recommenders.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentRecommenderIndex((prev) =>
        prev === selectedFood.recommenders.length - 1 ? 0 : prev + 1
      );
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, [selectedFood?.recommenders]);

  if (!selectedFood) return null;

  const handleLike = async () => {
    // Need a placeId to like
    if (!selectedFood.placeId) {
      console.error("No placeId available");
      return;
    }

    // If not connected, prompt to connect
    if (!walletAddress || !walletType) {
      openWalletModal();
      return;
    }

    setIsLikeLoading(true);
    const newLikedState = !isLiked;

    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount((prev) => prev + (newLikedState ? 1 : -1));

    try {
      await uploadLikeAction(
        selectedFood.placeId,
        newLikedState ? "like" : "unlike",
        {
          walletType,
          walletAddress,
          provider: walletProvider, // Pass provider for ETH/SOL
          placeInfo: {
            name: selectedFood.name,
            country: selectedFood.country,
            countryCode: selectedFood.countryCode,
            city: selectedFood.city,
            address: selectedFood.address,
          },
          profileInfo: userProfile
            ? {
                username: userProfile.username,
              }
            : undefined,
        }
      );
      console.log(
        `✅ ${
          newLikedState ? "Liked" : "Unliked"
        } saved to Arweave via ${walletType}!`
      );
    } catch (err) {
      console.error("Failed to save like:", err);
      // Rollback on failure
      setIsLiked(!newLikedState);
      setLikeCount((prev) => prev + (newLikedState ? -1 : 1));
      alert("Failed to save to Arweave. Please try again.");
    } finally {
      setIsLikeLoading(false);
    }
  };

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
      {isDetailPanelOpen && selectedFood && (
        <motion.div
          key={`detail-panel-${
            selectedFood.id || selectedFood.placeId || "default"
          }`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 md:bottom-auto md:top-44 right-4 md:right-12 w-[calc(100%-2rem)] md:w-96 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden max-h-[calc(100dvh-14rem)] md:max-h-[calc(100vh-13rem)] flex flex-col z-30 pointer-events-auto hover:shadow-2xl hover:shadow-black/15 transition-shadow duration-200"
        >
          {/* Close Button */}
          <button
            onClick={closeDetailPanel}
            className="absolute top-2 right-2 z-20 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm shadow-black/10 flex items-center justify-center hover:bg-gray-100 hover:shadow-md hover:shadow-black/15 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5 text-gray-700" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0">
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
            <div className="p-3 md:p-4 space-y-3">
              {/* Title & Location */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  {selectedFood.name}
                </h2>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-lg md:text-xl">
                    {getFlagEmoji(selectedFood.countryCode)}
                  </span>
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                  <span className="text-xs md:text-sm">
                    {selectedFood.city}, {selectedFood.country}
                  </span>
                </div>
              </div>

              {/* Rating & Price */}
              <div className="flex items-center gap-2">
                {selectedFood.rating && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm shadow-black/5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs md:text-sm font-semibold text-gray-900">
                      {selectedFood.rating.toFixed(1)}
                    </span>
                    {selectedFood.totalReviews && (
                      <span className="text-[10px] md:text-xs text-gray-500">
                        ({selectedFood.totalReviews})
                      </span>
                    )}
                  </div>
                )}
                {selectedFood.priceRange && (
                  <div className="flex items-center gap-0.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-white rounded-lg border border-gray-200 shadow-sm shadow-black/5">
                    {Array.from({ length: selectedFood.priceRange }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className="text-green-700 text-xs md:text-sm"
                        >
                          $
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Category & Dietary Tags */}
              <div className="space-y-3">
                {/* Category Badge with Icon */}
                {(() => {
                  // Fallback to 'Casual Dining' if category doesn't exist in config
                  let categoryConfig = getCategoryConfig(selectedFood.category);
                  if (!categoryConfig) {
                    console.warn(
                      `Unknown category: ${selectedFood.category}, falling back to 'casual dining'`
                    );
                    categoryConfig = getCategoryConfig("casual-dining");
                  }
                  const CategoryIcon = categoryConfig.icon;
                  return (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Category:
                      </p>
                      <div className="flex items-center">
                        <span
                          className={`px-2.5 py-1.5 ${categoryConfig.bgColor} ${categoryConfig.textColor} border ${categoryConfig.borderColor} text-[10px] md:text-xs rounded-lg font-medium shadow-sm ${categoryConfig.shadowColor} flex items-center gap-1.5 w-fit`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {categoryConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Dietary Options */}
                {selectedFood.dietaryInfo.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Dietary Options:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFood.dietaryInfo.map((diet) => {
                        const dietaryConfig = getDietaryConfig(diet);
                        // Skip if dietary tag doesn't exist in config
                        if (!dietaryConfig) {
                          console.warn(
                            `Unknown dietary tag: ${diet}, skipping`
                          );
                          return null;
                        }
                        const DietaryIcon = dietaryConfig.icon;
                        return (
                          <span
                            key={diet}
                            className={`px-2 py-1 ${dietaryConfig.bgColor} ${dietaryConfig.textColor} text-[10px] md:text-xs rounded-lg font-medium border ${dietaryConfig.borderColor} shadow-sm ${dietaryConfig.shadowColor} flex items-center gap-1`}
                          >
                            <DietaryIcon className="w-2.5 h-2.5" />
                            {dietaryConfig.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Description */}
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  {/* <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500" /> */}
                  About
                </h3>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                  {selectedFood.description}
                </p>
              </div>

              {/* Recommender Info - Carousel */}
              {selectedFood.recommenders &&
                selectedFood.recommenders.length > 0 &&
                (() => {
                  // Ensure valid index
                  const validIndex = Math.min(
                    currentRecommenderIndex,
                    selectedFood.recommenders.length - 1
                  );
                  const currentRecommender =
                    selectedFood.recommenders[validIndex];

                  // Find the original recommender (oldest timestamp)
                  const originalRecommender = selectedFood.recommenders.reduce(
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
                        Recommended by {selectedFood.recommenders.length}{" "}
                        {selectedFood.recommenders.length === 1
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
                                {currentRecommender.name
                                  .charAt(0)
                                  .toUpperCase()}
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
                      {selectedFood.recommenders.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                          {selectedFood.recommenders.map((_, idx) => (
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

              {/* Additional Info */}
              {(selectedFood.address ||
                selectedFood.phone ||
                selectedFood.isOpenNow !== undefined) && (
                <div className="space-y-2">
                  {selectedFood.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-xs md:text-sm text-gray-700">
                        {selectedFood.address}
                      </span>
                    </div>
                  )}
                  {selectedFood.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                      <span className="text-xs md:text-sm text-gray-700">
                        {selectedFood.phone}
                      </span>
                    </div>
                  )}
                  {selectedFood.isOpenNow !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />
                      <span
                        className={`text-xs md:text-sm font-medium ${
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
                  <h3 className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Fun Facts
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedFood.funFacts.map((fact, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-700 flex items-start gap-1.5"
                      >
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External Links */}
              {selectedFood.externalLinks && (
                <div className="space-y-1.5">
                  {selectedFood.externalLinks.restaurant && (
                    <a
                      href={selectedFood.externalLinks.restaurant}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 p-2.5 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs text-gray-700 font-medium border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
                    >
                      <ExternalLink className="w-3 h-3 text-purple-600" />
                      <span>Visit Website</span>
                    </a>
                  )}
                  {selectedFood.externalLinks.wiki && (
                    <a
                      href={selectedFood.externalLinks.wiki}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 p-2.5 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs text-gray-700 font-medium border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
                    >
                      <ExternalLink className="w-3 h-3 text-blue-600" />
                      <span>View on Maps</span>
                    </a>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  disabled={isLikeLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all duration-200 font-medium text-xs border ${
                    isLiked
                      ? "bg-linear-to-br from-red-500 to-red-600 text-white border-red-500 hover:from-red-600 hover:to-red-700 shadow-md shadow-red-600/25"
                      : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
                  } ${isLikeLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isLikeLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-3.5 h-3.5 ${isLiked ? "fill-white" : ""}`}
                    />
                  )}
                  <span>
                    {isLiked ? "Liked" : "Like"}
                    {likeCount > 0 && ` (${likeCount})`}
                  </span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 text-gray-700 font-medium text-xs border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
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
