"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { useMemo, useRef, useEffect } from "react";
import Image from "next/image";

export default function ActivityFeed() {
  const { foods, selectFood, centerGlobe } = useFoodGlobeStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flatten all recommendations and sort by dateRecommended
  const visibleRecommendations = useMemo(() => {
    const allRecommendations = foods.flatMap((food) =>
      food.recommenders.map((recommender) => ({
        food,
        recommender,
      }))
    );

    // Sort by dateRecommended, newest first
    const sorted = allRecommendations.sort(
      (a, b) =>
        new Date(b.recommender.dateRecommended).getTime() -
        new Date(a.recommender.dateRecommended).getTime()
    );

    // Get the 10 most recent, then reverse so oldest is first (top) and newest is last (bottom)
    return sorted.slice(0, 10).reverse();
  }, [foods]);

  // Auto-scroll to bottom when new recommendations appear
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [visibleRecommendations]);

  const handleRecommendationClick = (food: (typeof foods)[0]) => {
    selectFood(food);
    centerGlobe(food.coordinates[0], food.coordinates[1]);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(seconds / 86400);

    // Now
    if (seconds < 60) return "Now";

    // X minutes/hours ago
    if (minutes < 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    // Show date for up to 7 days
    if (days <= 7) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    // Last week (8-14 days)
    if (days <= 14) return "Last week";

    // Last month (15-60 days)
    if (days <= 60) return "Last month";

    // Last year (61-365 days)
    if (days <= 365) return "Last year";

    // Show full date for older
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getDisplayName = (name: string | undefined, wallet: string) => {
    if (!name || name.includes("...")) {
      // No name or shortened wallet - format wallet properly
      return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    }
    return name;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="absolute bottom-4 left-4 md:bottom-6 md:left-12 w-[calc(100%-2rem)] md:w-96 max-h-[calc(100dvh-12rem)] md:max-h-none pointer-events-auto z-20"
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/25 p-3 md:p-4 border border-gray-700/50 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] transition-shadow duration-200">
        <div
          ref={scrollContainerRef}
          className="h-24 md:h-48 max-h-[calc(100dvh-14rem)] md:max-h-48 overflow-y-auto space-y-2 custom-scrollbar"
        >
          <AnimatePresence mode="popLayout">
            {visibleRecommendations.map((rec, index) => {
              const displayName = getDisplayName(
                rec.recommender.name,
                rec.recommender.walletAddress
              );
              return (
                <motion.button
                  key={`${rec.food.id}-${rec.recommender.walletAddress}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRecommendationClick(rec.food)}
                  className="w-full text-left group hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-start gap-2">
                    {rec.recommender.profilePicture ? (
                      <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 shadow-sm shadow-black/10 mt-0.5">
                        <Image
                          src={rec.recommender.profilePicture}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-linear-to-br from-blue-300 to-blue-500 flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20 mt-0.5">
                        <span className="text-white text-[9px] font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-200 leading-tight">
                        <span className="font-medium">{displayName}</span>
                        <span className="text-gray-400">recommended</span>
                        <span className="text-white font-medium">
                          {rec.food.name}
                        </span>
                        <span className="text-gray-400">from</span>
                        <span className="font-medium">{rec.food.city}</span>
                        <span className="text-sm">
                          {getFlagEmoji(rec.food.countryCode)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {getTimeAgo(rec.recommender.dateRecommended)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {visibleRecommendations.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-xs">
              No activity yet
              <br />
              <span className="text-[10px] text-gray-600">
                Start by searching for a place!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </motion.div>
  );
}
