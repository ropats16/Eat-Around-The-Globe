"use client";

import { useFoodGlobeStore } from "@/lib/store";
import { ChevronDown, LogOut, Loader2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

// Wallet info mapping with consistent gradient shades
const WALLET_INFO = {
  arweave: {
    name: "Wander",
    icon: "/wallets/Wander.png",
    gradient: "from-[#6B57F9] to-[#4B3BD9]",
    // lightBg: "bg-[#EBE0FF]",
    lightBg: "bg-violet-100",
  },
  ethereum: {
    name: "MetaMask",
    icon: "/wallets/MetaMask.svg",
    gradient: "from-[#FF5C16] to-[#CC4A11]",
    lightBg: "bg-[#FFF0EB]",
  },
  solana: {
    name: "Phantom",
    icon: "/wallets/Phantom.svg",
    gradient: "from-[#AB9FF2] to-[#8B7FD2]",
    lightBg: "bg-[#F3F0FF]",
  },
};

export default function WalletButton() {
  const {
    walletType,
    walletAddress,
    isConnecting,
    openWalletModal,
    disconnectWallet,
  } = useFoodGlobeStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Shorten address for display
  const shortenAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const walletInfo = walletType ? WALLET_INFO[walletType] : null;

  // Not connected - show connect button (full width, matching search bar style)
  if (!walletAddress) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={openWalletModal}
        disabled={isConnecting}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 disabled:opacity-50 group z-50"
      >
        {/* Icon container - matches modal style */}
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-300 to-blue-400 flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
          {isConnecting ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          )}
        </div>

        {/* Text */}
        <span className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors flex-1 text-left">
          {isConnecting ? "Connecting..." : "Log In"}
        </span>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm overflow-hidden shadow-md shadow-black/10 bg-white p-0.5">
            <Image
              src="/wallets/Wander.png"
              alt="Wander"
              width={24}
              height={24}
              objectFit="cover"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="w-6 h-6 rounded-sm overflow-hidden shadow-md shadow-black/10 bg-white p-0.5">
            <Image
              src="/wallets/MetaMask.svg"
              alt="MetaMask"
              width={20}
              height={20}
              objectFit="cover"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="w-6 h-6 rounded-sm overflow-hidden shadow-md shadow-black/10">
            <Image
              src="/wallets/Phantom.svg"
              alt="Phantom"
              width={24}
              height={24}
              objectFit="cover"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Arrow indicator */}
        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
      </motion.button>
    );
  }

  // Connected - show wallet info (full width, similar style)
  return (
    <div className="relative w-full">
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 ${
          walletInfo?.lightBg || "bg-white"
        }`}
      >
        {/* Wallet icon */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-black/10 bg-white p-0.5">
          <Image
            src={walletInfo?.icon || ""}
            alt={walletInfo?.name || ""}
            width={40}
            height={40}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Wallet name and address */}
        <div className="flex-1 text-left">
          <div className="text-xs text-gray-500 font-medium leading-none mb-0.5">
            {walletInfo?.name}
          </div>
          <div className="text-sm font-bold text-gray-900 font-mono">
            {shortenAddress(walletAddress)}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              showDropdown ? "rotate-180" : ""
            }`}
          />
        </div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop to close dropdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-100"
              onClick={() => setShowDropdown(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden z-50"
            >
              {/* Address with copy */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Address
                    </p>
                    <p className="text-xs text-gray-700 font-mono truncate">
                      {walletAddress}
                    </p>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">Disconnect</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
