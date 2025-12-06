"use client";

import { motion } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { UtensilsCrossed, MapPin, Filter, Globe2 } from "lucide-react";
import { FoodCategory, DietaryTag } from "@/lib/types";
import { useState } from "react";

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: "street-food", label: "Street Food" },
  { value: "fine-dining", label: "Fine Dining" },
  { value: "traditional", label: "Traditional" },
  { value: "dessert", label: "Dessert" },
  { value: "drink", label: "Drink" },
  { value: "seafood", label: "Seafood" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "fast-food", label: "Fast Food" },
  { value: "bakery", label: "Bakery" },
];

const DIETARY_OPTIONS: { value: DietaryTag; label: string }[] = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
];

export default function Sidebar() {
  const { foods, getFilteredFoods, filters, setFilters, resetFilters } =
    useFoodGlobeStore();
  const [showFilters, setShowFilters] = useState(false);

  const filteredFoods = getFilteredFoods();
  const countries = new Set(foods.map((f) => f.country));

  const categoryCount = filters.categories.length;
  const dietaryCount = filters.dietaryInfo.length;
  const hasActiveFilters =
    categoryCount > 0 || dietaryCount > 0 || filters.searchQuery;

  const toggleCategory = (category: FoodCategory) => {
    const current = filters.categories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setFilters({ categories: updated });
  };

  const toggleDietary = (dietary: DietaryTag) => {
    const current = filters.dietaryInfo;
    const updated = current.includes(dietary)
      ? current.filter((d) => d !== dietary)
      : [...current, dietary];
    setFilters({ dietaryInfo: updated });
  };

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-8 left-8 z-20 w-1/4"
    >
      {/* Main Card - White style like DataFast */}
      <div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-2"
        style={{ padding: "0.6rem" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-linear-to-br from-orange-400 to-pink-500 rounded-xl">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-md font-bold text-gray-900">Food Globe</h1>
          <div className="px-8 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md uppercase tracking-wider">
            Real-Time
          </div>
        </div>

        {/* Main Stat */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            <span className="text-lg font-bold text-gray-900">
              {filteredFoods.length}
            </span>
            <span className="text-base text-gray-500 mt-1">places on</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <Globe2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">foodglobe.com</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-5 flex flex-col gap-2">
          {/* Categories */}
          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-3">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 4).map((cat) => {
                const count = filteredFoods.filter(
                  (f) => f.category === cat.value
                ).length;
                if (count === 0) return null;
                return (
                  <div
                    key={cat.value}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200"
                  >
                    <span className="text-sm text-gray-700">{cat.label}</span>
                    <span className="text-xs text-gray-500">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Countries */}
          <div>
            <h3 className="text-sm text-gray-500 font-medium mb-3">
              Countries
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(countries)
                .slice(0, 5)
                .map((country, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200"
                  >
                    <span className="text-sm text-gray-700">{country}</span>
                    <span className="text-xs text-gray-500">
                      ({foods.filter((f) => f.country === country).length})
                    </span>
                  </div>
                ))}
              {countries.size > 5 && (
                <div className="px-3 py-1.5 text-xs text-gray-400">
                  +{countries.size - 5} more
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="pt-5 mt-5 border-t border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                  {categoryCount + dietaryCount}
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: showFilters ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 text-sm"
            >
              ▼
            </motion.div>
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-5 max-h-96 overflow-y-auto custom-scrollbar"
            >
              {/* Categories */}
              <div>
                <h3 className="text-sm text-gray-500 font-medium mb-3">
                  Filter by Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        filters.categories.includes(cat.value)
                          ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <h3 className="text-sm text-gray-500 font-medium mb-3">
                  Dietary Options
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((diet) => (
                    <button
                      key={diet.value}
                      onClick={() => toggleDietary(diet.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        filters.dietaryInfo.includes(diet.value)
                          ? "bg-green-500 text-white border-green-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {diet.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
