"use client";

import { motion } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import {
  Share2,
  RotateCw,
  Pause,
  Users,
  MapPin,
  UtensilsCrossed,
  Coffee,
  IceCream,
  Pizza,
  Fish,
  Leaf,
  Croissant,
  Salad,
  Sparkles,
  ShieldCheck,
  Wheat,
  Milk,
  Nut,
  LucideIcon,
} from "lucide-react";
import { FoodCategory, DietaryTag } from "@/lib/types";
import Image from "next/image";

const CATEGORIES: { value: FoodCategory; label: string; icon: LucideIcon }[] = [
  { value: "street-food", label: "Street Food", icon: Pizza },
  { value: "fine-dining", label: "Fine Dining", icon: Sparkles },
  { value: "traditional", label: "Traditional", icon: UtensilsCrossed },
  { value: "dessert", label: "Dessert", icon: IceCream },
  { value: "drink", label: "Drink", icon: Coffee },
  { value: "seafood", label: "Seafood", icon: Fish },
  { value: "vegetarian", label: "Vegetarian", icon: Salad },
  { value: "fast-food", label: "Fast Food", icon: Pizza },
  { value: "bakery", label: "Bakery", icon: Croissant },
];

const DIETARY_OPTIONS: {
  value: DietaryTag;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "vegan", label: "Vegan", icon: Leaf },
  { value: "vegetarian", label: "Vegetarian", icon: Salad },
  { value: "gluten-free", label: "Gluten-Free", icon: Wheat },
  { value: "halal", label: "Halal", icon: ShieldCheck },
  { value: "kosher", label: "Kosher", icon: ShieldCheck },
  { value: "dairy-free", label: "Dairy-Free", icon: Milk },
  { value: "nut-free", label: "Nut-Free", icon: Nut },
];

export default function Sidebar() {
  const {
    foods,
    getFilteredFoods,
    filters,
    setFilters,
    autoRotate,
    toggleAutoRotate,
  } = useFoodGlobeStore();

  const filteredFoods = getFilteredFoods();

  // Get unique recommenders
  const recommenders = foods
    .filter((f) => f.recommender?.name)
    .reduce((acc, food) => {
      const name = food.recommender!.name;
      if (!acc.some((r) => r.name === name)) {
        acc.push({
          name,
          profilePicture: food.recommender!.profilePicture,
          count: foods.filter((f) => f.recommender?.name === name).length,
        });
      }
      return acc;
    }, [] as { name: string; profilePicture?: string; count: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get unique users count
  const uniqueUsers = new Set(
    foods.filter((f) => f.recommender?.name).map((f) => f.recommender!.name)
  ).size;

  // Get countries with counts
  const countries = foods
    .reduce((acc, food) => {
      const existing = acc.find((c) => c.country === food.country);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          country: food.country,
          countryCode: food.countryCode,
          count: 1,
        });
      }
      return acc;
    }, [] as { country: string; countryCode: string; count: number }[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Convert country code to flag emoji
  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Food Globe",
          text: "Check out this amazing food discovery app!",
          url: window.location.href,
        });
      } catch {
        console.log("Share canceled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="absolute top-6 left-12 w-96 pointer-events-auto"
    >
      {/* Main Card - White style like DataFast */}
      <div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-2.5"
        style={{ padding: "1rem" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <Image
                src="/MapPinPurple.svg"
                alt="Food Globe"
                width={28}
                height={28}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Eat Around The Globe
              </h1>
              {/* <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                Real-Time
              </span> */}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={toggleAutoRotate}
              className={`p-1.5 rounded-lg transition-colors ${
                autoRotate
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600"
              }`}
              title={autoRotate ? "Pause rotation" : "Start rotation"}
            >
              {autoRotate ? (
                <Pause className="w-4 h-4" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Main Stat */}
        <div className="flex items-baseline gap-1.5 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-lg font-bold text-gray-900">
              {filteredFoods.length}
            </span>
          </div>
          <span className="text-gray-600">places added by</span>
          <span className="text-base font-bold text-gray-900">
            {uniqueUsers}
          </span>
          <span className="text-gray-600">users</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Top Recommenders */}
        {recommenders.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Top Recommenders
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {recommenders.map((rec) => (
                <div
                  key={rec.name}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-200"
                >
                  {rec.profilePicture ? (
                    <Image
                      src={rec.profilePicture}
                      alt={rec.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-linear-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-[8px] font-semibold">
                        {rec.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-700">{rec.name}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    ({rec.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Countries */}
        <div>
          <h3 className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Top Countries
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {countries.map((c) => (
              <div
                key={c.countryCode}
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-200"
              >
                <span className="text-sm">{getFlagEmoji(c.countryCode)}</span>
                <span className="text-xs text-gray-700">{c.country}</span>
                <span className="text-[10px] text-gray-500 font-semibold">
                  ({c.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <h3 className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Place Type
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = filters.categories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                    isActive
                      ? "bg-purple-500 text-white border-purple-500 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Filters */}
        <div>
          <h3 className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            Dietary Options
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map((diet) => {
              const Icon = diet.icon;
              const isActive = filters.dietaryInfo.includes(diet.value);
              return (
                <button
                  key={diet.value}
                  onClick={() => toggleDietary(diet.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                    isActive
                      ? "bg-green-500 text-white border-green-500 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {diet.label}
                </button>
              );
            })}
          </div>
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
  );
}
