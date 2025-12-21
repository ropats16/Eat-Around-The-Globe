import { LucideIcon } from "lucide-react";
import {
  Utensils,
  Award,
  UtensilsCrossed,
  Zap,
  Coffee,
  Croissant,
  IceCream,
  Wine,
  Egg,
  Store,
  Leaf,
  Sprout,
  CheckCircle,
  WheatOff,
  MilkOff,
  NutOff,
  Fish,
  Flame,
  TrendingDown,
} from "lucide-react";
import { FoodCategory, DietaryTag } from "./types";

export interface CategoryConfig {
  value: FoodCategory;
  label: string;
  color: string; // Hex color for marker
  bgColor: string; // Tailwind class for badges
  textColor: string; // Tailwind class for badges
  borderColor: string; // Tailwind class for badges
  shadowColor: string; // Tailwind class for shadow
  icon: LucideIcon;
}

export interface DietaryConfig {
  value: DietaryTag;
  label: string; // Display as-is (not "X-Friendly")
  color: string; // Hex color
  bgColor: string; // Tailwind class
  textColor: string; // Tailwind class
  borderColor: string; // Tailwind class
  shadowColor: string; // Tailwind shadow class
  icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<FoodCategory, CategoryConfig> = {
  "street-food": {
    value: "street-food",
    label: "Street Food",
    color: "#FF8804",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    shadowColor: "shadow-orange-500/30",
    icon: Utensils,
  },
  "fine-dining": {
    value: "fine-dining",
    label: "Fine Dining",
    color: "#990FFA",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    shadowColor: "shadow-purple-500/30",
    icon: Award,
  },
  "casual-dining": {
    value: "casual-dining",
    label: "Casual Dining",
    color: "#00D5BE",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200",
    shadowColor: "shadow-teal-500/30",
    icon: UtensilsCrossed,
  },
  traditional: {
    value: "traditional",
    label: "Traditional",
    color: "#009866",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    shadowColor: "shadow-emerald-500/30",
    icon: UtensilsCrossed,
  },
  "fast-food": {
    value: "fast-food",
    label: "Fast Food",
    color: "#ef4444",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    shadowColor: "shadow-red-500/30",
    icon: Zap,
  },
  cafe: {
    value: "cafe",
    label: "Cafe & Coffee",
    color: "#92400e",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    shadowColor: "shadow-amber-700/30",
    icon: Coffee,
  },
  bakery: {
    value: "bakery",
    label: "Bakery & Pastries",
    color: "#FFD230",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    shadowColor: "shadow-amber-600/30",
    icon: Croissant,
  },
  dessert: {
    value: "dessert",
    label: "Dessert & Sweets",
    color: "#ec4899",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
    borderColor: "border-pink-200",
    shadowColor: "shadow-pink-500/30",
    icon: IceCream,
  },
  bar: {
    value: "bar",
    label: "Bar & Drinks",
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    shadowColor: "shadow-blue-500/30",
    icon: Wine,
  },
  breakfast: {
    value: "breakfast",
    label: "Breakfast & Brunch",
    color: "#fbbf24",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    shadowColor: "shadow-yellow-500/30",
    icon: Egg,
  },
  market: {
    value: "market",
    label: "Food Market/Hall",
    color: "#8b5cf6",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    shadowColor: "shadow-violet-500/30",
    icon: Store,
  },
};

export const DIETARY_CONFIG: Record<DietaryTag, DietaryConfig> = {
  vegetarian: {
    value: "vegetarian",
    label: "Vegetarian",
    color: "#22c55e",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    shadowColor: "shadow-green-500/20",
    icon: Leaf,
  },
  vegan: {
    value: "vegan",
    label: "Vegan",
    color: "#15803d",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    shadowColor: "shadow-emerald-500/20",
    icon: Sprout,
  },
  halal: {
    value: "halal",
    label: "Halal",
    color: "#14b8a6",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200",
    shadowColor: "shadow-teal-500/20",
    icon: CheckCircle,
  },
  kosher: {
    value: "kosher",
    label: "Kosher",
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    shadowColor: "shadow-blue-500/20",
    icon: CheckCircle,
  },
  "gluten-free": {
    value: "gluten-free",
    label: "Gluten-Free",
    color: "#f59e0b",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    shadowColor: "shadow-amber-500/20",
    icon: WheatOff,
  },
  "dairy-free": {
    value: "dairy-free",
    label: "Dairy-Free",
    color: "#0ea5e9",
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
    shadowColor: "shadow-sky-500/20",
    icon: MilkOff,
  },
  "nut-free": {
    value: "nut-free",
    label: "Nut-Free",
    color: "#f97316",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    shadowColor: "shadow-orange-500/20",
    icon: NutOff,
  },
  pescatarian: {
    value: "pescatarian",
    label: "Pescatarian",
    color: "#06b6d4",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
    shadowColor: "shadow-cyan-500/20",
    icon: Fish,
  },
  organic: {
    value: "organic",
    label: "Organic",
    color: "#16a34a",
    bgColor: "bg-lime-50",
    textColor: "text-lime-700",
    borderColor: "border-lime-200",
    shadowColor: "shadow-lime-500/20",
    icon: Sprout,
  },
  keto: {
    value: "keto",
    label: "Keto",
    color: "#9333ea",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    shadowColor: "shadow-purple-500/20",
    icon: Flame,
  },
  "low-carb": {
    value: "low-carb",
    label: "Low-Carb",
    color: "#6366f1",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    shadowColor: "shadow-indigo-500/20",
    icon: TrendingDown,
  },
};

// Helper functions
export const getCategoryConfig = (category: FoodCategory): CategoryConfig => {
  return CATEGORY_CONFIG[category];
};

export const getDietaryConfig = (dietary: DietaryTag): DietaryConfig => {
  return DIETARY_CONFIG[dietary];
};

// Array versions for dropdowns/selections
export const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] =
  Object.values(CATEGORY_CONFIG).map((config) => ({
    value: config.value,
    label: config.label,
  }));

export const DIETARY_OPTIONS: { value: DietaryTag; label: string }[] =
  Object.values(DIETARY_CONFIG).map((config) => ({
    value: config.value,
    label: config.label,
  }));
