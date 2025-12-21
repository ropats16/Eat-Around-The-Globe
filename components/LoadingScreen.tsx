"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  // Animate progress bar - smooth one-time progression
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100; // Stop at 100
        return prev + 1;
      });
    }, 15); // Faster updates for smoother animation
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
    >
      {/* Clean white card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl shadow-2xl shadow-black/15 border border-gray-100 p-10 text-center max-w-md mx-4"
      >
        {/* Animated globe image with hover effect */}
        <motion.div
          className="mb-8 flex justify-center"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden">
            <Image
              src="/globe-w-markers.png"
              alt="Globe with markers"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Eat Around The Globe
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-8">
          Taste the world, one pin at a time
        </p>

        {/* Progress bar with gradient */}
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-2.5 bg-gray-100 shadow-inner"
          />
          <style jsx global>{`
            [data-slot="progress-indicator"] {
              background: linear-gradient(to right, #60a5fa, #2563eb);
              box-shadow: 0 0 12px rgba(37, 99, 235, 0.4);
            }
          `}</style>
          <p className="text-xs text-gray-400 font-medium">
            Loading your food journey...
          </p>
        </div>

        {/* Attribution */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Image by{" "}
            <a
              href="https://www.freepik.com/free-vector/global-connectivity-location-markers_415667356.htm#fromView=search&page=1&position=28&uuid=79fd954f-da71-4ea7-9088-79758cfce480&query=3d+globe+marker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-medium underline transition-colors"
            >
              brgfx on Freepik
            </a>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
