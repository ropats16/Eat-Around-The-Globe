"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useFoodGlobeStore } from "@/lib/store";

const CATEGORY_COLORS: Record<string, string> = {
  "street-food": "#f59e0b",
  "fine-dining": "#8b5cf6",
  traditional: "#10b981",
  dessert: "#ec4899",
  drink: "#3b82f6",
  seafood: "#06b6d4",
  vegetarian: "#84cc16",
  "fast-food": "#ef4444",
  bakery: "#f97316",
};

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const previewMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const { getFilteredFoods, selectFood, foods, globeCenter, previewPlace } =
    useFoodGlobeStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      projection: { name: "globe" },
      center: [0, 20],
      zoom: 2.5,
      pitch: 0,
      maxZoom: 18,
      minZoom: 1,
    });

    // Add atmosphere styling
    map.current.on("style.load", () => {
      if (map.current) {
        map.current.setFog({
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.02,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        });
      }
    });

    // Enable rotation
    const secondsPerRevolution = 120;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    let userInteracting = false;
    const spinEnabled = true;

    function spinGlobe() {
      if (!map.current || !spinEnabled || userInteracting) return;
      const zoom = map.current.getZoom();
      if (zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    const handleMouseDown = () => {
      userInteracting = true;
    };
    const handleDragStart = () => {
      userInteracting = true;
    };
    const handleMoveEnd = () => {
      spinGlobe();
    };

    map.current.on("mousedown", handleMouseDown);
    map.current.on("dragstart", handleDragStart);
    map.current.on("moveend", handleMoveEnd);

    spinGlobe();

    return () => {
      if (map.current) {
        map.current.off("mousedown", handleMouseDown);
        map.current.off("dragstart", handleDragStart);
        map.current.off("moveend", handleMoveEnd);
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when foods change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const filteredFoods = getFilteredFoods();

    filteredFoods.forEach((food) => {
      if (!map.current) return;

      // Create marker element using MapPin SVG
      const el = document.createElement("div");
      el.className = "food-marker";
      el.style.cssText = `
        width: 40px;
        height: 40px;
        cursor: pointer;
        transition: transform 0.2s;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
      `;

      // Add SVG with category color
      const color = CATEGORY_COLORS[food.category] || "#D05CE4";
      el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_530_15)">
            <path d="M160 20C189.164 20.0331 217.123 31.6331 237.745 52.2549C258.367 72.8767 269.967 100.836 270 130C270 224.125 170 295.212 165.737 298.188C164.056 299.365 162.053 299.997 160 299.997C157.947 299.997 155.944 299.365 154.263 298.188C150 295.212 50 224.125 50 130C50.0331 100.836 61.633 72.8767 82.2549 52.2549C102.877 31.6331 130.836 20.0331 160 20ZM160.456 68.7354C158.717 68.7354 157.017 69.2531 155.572 70.2217C154.128 71.1902 153.004 72.5661 152.344 74.1748L140.144 103.699L108.519 106.251C106.792 106.403 105.148 107.061 103.792 108.142C102.436 109.222 101.428 110.678 100.896 112.328C100.363 113.978 100.328 115.748 100.795 117.417C101.262 119.087 102.211 120.582 103.522 121.716L127.644 142.529L120.268 173.656C119.865 175.344 119.972 177.113 120.572 178.74C121.173 180.368 122.241 181.782 123.644 182.803C125.046 183.824 126.72 184.407 128.453 184.479C130.186 184.552 131.902 184.109 133.385 183.208L160.47 166.549L187.539 183.208C189.022 184.114 190.74 184.561 192.477 184.491C194.213 184.421 195.89 183.838 197.295 182.816C198.7 181.794 199.771 180.378 200.372 178.748C200.973 177.118 201.077 175.346 200.672 173.656L193.323 142.529L217.444 121.716L217.412 121.721C218.726 120.586 219.676 119.088 220.144 117.416C220.611 115.743 220.573 113.97 220.037 112.318C219.501 110.667 218.489 109.21 217.129 108.131C215.768 107.052 214.12 106.397 212.39 106.251L180.764 103.699L168.569 74.1748C167.909 72.5659 166.784 71.1903 165.34 70.2217C163.895 69.2531 162.195 68.7354 160.456 68.7354Z" fill="${color}"/>
          </g>
          <defs>
            <clipPath id="clip0_530_15">
              <rect width="320" height="320" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      `;

      el.onmouseenter = () => {
        el.style.transform = "scale(1.2)";
      };

      el.onmouseleave = () => {
        el.style.transform = "scale(1)";
      };

      el.onclick = () => {
        selectFood(food);
      };

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(
        `<strong>${food.name}</strong><br/>${food.city}, ${food.country}`
      );

      // Create marker with proper anchor (bottom center of pin)
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([food.coordinates[1], food.coordinates[0]])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [foods]);

  // Handle globe centering
  useEffect(() => {
    if (globeCenter && map.current) {
      map.current.flyTo({
        center: [globeCenter.lng, globeCenter.lat],
        zoom: 8,
        duration: 2000,
      });
    }
  }, [globeCenter]);

  // Handle preview pin (temporary pin for search results)
  useEffect(() => {
    if (!map.current) return;

    // Remove existing preview marker
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }

    // Add new preview marker if previewPlace is set
    if (previewPlace) {
      // Create preview marker element - outer container for Mapbox positioning
      const el = document.createElement("div");
      el.className = "preview-marker";
      el.style.cssText = `
        width: 48px;
        height: 48px;
        cursor: pointer;
      `;

      // Create inner wrapper for pulse animation (so it doesn't interfere with Mapbox positioning)
      const innerWrapper = document.createElement("div");
      innerWrapper.style.cssText = `
        width: 100%;
        height: 100%;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        filter: drop-shadow(0 4px 16px rgba(59, 130, 246, 0.8));
      `;

      // Add MapPin SVG in blue
      innerWrapper.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_preview)">
            <path d="M160 20C189.164 20.0331 217.123 31.6331 237.745 52.2549C258.367 72.8767 269.967 100.836 270 130C270 224.125 170 295.212 165.737 298.188C164.056 299.365 162.053 299.997 160 299.997C157.947 299.997 155.944 299.365 154.263 298.188C150 295.212 50 224.125 50 130C50.0331 100.836 61.633 72.8767 82.2549 52.2549C102.877 31.6331 130.836 20.0331 160 20ZM160.456 68.7354C158.717 68.7354 157.017 69.2531 155.572 70.2217C154.128 71.1902 153.004 72.5661 152.344 74.1748L140.144 103.699L108.519 106.251C106.792 106.403 105.148 107.061 103.792 108.142C102.436 109.222 101.428 110.678 100.896 112.328C100.363 113.978 100.328 115.748 100.795 117.417C101.262 119.087 102.211 120.582 103.522 121.716L127.644 142.529L120.268 173.656C119.865 175.344 119.972 177.113 120.572 178.74C121.173 180.368 122.241 181.782 123.644 182.803C125.046 183.824 126.72 184.407 128.453 184.479C130.186 184.552 131.902 184.109 133.385 183.208L160.47 166.549L187.539 183.208C189.022 184.114 190.74 184.561 192.477 184.491C194.213 184.421 195.89 183.838 197.295 182.816C198.7 181.794 199.771 180.378 200.372 178.748C200.973 177.118 201.077 175.346 200.672 173.656L193.323 142.529L217.444 121.716L217.412 121.721C218.726 120.586 219.676 119.088 220.144 117.416C220.611 115.743 220.573 113.97 220.037 112.318C219.501 110.667 218.489 109.21 217.129 108.131C215.768 107.052 214.12 106.397 212.39 106.251L180.764 103.699L168.569 74.1748C167.909 72.5659 166.784 71.1903 165.34 70.2217C163.895 69.2531 162.195 68.7354 160.456 68.7354Z" fill="#3b82f6"/>
          </g>
          <defs>
            <clipPath id="clip0_preview">
              <rect width="320" height="320" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      `;

      // Append inner wrapper to outer element
      el.appendChild(innerWrapper);

      // Add pulsing animation if not already added
      if (!document.getElementById('preview-pin-pulse')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'preview-pin-pulse';
        styleSheet.textContent = `
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.85;
              transform: scale(1.15);
            }
          }
        `;
        document.head.appendChild(styleSheet);
      }

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 35,
        closeButton: false,
      }).setHTML(
        `<strong>${previewPlace.name}</strong><br/><em>Preview - Click "Add to My Map" to save</em>`
      );

      // Create preview marker with proper anchor (bottom center of pin)
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([previewPlace.lng, previewPlace.lat])
        .setPopup(popup)
        .addTo(map.current);

      previewMarkerRef.current = marker;

      // Show popup briefly
      marker.togglePopup();
      setTimeout(() => marker.togglePopup(), 3000);
    }
  }, [previewPlace]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
