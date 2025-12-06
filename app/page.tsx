"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Globe from "@/components/Globe";
import Sidebar from "@/components/Sidebar";
import ActivityFeed from "@/components/ActivityFeed";
import SearchBar from "@/components/SearchBar";
import DetailPanel from "@/components/DetailPanel";
import LoadingScreen from "@/components/LoadingScreen";
import { initGoogleMaps } from "@/lib/google-places";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [mapboxAvailable, setMapboxAvailable] = useState(false);

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
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        // Add a small delay to show the loading animation
        setTimeout(() => setIsLoading(false), 1500);
      }
    };

    init();
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      {!isLoading && (
        <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
          {/* Main Globe - Full Screen Background */}
          <div className="absolute inset-0">
            <Globe />
          </div>

          {/* Three Column Layout with Margins */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full mx-4 md:mx-8 lg:mx-12 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Left Third - Info Boxes */}
              <div className="hidden lg:flex flex-col gap-4 py-6 pointer-events-auto">
                <Sidebar />
                <ActivityFeed />
              </div>

              {/* Middle Third - Globe (no overlay, just for spacing) */}
              <div className="hidden lg:block" />

              {/* Right Third - Search & Details */}
              <div className="flex flex-col gap-4 py-6 pointer-events-auto">
                <SearchBar />
                <DetailPanel />
              </div>
            </div>
          </div>

          {/* Mobile: Show components in original positions */}
          <div className="lg:hidden">
            <SearchBar />
            <Sidebar />
            <ActivityFeed />
            <DetailPanel />
          </div>

          {/* Warnings */}
          {(!mapsInitialized || !mapboxAvailable) && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 max-w-md mx-4 pointer-events-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-700 font-semibold mb-2">
                  ⚠️ Configuration Required
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  {!mapboxAvailable && (
                    <p>• Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local for globe</p>
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
