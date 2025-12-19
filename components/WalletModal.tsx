"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

// Wallet option configuration with official brand colors
const WALLET_OPTIONS = [
  {
    id: "arweave" as const,
    name: "Wander",
    description: "Arweave",
    icon: "/wallets/Wander.png",
    bgColor: "bg-[#6B57F9]",
    hoverBg: "hover:bg-[#EBE0FF]",
    ringColor: "ring-[#6B57F9]",
    installUrl: "https://www.wander.app/",
  },
  {
    id: "ethereum" as const,
    name: "MetaMask",
    description: "Ethereum",
    icon: "/wallets/MetaMask.svg",
    bgColor: "bg-[#FF5C16]",
    hoverBg: "hover:bg-[#FFF0EB]",
    ringColor: "ring-[#FF5C16]",
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "solana" as const,
    name: "Phantom",
    description: "Solana",
    icon: "/wallets/Phantom.svg",
    bgColor: "bg-[#AB9FF2]",
    hoverBg: "hover:bg-[#F3F0FF]",
    ringColor: "ring-[#AB9FF2]",
    installUrl: "https://phantom.app/download",
  },
];

export default function WalletModal() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    isConnecting,
    setIsConnecting,
    setWallet,
  } = useFoodGlobeStore();

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [isWanderReady, setIsWanderReady] = useState(false);
  const wanderReadyRef = useRef(false);

  // Listen for Wander wallet injection
  useEffect(() => {
    // Check if already available
    if (window.arweaveWallet) {
      console.log("✅ Wander wallet already available");
      setIsWanderReady(true);
      wanderReadyRef.current = true;
      return;
    }

    // Listen for the wallet to be injected
    const handleWalletLoaded = () => {
      console.log("✅ arweaveWalletLoaded event fired");
      setIsWanderReady(true);
      wanderReadyRef.current = true;
    };

    window.addEventListener("arweaveWalletLoaded", handleWalletLoaded);

    return () => {
      window.removeEventListener("arweaveWalletLoaded", handleWalletLoaded);
    };
  }, []);

  const handleConnect = async (walletId: "arweave" | "ethereum" | "solana") => {
    setIsConnecting(true);
    setConnectingWallet(walletId);

    try {
      switch (walletId) {
        case "arweave":
          await connectArweave();
          break;
        case "ethereum":
          await connectEthereum();
          break;
        case "solana":
          await connectSolana();
          break;
      }
      // Close modal on successful connection
      closeWalletModal();
    } catch (error) {
      console.error(`Failed to connect ${walletId}:`, error);
      // Don't show alert for user cancellation
      if (error instanceof Error && !error.message.includes("cancelled")) {
        alert(`Failed to connect: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const connectArweave = async () => {
    console.log("🔗 Connecting to Wander (Injected API)...");
    console.log(
      "🔍 isWanderReady:",
      isWanderReady,
      "ref:",
      wanderReadyRef.current
    );
    console.log("🔍 window.arweaveWallet:", window.arweaveWallet);

    // Check if wallet is available
    if (!window.arweaveWallet) {
      // Wallet not installed - open download page
      window.open("https://www.wander.app/", "_blank");
      throw new Error(
        "Wander wallet not installed. Please install and refresh."
      );
    }

    // Request permissions from the wallet
    // See: https://docs.wander.app/api/connect
    await window.arweaveWallet.connect(
      ["ACCESS_ADDRESS", "SIGN_TRANSACTION", "DISPATCH"],
      {
        name: "Food Globe",
        logo: "https://food-globe.vercel.app/icon-192x192.png",
      }
    );

    // Get the active address
    const address = await window.arweaveWallet.getActiveAddress();
    console.log("✅ Connected to Wander:", address);

    setWallet("arweave", address);
  };

  const connectEthereum = async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      throw new Error("MetaMask not installed");
    }

    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (accounts && accounts.length > 0) {
      setWallet("ethereum", accounts[0]);
    } else {
      throw new Error("No accounts found");
    }
  };

  const connectSolana = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      window.open("https://phantom.app/download", "_blank");
      throw new Error("Phantom wallet not installed");
    }

    const response = await window.solana.connect();
    const address = response.publicKey.toString();
    setWallet("solana", address);
  };

  return (
    <AnimatePresence>
      {isWalletModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWalletModal}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal - Centered on mobile, positioned on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-[360px] pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Connect a Wallet
                </h2>
                <button
                  onClick={closeWalletModal}
                  disabled={isConnecting}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Popular label */}
              <div className="px-6 py-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Popular
                </span>
              </div>

              {/* Wallet Options */}
              <div className="px-4 pb-4 space-y-2">
                {WALLET_OPTIONS.map((wallet, index) => {
                  const isThisConnecting = connectingWallet === wallet.id;
                  const isHovered = hoveredWallet === wallet.id;

                  return (
                    <motion.button
                      key={wallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleConnect(wallet.id)}
                      onMouseEnter={() => setHoveredWallet(wallet.id)}
                      onMouseLeave={() => setHoveredWallet(null)}
                      disabled={isConnecting}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-2xl
                        transition-all duration-200 ease-out
                        disabled:cursor-not-allowed
                        ${
                          isHovered && !isConnecting
                            ? `bg-blue-500/50 shadow-lg shadow-blue-500/25 scale-[1.02]`
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                      `}
                    >
                      {/* Wallet Icon */}
                      <div
                        className={`
                        w-11 h-11 rounded-xl overflow-hidden shrink-0
                        flex items-center justify-center
                        transition-transform duration-200 shadow-md shadow-black/10
                        ${isHovered ? "scale-110" : ""}
                        ${wallet.id !== "solana" && "bg-white p-1"}
                      `}
                      >
                        <Image
                          src={wallet.icon}
                          alt={wallet.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      {/* Wallet Name */}
                      <span
                        className={`
                        text-base font-semibold flex-1 text-left
                        transition-colors duration-200
                        ${
                          isHovered
                            ? "text-white font-black text-lg"
                            : "text-gray-900"
                        }
                      `}
                      >
                        {wallet.name}
                      </span>

                      {/* Loading indicator */}
                      {isThisConnecting && (
                        <Loader2
                          className={`w-5 h-5 animate-spin ${
                            isHovered ? "text-white" : "text-gray-400"
                          }`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-2">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  By connecting, your interactions will be saved permanently on
                  Arweave
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
