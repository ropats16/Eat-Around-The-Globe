"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { Eye } from "lucide-react";
import { useMemo } from "react";

export default function ActivityFeed() {
  const { foods, selectFood, centerGlobe } = useFoodGlobeStore();

  // Use useMemo instead of useEffect + useState
  // Sort oldest first so newest appears at bottom
  const visibleFoods = useMemo(() => {
    const sorted = [...foods].sort(
      (a, b) =>
        new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    );
    return sorted.slice(-5); // Get last 5 items
  }, [foods]);

  const handleFoodClick = (food: (typeof foods)[0]) => {
    selectFood(food);
    centerGlobe(food.coordinates[0], food.coordinates[1]);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getAnonymousName = (id: string) => {
    const adjectives = [
      "silver",
      "golden",
      "crystal",
      "emerald",
      "sapphire",
      "ruby",
      "pearl",
      "amber",
    ];
    const nouns = [
      "shrew",
      "fox",
      "owl",
      "raven",
      "wolf",
      "hawk",
      "dove",
      "lynx",
    ];

    // Simple hash function to get deterministic index from ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(hash >> 8) % nouns.length;

    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="absolute bottom-4 left-4 md:bottom-6 md:left-12 w-[calc(100%-2rem)] md:w-96 max-h-[calc(100dvh-12rem)] md:max-h-none pointer-events-auto z-20"
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/25 p-3 md:p-4 border border-gray-700/50 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] transition-shadow duration-200">
        <div className="h-40 md:h-48 max-h-[calc(100dvh-14rem)] md:max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {visibleFoods.map((food, index) => (
              <motion.button
                key={food.id || `food-${index}-${food.placeId || food.name}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleFoodClick(food)}
                className="w-full text-left group hover:bg-white/10 p-2 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg shadow-black/20"
              >
                <div className="flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-200 leading-tight">
                      <span className="font-medium">
                        {getAnonymousName(food.id)}
                      </span>
                      <span className="text-gray-400">recommended</span>
                      <span className="text-white font-medium">
                        {food.name}
                      </span>
                      <span className="text-gray-400">from</span>
                      <span className="font-medium">{food.city}</span>
                      <span className="text-sm">
                        {getFlagEmoji(food.countryCode)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {getTimeAgo(food.dateAdded)}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {visibleFoods.length === 0 && (
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
