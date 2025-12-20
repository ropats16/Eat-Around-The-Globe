"use client";

import { useFoodGlobeStore } from "@/lib/store";
import { ChevronDown, LogOut, Loader2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { useDisconnect } from "@reown/appkit/react";
import { resetSigners } from "@/lib/arweave";

// Wallet info mapping with consistent gradient shades
const WALLET_INFO = {
  arweave: {
    name: "Wander",
    icon: "/wallets/Wander.png",
    gradient: "from-[#6B57F9] to-[#4B3BD9]",
    lightBg: "bg-violet-100",
  },
  // Both ethereum and solana display as WalletConnect in UI
  ethereum: {
    name: "WalletConnect",
    icon: "/wallets/WalletConnect.svg",
    gradient: "from-[#3396FF] to-[#2577DD]",
    lightBg: "bg-blue-50",
  },
  solana: {
    name: "WalletConnect",
    icon: "/wallets/WalletConnect.svg",
    gradient: "from-[#3396FF] to-[#2577DD]",
    lightBg: "bg-blue-50",
  },
};

export default function WalletButton() {
  const {
    walletType,
    walletAddress,
    isConnecting,
    openWalletModal,
    disconnectWallet,
    userProfile,
    isLoadingProfile,
  } = useFoodGlobeStore();

  const { disconnect: disconnectAppKit } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Handle disconnect for all wallet types
  const handleDisconnect = async () => {
    console.log("=== DISCONNECT CLICKED ===");
    console.log("1. isDisconnecting state:", isDisconnecting);
    console.log("2. walletType:", walletType);
    console.log("3. walletAddress:", walletAddress);

    if (isDisconnecting) {
      console.log("❌ Already disconnecting, returning early");
      return;
    }

    setIsDisconnecting(true);
    console.log("4. Set isDisconnecting to true");

    try {
      // Reset cached signers
      console.log("5. Calling resetSigners()...");
      resetSigners();
      console.log("6. resetSigners() completed");

      // If ETH/SOL, also disconnect from AppKit
      if (walletType === "ethereum" || walletType === "solana") {
        console.log("7. Wallet is ETH/SOL, attempting AppKit disconnect...");
        console.log("8. disconnectAppKit function:", typeof disconnectAppKit);

        try {
          await disconnectAppKit();
          console.log("✅ 9. AppKit disconnect completed");
        } catch (appKitError) {
          console.error("❌ 10. AppKit disconnect error:", appKitError);
          throw appKitError;
        }
      } else {
        console.log("7. Wallet is not ETH/SOL, skipping AppKit disconnect");
      }

      // Clear local state
      console.log("11. Calling disconnectWallet()...");
      disconnectWallet();
      console.log("12. disconnectWallet() completed");

      console.log("13. Closing dropdown...");
      setShowDropdown(false);
      console.log("✅ 14. DISCONNECT SUCCESSFUL");
    } catch (err) {
      console.error("❌ DISCONNECT ERROR:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      // Still clear local state even if AppKit disconnect fails
      console.log("15. Error occurred, clearing local state anyway...");
      disconnectWallet();
      setShowDropdown(false);
      console.log("16. Local state cleared despite error");
    } finally {
      setIsDisconnecting(false);
      console.log("17. Set isDisconnecting to false");
      console.log("=== DISCONNECT HANDLER COMPLETED ===");
    }
  };

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

  // Not connected - show connect button
  if (!walletAddress) {
    return (
      <>
        {/* Mobile: Compact square icon button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openWalletModal}
          disabled={isConnecting}
          className="md:hidden w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 disabled:opacity-50 z-50"
          aria-label="Connect wallet"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-300 to-blue-400 flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
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
        </motion.button>

        {/* Desktop: Full button */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={openWalletModal}
          disabled={isConnecting}
          className="hidden md:flex w-full items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 disabled:opacity-50 group z-50"
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
                src="/wallets/WalletConnect.svg"
                alt="WalletConnect"
                width={24}
                height={24}
                objectFit="cover"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
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
          </div>

          {/* Arrow indicator */}
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-500 transition-colors" />
        </motion.button>
      </>
    );
  }

  // Connected - show wallet info
  return (
    <>
      {/* Mobile: Compact square icon button */}
      <div className="relative md:hidden">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-100 z-50"
          aria-label="Wallet menu"
        >
          {userProfile?.pfp ? (
            <Image
              src={userProfile.pfp}
              alt={userProfile.username}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : userProfile ? (
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {userProfile.username.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Image
              src={walletInfo?.icon || ""}
              alt={walletInfo?.name || ""}
              width={28}
              height={28}
              className="w-7 h-7 object-contain rounded-lg"
            />
          )}
        </motion.button>
        {/* Dropdown for mobile */}
        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden z-50"
              >
                {userProfile && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Profile
                    </p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {userProfile.username}
                    </p>
                  </div>
                )}
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
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Full button */}
      <div className="relative hidden md:block w-full">
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
          {/* Profile picture or wallet icon */}
          {userProfile?.pfp ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-md shadow-black/10">
              <Image
                src={userProfile.pfp}
                alt={userProfile.username}
                fill
                className="object-cover"
              />
            </div>
          ) : userProfile ? (
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-black/10">
              {userProfile.username.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-black/10 bg-white p-0.5">
              <Image
                src={walletInfo?.icon || ""}
                alt={walletInfo?.name || ""}
                width={40}
                height={40}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}

          {/* Username or wallet name and address */}
          <div className="flex-1 text-left min-w-0">
            {isLoadingProfile ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">
                  Loading profile...
                </span>
              </div>
            ) : userProfile ? (
              <>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {userProfile.username}
                </div>
                <div className="text-xs text-gray-500 font-medium font-mono">
                  {shortenAddress(walletAddress)}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-gray-500 font-medium leading-none mb-0.5">
                  {walletInfo?.name}
                </div>
                <div className="text-sm font-bold text-gray-900 font-mono">
                  {shortenAddress(walletAddress)}
                </div>
              </>
            )}
          </div>

          {/* Wallet icon badge (when profile is shown) and status indicator */}
          <div className="flex items-center gap-2">
            {userProfile && (
              <div className="w-6 h-6 rounded-lg overflow-hidden shadow-sm shadow-black/10 bg-white p-0.5">
                <Image
                  src={walletInfo?.icon || ""}
                  alt={walletInfo?.name || ""}
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
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
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden z-50"
              >
                {/* Profile info (if available) */}
                {userProfile && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                      Profile
                    </p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {userProfile.username}
                    </p>
                    {userProfile.bio && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {userProfile.bio}
                      </p>
                    )}
                  </div>
                )}

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
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
