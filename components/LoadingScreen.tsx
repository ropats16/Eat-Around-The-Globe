"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [dots, setDots] = useState("");

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
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
        className="bg-white rounded-3xl shadow-2xl shadow-black/15 border border-gray-100 p-10 text-center max-w-sm mx-4"
      >
        {/* Animated globe */}
        <motion.div
          className="text-6xl mb-6"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          🌍
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Eat Around The Globe
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-8">
          Taste the world, one pin at a time
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3">
          {/* Spinning dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-blue-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>

          {/* Loading text */}
          <span className="text-sm text-gray-400 w-20 text-left">
            Loading{dots}
          </span>
        </div>

        {/* Arweave badge */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-medium text-gray-500">Arweave</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
