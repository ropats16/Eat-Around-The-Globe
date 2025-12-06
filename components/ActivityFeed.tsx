"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { Eye, Clock } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ActivityFeed() {
  const { foods, selectFood, centerGlobe } = useFoodGlobeStore();
  const [visibleFoods, setVisibleFoods] = useState<typeof foods>([]);

  useEffect(() => {
    // Show the latest 5 foods
    const sorted = [...foods].sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
    setVisibleFoods(sorted.slice(0, 5));
  }, [foods]);

  const handleFoodClick = (food: typeof foods[0]) => {
    selectFood(food);
    centerGlobe(food.coordinates[0], food.coordinates[1]);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="fixed bottom-6 left-6 w-96 z-20"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Discoveries
          </h2>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {visibleFoods.map((food, index) => (
              <motion.button
                key={food.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleFoodClick(food)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                {/* Food Image/Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xl overflow-hidden border-2 border-white shadow-sm">
                  {food.images[0] ? (
                    <Image
                      src={food.images[0]}
                      alt={food.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    "🍽️"
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {food.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>from</span>
                    <span className="font-medium">{getFlagEmoji(food.countryCode)}</span>
                    <span className="font-medium">{food.country}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{getTimeAgo(food.dateAdded)}</span>
                  </div>
                </div>

                {/* Price indicator */}
                <div className="flex-shrink-0 text-xs text-amber-600 font-medium">
                  {"$".repeat(food.priceRange)}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {visibleFoods.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No food places added yet.
              <br />
              <span className="text-xs">Start by searching for a place!</span>
            </div>
          )}
        </div>

        {foods.length > 5 && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-center">
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all {foods.length} places →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
