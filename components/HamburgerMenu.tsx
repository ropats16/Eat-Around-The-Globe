"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useFoodGlobeStore } from "@/lib/store";

export default function HamburgerMenu() {
  const { isSidebarOpen, toggleSidebar } = useFoodGlobeStore();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleSidebar}
      className="w-11 h-11 md:hidden flex items-center justify-center bg-white rounded-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 z-50"
      aria-label="Toggle menu"
    >
      <motion.div
        animate={{ rotate: isSidebarOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isSidebarOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </motion.div>
    </motion.button>
  );
}

