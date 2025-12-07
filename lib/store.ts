import { create } from "zustand";
import { FoodPlace, Filters, Continent, FoodCategory, DietaryTag, Recommender } from "./types";

interface FoodGlobeStore {
  // Data
  foods: FoodPlace[];
  selectedFood: FoodPlace | null;
  isDetailPanelOpen: boolean;
  previewPlace: { lat: number; lng: number; name: string } | null; // Temporary pin for search results

  // Filters
  filters: Filters;

  // Loading states
  isLoadingPlaces: boolean;
  isAddingPlace: boolean;

  // Globe controls
  autoRotate: boolean;
  globeCenter: { lat: number; lng: number } | null;

  // Actions
  setFoods: (foods: FoodPlace[]) => void;
  addFood: (food: Omit<FoodPlace, 'recommenders'>, recommender: Recommender) => void;
  selectFood: (food: FoodPlace | null) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setIsLoadingPlaces: (loading: boolean) => void;
  setIsAddingPlace: (adding: boolean) => void;
  toggleAutoRotate: () => void;
  centerGlobe: (lat: number, lng: number) => void;
  getFilteredFoods: () => FoodPlace[];
  setPreviewPlace: (place: { lat: number; lng: number; name: string } | null) => void;
}

const initialFilters: Filters = {
  continent: "all",
  categories: [],
  dietaryInfo: [],
  priceRange: [1, 2, 3],
  searchQuery: "",
};

export const useFoodGlobeStore = create<FoodGlobeStore>((set, get) => ({
  // Initial state
  foods: [],
  selectedFood: null,
  isDetailPanelOpen: false,
  previewPlace: null,
  filters: initialFilters,
  isLoadingPlaces: false,
  isAddingPlace: false,
  autoRotate: true,
  globeCenter: null,

  // Actions
  setFoods: (foods) => set({ foods }),

  addFood: (food, recommender) => set((state) => {
    // Check for duplicate by placeId
    const existingIndex = state.foods.findIndex(f => f.placeId && f.placeId === food.placeId);

    if (existingIndex !== -1) {
      // Place exists - add recommender to existing place
      const updatedFoods = [...state.foods];
      updatedFoods[existingIndex] = {
        ...updatedFoods[existingIndex],
        recommenders: [...updatedFoods[existingIndex].recommenders, recommender]
      };
      return { foods: updatedFoods };
    }

    // New place - create with recommenders array
    const newPlace: FoodPlace = {
      ...food,
      recommenders: [recommender]
    };

    return { foods: [...state.foods, newPlace] };
  }),

  selectFood: (food) => set({
    selectedFood: food,
    isDetailPanelOpen: food !== null,
  }),

  openDetailPanel: () => set({ isDetailPanelOpen: true }),

  closeDetailPanel: () => set({
    isDetailPanelOpen: false,
    selectedFood: null,
  }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  resetFilters: () => set({ filters: initialFilters }),

  setIsLoadingPlaces: (loading) => set({ isLoadingPlaces: loading }),

  setIsAddingPlace: (adding) => set({ isAddingPlace: adding }),

  toggleAutoRotate: () => set((state) => ({
    autoRotate: !state.autoRotate
  })),

  centerGlobe: (lat, lng) => set({
    globeCenter: { lat, lng },
    autoRotate: false,
  }),

  setPreviewPlace: (place) => set({ previewPlace: place }),

  getFilteredFoods: () => {
    const { foods, filters } = get();

    return foods.filter((food) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          food.name.toLowerCase().includes(query) ||
          food.country.toLowerCase().includes(query) ||
          food.city.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query) ||
          food.tags.some(tag => tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Continent filter
      if (filters.continent !== "all") {
        // This would require a mapping of countries to continents
        // For now, we'll skip this check
      }

      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(food.category)) return false;
      }

      // Dietary info filter
      if (filters.dietaryInfo.length > 0) {
        const hasMatchingDiet = filters.dietaryInfo.some(diet =>
          food.dietaryInfo.includes(diet)
        );
        if (!hasMatchingDiet) return false;
      }

      // Price range filter
      if (!filters.priceRange.includes(food.priceRange)) return false;

      return true;
    });
  },
}));
