"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Globe from "@/components/Globe";
import Sidebar from "@/components/Sidebar";
import ActivityFeed from "@/components/ActivityFeed";
import SearchBar from "@/components/SearchBar";
import DetailPanel from "@/components/DetailPanel";
import LoadingScreen from "@/components/LoadingScreen";
import {
  initGoogleMaps,
  getPlaceDetails,
  convertGooglePlaceToFoodPlace,
} from "@/lib/google-places";
import { getAllRecommendations } from "@/lib/arweave-query";
import { useFoodGlobeStore } from "@/lib/store";
import type { FoodCategory } from "@/lib/types";
import WalletButton from "@/components/WalletButton";
import WalletModal from "@/components/WalletModal";
import ProfileSetupModal from "@/components/ProfileSetupModal";
import HamburgerMenu from "@/components/HamburgerMenu";
import { fetchUserProfile } from "@/lib/arweave";
import { useWalletAccountListener } from "@/hooks/useWalletAccountListener";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [mapboxAvailable, setMapboxAvailable] = useState(false);
  const addFood = useFoodGlobeStore((state) => state.addFood);
  const walletAddress = useFoodGlobeStore((state) => state.walletAddress);
  const setUserProfile = useFoodGlobeStore((state) => state.setUserProfile);
  const setIsLoadingProfile = useFoodGlobeStore(
    (state) => state.setIsLoadingProfile
  );

  useEffect(() => {
    const init = async () => {
      try {
        // Check for Mapbox token
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        setMapboxAvailable(!!mapboxToken);

        // Initialize Google Maps
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          await initGoogleMaps(apiKey);
          setMapsInitialized(true);

          // Fetch recommendations from Arweave and hydrate with Google Places data
          await loadRecommendationsFromArweave();
        }
      } catch {
        // Initialization error - continue with degraded functionality
      } finally {
        // Add a small delay to show the loading animation
        setTimeout(() => setIsLoading(false), 1500);
      }
    };

    const loadRecommendationsFromArweave = async () => {
      try {
        const allRecommendations = await getAllRecommendations(50);

        // Test wallet addresses - only apply date cutoff to these
        const TEST_WALLETS = [
          process.env.NEXT_PUBLIC_TEST_WALLET_ETHEREUM?.toLowerCase(),
          process.env.NEXT_PUBLIC_TEST_WALLET_SOLANA?.toLowerCase(),
        ].filter(Boolean);

        // Filter out test wallet recommendations before December 22, 2025
        const CUTOFF_DATE = new Date("2025-12-22T00:00:00Z");
        const recommendations = allRecommendations.filter((rec) => {
          // Always include recommendations without a timestamp
          if (!rec.timestamp) return true;

          // Check if this is from a test wallet
          const isTestWallet = TEST_WALLETS.includes(rec.author?.toLowerCase());

          // Only apply date filter to test wallets
          if (isTestWallet) {
            const recDate = new Date(rec.timestamp);
            return recDate >= CUTOFF_DATE;
          }

          // Keep all other users' recommendations
          return true;
        });

        if (recommendations.length === 0) {
          return;
        }

        // Group recommendations by placeId to avoid duplicate API calls
        const byPlaceId = new Map<string, typeof recommendations>();
        for (const rec of recommendations) {
          if (!rec.placeId) continue;
          const existing = byPlaceId.get(rec.placeId) || [];
          existing.push(rec);
          byPlaceId.set(rec.placeId, existing);
        }

        // Fetch Google Places details for each unique placeId
        for (const [placeId, recs] of byPlaceId) {
          try {
            const placeDetails = await getPlaceDetails(placeId);

            // Use the first recommendation's data for category/dietary
            const firstRec = recs[0];
            const foodPlace = convertGooglePlaceToFoodPlace(
              placeDetails,
              (firstRec.data.category as FoodCategory) || "traditional",
              firstRec.data.dietaryTags as (
                | "vegan"
                | "vegetarian"
                | "gluten-free"
                | "halal"
                | "kosher"
                | "dairy-free"
                | "nut-free"
              )[]
            );

            // Add each recommender
            for (const rec of recs) {
              addFood(foodPlace, {
                name:
                  rec.recommenderName ||
                  `${rec.author.slice(0, 6)}...${rec.author.slice(-4)}`,
                walletAddress: rec.author,
                caption: rec.data.caption || undefined,
                category: (rec.data.category as FoodCategory) || undefined,
                dietaryInfo: rec.data.dietaryTags as
                  | (
                      | "vegan"
                      | "vegetarian"
                      | "gluten-free"
                      | "halal"
                      | "kosher"
                      | "dairy-free"
                      | "nut-free"
                    )[]
                  | undefined,
                dateRecommended: rec.timestamp,
              });
            }
          } catch {
            // Skip places that fail to load
          }
        }
      } catch {
        // Silently handle load failures
      }
    };

    init();
  }, [addFood]);

  // Background profile fetch when wallet connects
  useEffect(() => {
    const loadProfile = async () => {
      if (!walletAddress) {
        // Wallet disconnected - profile already cleared in store
        return;
      }

      setIsLoadingProfile(true);

      try {
        const profile = await fetchUserProfile(walletAddress);
        setUserProfile(profile);
      } catch {
        setUserProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [walletAddress, setUserProfile, setIsLoadingProfile]);

  useWalletAccountListener();

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      {!isLoading && (
        <div className="relative w-full h-dvh overflow-hidden bg-[#0a0a0a]">
          {/* Main Globe - Full Screen Background */}
          <div className="absolute inset-0">
            <Globe />
          </div>

          {/* UI Components */}
          <Sidebar />
          <ActivityFeed />

          {/* Top Row - Hamburger, SearchBar, WalletButton */}
          <div className="absolute top-4 left-4 right-4 md:top-6 md:left-auto md:right-12 md:w-96 z-40 pointer-events-auto">
            {/* Mobile: Horizontal layout */}
            <div className="flex md:hidden items-center gap-2">
              <div className="shrink-0">
                <HamburgerMenu />
              </div>
              <div className="flex-1 min-w-0">
                <SearchBar />
              </div>
              <div className="shrink-0">
                <WalletButton />
              </div>
            </div>

            {/* Desktop: Vertical stacking */}
            <div className="hidden md:flex md:flex-col md:gap-4">
              <WalletButton />
              <SearchBar />
            </div>
          </div>

          <DetailPanel />
          <WalletModal />
          <ProfileSetupModal />

          {/* Warnings */}
          {(!mapsInitialized || !mapboxAvailable) && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 max-w-md mx-4 pointer-events-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-700 font-semibold mb-2">
                  ⚠️ Configuration Required
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  {!mapboxAvailable && (
                    <p>
                      • Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for globe
                    </p>
                  )}
                  {!mapsInitialized && (
                    <p>
                      • Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local for
                      search
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
