"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useFoodGlobeStore } from "@/lib/store";
import {
  Share2,
  RotateCw,
  Pause,
  Coffee,
  IceCream,
  Pizza,
  Fish,
  Croissant,
  Salad,
  Sparkles,
  ShieldCheck,
  Wheat,
  Milk,
  Nut,
  LucideIcon,
  UtensilsCrossed,
  Leaf,
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
    isSidebarOpen,
    setSidebarOpen,
  } = useFoodGlobeStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-open sidebar on desktop
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setSidebarOpen]);

  const filteredFoods = getFilteredFoods();

  // Get unique recommenders - flatten all recommenders from all foods
  const allRecommenders = foods.flatMap((f) => f.recommenders || []);
  const recommenderCounts = allRecommenders.reduce((acc, rec) => {
    // Use walletAddress as the unique identifier for grouping
    const existing = acc.find((r) => r.walletAddress === rec.walletAddress);

    // Helper to get display name - prefer username over wallet
    const getDisplayName = (name: string | undefined, wallet: string) => {
      if (!name || name.includes("...")) {
        // No name or shortened wallet - format wallet properly
        return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
      }
      return name;
    };

    if (existing) {
      existing.count++;
      // Update profile picture if this entry has one and existing doesn't
      if (rec.profilePicture && !existing.profilePicture) {
        existing.profilePicture = rec.profilePicture;
      }
      // Prefer actual usernames over shortened wallet addresses
      if (rec.name && !rec.name.includes("...")) {
        existing.displayName = rec.name;
      }
    } else {
      acc.push({
        walletAddress: rec.walletAddress,
        displayName: getDisplayName(rec.name, rec.walletAddress),
        profilePicture: rec.profilePicture,
        count: 1,
      });
    }
    return acc;
  }, [] as { walletAddress: string; displayName: string; profilePicture?: string; count: number }[]);

  const recommenders = recommenderCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get unique users count
  const uniqueUsers = new Set(allRecommenders.map((r) => r.walletAddress)).size;

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
          title: "Eat Around The Globe",
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
    <>
      {/* Mobile: Backdrop when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => useFoodGlobeStore.getState().setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          x: isMobile ? (isSidebarOpen ? 0 : -400) : 0,
          opacity: isMobile ? (isSidebarOpen ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-20 md:top-6 left-4 md:left-12 w-[calc(100%-2rem)] md:w-96 max-h-[calc(100dvh-6rem)] md:max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar z-30"
        style={{
          pointerEvents: isMobile ? (isSidebarOpen ? "auto" : "none") : "auto",
        }}
      >
        {/* Main Card - White style like DataFast */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 flex flex-col gap-1.5 md:gap-2.5 p-3 md:p-4 hover:shadow-2xl hover:shadow-black/15 transition-shadow duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center">
                <Image
                  src="/MapPinPurple.svg"
                  alt="Eat Around The Globe"
                  width={28}
                  height={28}
                />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-bold text-gray-900">
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
                className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                  autoRotate
                    ? "bg-linear-to-br from-fuchsia-300 to-fuchsia-500 text-white shadow-md shadow-fuchsia-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          <div className="flex items-baseline gap-1 ml-2 text-xs md:text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-linear-to-br from-emerald-300 to-emerald-500 rounded-full shadow-sm shadow-emerald-600/20"></div>
              <span className="text-sm md:text-lg font-bold text-gray-900">
                {filteredFoods.length}
              </span>
            </div>
            <span className="text-gray-600 text-[10px] md:text-sm">
              places added by
            </span>
            <span className="text-xs md:text-base font-bold text-gray-900">
              {uniqueUsers}
            </span>
            <span className="text-gray-600 text-[10px] md:text-sm">users</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Top Recommenders */}
          {recommenders.length > 0 && (
            <div>
              <h3 className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                Top Recommenders
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {recommenders.map((rec) => (
                  <div
                    key={rec.walletAddress}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10 transition-shadow duration-200"
                  >
                    {rec.profilePicture ? (
                      <div className="w-5 h-5 rounded-md overflow-hidden shadow-sm shadow-black/10">
                        <Image
                          src={rec.profilePicture}
                          alt={rec.displayName}
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                        <span className="text-white text-[9px] font-bold">
                          {rec.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-900">
                      {rec.displayName}
                    </span>
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
            <h3 className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
              Top Countries
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((c) => (
                <div
                  key={c.countryCode}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/10 transition-shadow duration-200"
                >
                  <span className="text-base">
                    {getFlagEmoji(c.countryCode)}
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {c.country}
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    ({c.count})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filters */}
          <div>
            <h3 className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
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
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] md:text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? "bg-linear-to-br from-orange-400 to-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/25"
                        : "bg-white text-gray-700 border-gray-200 shadow-sm shadow-black/5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:shadow-black/10"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Filters */}
          <div>
            <h3 className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
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
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] md:text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? "bg-linear-to-br from-green-400 to-green-600 text-white border-green-500 shadow-md shadow-green-600/25"
                        : "bg-white text-gray-700 border-gray-200 shadow-sm shadow-black/5 hover:border-green-300 hover:bg-green-50 hover:shadow-md hover:shadow-black/10"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{diet.label}</span>
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
    </>
  );
}
