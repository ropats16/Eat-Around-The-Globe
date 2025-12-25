// lib/analytics.ts
// DataFast analytics tracking utility
// Docs: https://datafa.st/docs/custom-goals

declare global {
  interface Window {
    datafast?: (
      goalName: string,
      params?: Record<string, string | number>
    ) => void;
  }
}

/**
 * Track a custom goal/event with DataFast
 * @param goalName - lowercase, max 64 chars, only letters/numbers/underscores/hyphens
 * @param params - optional custom parameters (max 10, values max 255 chars)
 */
export function trackGoal(
  goalName: string,
  params?: Record<string, string | number>
): void {
  if (typeof window !== "undefined" && window.datafast) {
    // Convert all param values to strings (DataFast requirement)
    const stringParams = params
      ? Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        )
      : undefined;

    window.datafast(goalName, stringParams);
  }
}

// ============================================
// WALLET EVENTS
// ============================================

/** Track wallet connection */
export function trackWalletConnect(
  walletType: "ethereum" | "solana" | "arweave",
  address: string
): void {
  trackGoal("wallet_connect", {
    wallet_type: walletType,
    address_prefix: address.slice(0, 8),
  });
}

/** Track wallet disconnection */
export function trackWalletDisconnect(
  walletType: "ethereum" | "solana" | "arweave"
): void {
  trackGoal("wallet_disconnect", {
    wallet_type: walletType,
  });
}

// ============================================
// PROFILE EVENTS
// ============================================

/** Track profile creation */
export function trackProfileCreate(username: string): void {
  trackGoal("profile_create", {
    username_length: username.length,
  });
}

// ============================================
// RECOMMENDATION EVENTS
// ============================================

/** Track recommendation submission */
export function trackRecommendationSubmit(
  placeId: string,
  placeName: string,
  category: string,
  country: string
): void {
  trackGoal("recommendation_submit", {
    place_id: placeId,
    place_name: placeName.slice(0, 50),
    category,
    country,
  });
}

/** Track place details view */
export function trackPlaceView(
  placeId: string,
  placeName: string,
  source: "globe" | "search" | "feed"
): void {
  trackGoal("place_view", {
    place_id: placeId,
    place_name: placeName.slice(0, 50),
    source,
  });
}

// ============================================
// SEARCH EVENTS
// ============================================

/** Track place search */
export function trackPlaceSearch(query: string, resultsCount: number): void {
  trackGoal("place_search", {
    query_length: query.length,
    results_count: resultsCount,
  });
}

/** Track search result selection */
export function trackSearchSelect(
  placeName: string,
  resultIndex: number
): void {
  trackGoal("search_select", {
    place_name: placeName.slice(0, 50),
    result_index: resultIndex,
  });
}

// ============================================
// ENGAGEMENT EVENTS
// ============================================

/** Track place like */
export function trackPlaceLike(placeId: string, placeName: string): void {
  trackGoal("place_like", {
    place_id: placeId,
    place_name: placeName.slice(0, 50),
  });
}

/** Track place unlike */
export function trackPlaceUnlike(placeId: string): void {
  trackGoal("place_unlike", {
    place_id: placeId,
  });
}

// ============================================
// UI/NAVIGATION EVENTS
// ============================================

/** Track sidebar toggle */
export function trackSidebarToggle(isOpen: boolean): void {
  trackGoal("sidebar_toggle", {
    action: isOpen ? "open" : "close",
  });
}

/** Track filter change */
export function trackFilterChange(
  filterType: "category" | "dietary" | "price" | "continent",
  value: string
): void {
  trackGoal("filter_change", {
    filter_type: filterType,
    value: value.slice(0, 50),
  });
}

/** Track globe marker click */
export function trackMarkerClick(placeName: string, country: string): void {
  trackGoal("marker_click", {
    place_name: placeName.slice(0, 50),
    country,
  });
}
