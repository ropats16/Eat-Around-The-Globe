import { create } from "zustand";
import { FoodPlace, Filters, Recommender } from "./types";
import { WalletType, ProfileData } from "./wallet-types";

interface FoodGlobeStore {
  // Data
  foods: FoodPlace[];
  selectedFood: FoodPlace | null;
  isDetailPanelOpen: boolean;
  previewPlace: { lat: number; lng: number; name: string } | null; // Temporary pin for search results

  // === WALLET STATE ===
  walletType: WalletType;
  walletAddress: string | null;
  walletProvider: unknown | null; // Provider for ETH/SOL (from AppKit)
  isConnecting: boolean;
  isWalletModalOpen: boolean;

  // === USER INTERACTIONS (cached from Arweave) ===
  userLikes: Record<string, boolean>; // placeId → liked by current user
  likeCounts: Record<string, number>; // placeId → total likes from all users
  pendingUploads: Set<string>; // placeIds currently being uploaded
  isLoadingInteractions: boolean;

  // === USER PROFILE ===
  userProfile: ProfileData | null;
  isLoadingProfile: boolean;
  isProfileModalOpen: boolean;

  // Filters
  filters: Filters;

  // Loading states
  isLoadingPlaces: boolean;
  isAddingPlace: boolean;

  // Globe controls
  autoRotate: boolean;
  globeCenter: { lat: number; lng: number } | null;

  // UI state
  isSidebarOpen: boolean;

  // Actions
  setFoods: (foods: FoodPlace[]) => void;
  addFood: (
    food: Omit<FoodPlace, "recommenders">,
    recommender: Recommender
  ) => void;
  selectFood: (food: FoodPlace | null) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setIsLoadingPlaces: (loading: boolean) => void;
  setIsAddingPlace: (adding: boolean) => void;
  toggleAutoRotate: () => void;
  centerGlobe: (lat: number, lng: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  getFilteredFoods: () => FoodPlace[];
  setPreviewPlace: (
    place: { lat: number; lng: number; name: string } | null
  ) => void;

  // === WALLET ACTIONS ===
  setWallet: (type: WalletType, address: string, provider?: unknown) => void;
  disconnectWallet: () => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  setIsConnecting: (connecting: boolean) => void;

  // === INTERACTION ACTIONS ===
  setUserLikes: (likes: Record<string, boolean>) => void;
  setLikeCounts: (counts: Record<string, number>) => void;
  toggleLike: (placeId: string) => void; // Optimistic update
  addPendingUpload: (placeId: string) => void;
  removePendingUpload: (placeId: string) => void;
  setIsLoadingInteractions: (loading: boolean) => void;

  // === PROFILE ACTIONS ===
  setUserProfile: (profile: ProfileData | null) => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  setIsLoadingProfile: (loading: boolean) => void;

  // === HELPER ===
  isPlaceLiked: (placeId: string) => boolean;
  getLikeCount: (placeId: string) => number;
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
  isSidebarOpen: false, // Closed by default on mobile

  // Wallet state
  walletType: null,
  walletAddress: null,
  walletProvider: null,
  isConnecting: false,
  isWalletModalOpen: false,

  // Interaction state
  userLikes: {},
  likeCounts: {},
  pendingUploads: new Set<string>(),
  isLoadingInteractions: false,

  // Profile state
  userProfile: null,
  isLoadingProfile: false,
  isProfileModalOpen: false,

  // Actions
  setFoods: (foods) => set({ foods }),

  addFood: (food, recommender) =>
    set((state) => {
      // Check for duplicate by placeId (if exists)
      if (food.placeId) {
        const existingIndex = state.foods.findIndex(
          (f) => f.placeId === food.placeId
        );

        if (existingIndex !== -1) {
          // Place exists - add recommender to existing place
          const updatedFoods = [...state.foods];
          updatedFoods[existingIndex] = {
            ...updatedFoods[existingIndex],
            recommenders: [
              ...updatedFoods[existingIndex].recommenders,
              recommender,
            ],
          };
          return { foods: updatedFoods };
        }
      }

      // Also check for duplicate by id (safety check)
      const existingById = state.foods.findIndex((f) => f.id === food.id);
      if (existingById !== -1) {
        console.warn("⚠️ Duplicate food ID detected, skipping add:", food.id);
        return state; // Don't add duplicate
      }

      // New place - create with recommenders array
      // Ensure ID is never empty
      const newPlace: FoodPlace = {
        ...food,
        id:
          food.id ||
          `food-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        recommenders: [recommender],
      };

      return { foods: [...state.foods, newPlace] };
    }),

  selectFood: (food) =>
    set({
      selectedFood: food,
      isDetailPanelOpen: food !== null,
    }),

  openDetailPanel: () => set({ isDetailPanelOpen: true }),

  closeDetailPanel: () =>
    set({
      isDetailPanelOpen: false,
      selectedFood: null,
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  setIsLoadingPlaces: (loading) => set({ isLoadingPlaces: loading }),

  setIsAddingPlace: (adding) => set({ isAddingPlace: adding }),

  toggleAutoRotate: () =>
    set((state) => ({
      autoRotate: !state.autoRotate,
    })),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  centerGlobe: (lat, lng) =>
    set({
      globeCenter: { lat, lng },
      autoRotate: false,
    }),

  setPreviewPlace: (place) => set({ previewPlace: place }),

  getFilteredFoods: () => {
    const { foods, filters } = get();

    // console.log("🔍 FILTERING: Total foods:", foods.length);
    // console.log("🔍 FILTERING: Active filters:", filters);

    const filtered = foods.filter((food) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          food.name.toLowerCase().includes(query) ||
          food.country.toLowerCase().includes(query) ||
          food.city.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query) ||
          food.tags.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesSearch) {
          console.log(`❌ ${food.name} filtered out by search query`);
          return false;
        }
      }

      // Continent filter
      if (filters.continent !== "all") {
        // This would require a mapping of countries to continents
        // For now, we'll skip this check
      }

      // Category filter
      if (filters.categories.length > 0) {
        console.log(
          `🔍 Checking ${food.name}: category="${food.category}", filters=${filters.categories}`
        );
        if (!filters.categories.includes(food.category)) {
          console.log(
            `❌ ${food.name} filtered out by category (has: ${food.category}, need: ${filters.categories})`
          );
          return false;
        }
      }

      // Dietary info filter
      if (filters.dietaryInfo.length > 0) {
        console.log(
          `🔍 Checking ${food.name}: dietaryInfo=${JSON.stringify(
            food.dietaryInfo
          )}, filters=${JSON.stringify(filters.dietaryInfo)}`
        );
        const hasMatchingDiet = filters.dietaryInfo.some((diet) =>
          food.dietaryInfo.includes(diet)
        );
        if (!hasMatchingDiet) {
          console.log(
            `❌ ${food.name} filtered out by dietary (has: ${JSON.stringify(
              food.dietaryInfo
            )}, need: ${JSON.stringify(filters.dietaryInfo)})`
          );
          return false;
        }
      }

      // Price range filter
      if (!filters.priceRange.includes(food.priceRange)) {
        console.log(`❌ ${food.name} filtered out by price range`);
        return false;
      }

      console.log(`✅ ${food.name} passed all filters`);
      return true;
    });

    console.log("🔍 FILTERING: Filtered foods:", filtered.length);
    return filtered;
  },

  // === WALLET ACTIONS ===
  setWallet: (type, address, provider) =>
    set({
      walletType: type,
      walletAddress: address,
      walletProvider: provider ?? null,
      isConnecting: false,
      isWalletModalOpen: false,
    }),

  disconnectWallet: () =>
    set({
      walletType: null,
      walletAddress: null,
      walletProvider: null,
      userLikes: {}, // Clear user-specific data
      pendingUploads: new Set<string>(),
      userProfile: null, // Clear profile on disconnect
    }),

  openWalletModal: () => set({ isWalletModalOpen: true }),

  closeWalletModal: () => set({ isWalletModalOpen: false }),

  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  // === INTERACTION ACTIONS ===
  setUserLikes: (likes) => set({ userLikes: likes }),

  setLikeCounts: (counts) => set({ likeCounts: counts }),

  toggleLike: (placeId) =>
    set((state) => {
      const currentlyLiked = state.userLikes[placeId] ?? false;
      const newLikedState = !currentlyLiked;

      // Optimistic update for user's like state
      const newUserLikes = {
        ...state.userLikes,
        [placeId]: newLikedState,
      };

      // Optimistic update for like count
      const currentCount = state.likeCounts[placeId] ?? 0;
      const newLikeCounts = {
        ...state.likeCounts,
        [placeId]: newLikedState
          ? currentCount + 1
          : Math.max(0, currentCount - 1),
      };

      return {
        userLikes: newUserLikes,
        likeCounts: newLikeCounts,
      };
    }),

  addPendingUpload: (placeId) =>
    set((state) => ({
      pendingUploads: new Set([...state.pendingUploads, placeId]),
    })),

  removePendingUpload: (placeId) =>
    set((state) => {
      const newPending = new Set(state.pendingUploads);
      newPending.delete(placeId);
      return { pendingUploads: newPending };
    }),

  setIsLoadingInteractions: (loading) =>
    set({ isLoadingInteractions: loading }),

  // === PROFILE ACTIONS ===
  setUserProfile: (profile) => set({ userProfile: profile }),

  openProfileModal: () => set({ isProfileModalOpen: true }),

  closeProfileModal: () => set({ isProfileModalOpen: false }),

  setIsLoadingProfile: (loading) => set({ isLoadingProfile: loading }),

  // === HELPERS ===
  isPlaceLiked: (placeId) => {
    const { userLikes } = get();
    return userLikes[placeId] ?? false;
  },

  getLikeCount: (placeId) => {
    const { likeCounts } = get();
    return likeCounts[placeId] ?? 0;
  },
}));
