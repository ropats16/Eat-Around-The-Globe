export interface Recommender {
  name: string;
  profilePicture?: string;
  caption?: string;
  category?: FoodCategory;
  dietaryInfo?: DietaryTag[];
}

export interface FoodPlace {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  coordinates: [number, number]; // [lat, lng]
  category: FoodCategory;
  description: string;
  shortDescription: string;
  images: string[];
  dietaryInfo: DietaryTag[];
  priceRange: 1 | 2 | 3;
  funFacts?: string[];
  externalLinks?: {
    recipe?: string;
    restaurant?: string;
    wiki?: string;
  };
  popularity: number;
  dateAdded: string;
  tags: string[];
  placeId?: string; // Google Places ID
  rating?: number;
  address?: string;
  phone?: string; // Phone number
  openingHours?: string[]; // Opening hours text
  isOpenNow?: boolean; // Currently open status
  totalReviews?: number; // Total number of reviews
  recommender?: Recommender; // Person who recommended this place
}

export type FoodCategory =
  | "street-food"
  | "fine-dining"
  | "traditional"
  | "dessert"
  | "drink"
  | "seafood"
  | "vegetarian"
  | "fast-food"
  | "bakery";

export type DietaryTag =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "halal"
  | "kosher"
  | "dairy-free"
  | "nut-free";

export type Continent =
  | "all"
  | "asia"
  | "europe"
  | "africa"
  | "north-america"
  | "south-america"
  | "oceania";

export interface Filters {
  continent: Continent;
  categories: FoodCategory[];
  dietaryInfo: DietaryTag[];
  priceRange: number[];
  searchQuery: string;
}

export interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
  foodId: string;
}
