"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { Eye } from "lucide-react";
import { useMemo } from "react";

export default function ActivityFeed() {
  const { foods, selectFood, centerGlobe } = useFoodGlobeStore();

  // Use useMemo instead of useEffect + useState
  const visibleFoods = useMemo(() => {
    const sorted = [...foods].sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
    return sorted.slice(0, 5);
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
      className="absolute bottom-6 left-12 w-96 pointer-events-auto"
    >
      <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl shadow-2xl p-5 border border-gray-700/30">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleFoods.map((food, index) => (
              <motion.button
                key={food.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleFoodClick(food)}
                className="w-full text-left group hover:bg-white/5 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-sm text-gray-200 leading-tight">
                      <span className="font-medium">
                        {getAnonymousName(food.id)}
                      </span>
                      <span className="text-gray-400">recommended</span>
                      <span className="text-white font-medium">
                        {food.name}
                      </span>
                      <span className="text-gray-400">from</span>
                      <span className="font-medium">{food.city}</span>
                      <span className="text-base">
                        {getFlagEmoji(food.countryCode)}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {getTimeAgo(food.dateAdded)}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {visibleFoods.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No activity yet
              <br />
              <span className="text-xs text-gray-600">
                Start by searching for a place!
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
