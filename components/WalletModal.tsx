/**
 * components/WalletModal.tsx
 *
 * Multi-chain wallet selection modal.
 * Uses RainbowKit for Ethereum, Solana wallet adapters, and Wander for Arweave.
 *
 * FIXED: Uses useFoodGlobeStore (not useStore) to match your existing store.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useFoodGlobeStore } from "@/lib/store"; // FIXED: correct import
import { clearEthereumTurboClientCache } from "@/hooks/useEthereumTurboClient";
import { ARWEAVE_PERMISSIONS, resetTurboClients } from "@/lib/arweave";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Monitor, Smartphone, X, Loader2 } from "lucide-react";

export default function WalletModal() {
  // Use the full store with correct function names
  const { isWalletModalOpen, closeWalletModal, setWallet } =
    useFoodGlobeStore();

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [intentionalSolanaConnect, setIntentionalSolanaConnect] =
    useState(false);
  const [intentionalEthConnect, setIntentionalEthConnect] = useState(false);
  const [showRainbowWarning, setShowRainbowWarning] = useState(false);
  const hasHandledEthConnection = React.useRef(false);

  // RainbowKit hooks for Ethereum
  const { openConnectModal } = useConnectModal();
  const ethAccount = useAccount();
  const { disconnectAsync } = useDisconnect();

  // Solana wallet hooks
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  const {
    publicKey,
    connect: connectSolana,
    wallets,
    select,
    wallet,
  } = useWallet();

  // Handle Ethereum connection from RainbowKit
  useEffect(() => {
    if (
      intentionalEthConnect &&
      ethAccount.isConnected &&
      ethAccount.address &&
      !hasHandledEthConnection.current
    ) {
      hasHandledEthConnection.current = true;
      clearEthereumTurboClientCache();

      // Check if user connected with Rainbow wallet
      const connectorName = ethAccount.connector?.name;
      if (connectorName === "Rainbow") {
        // Show Rainbow warning modal instead of completing connection
        setShowRainbowWarning(true);
        setIntentionalEthConnect(false);
        closeWalletModal();
        return;
      }

      setWallet("ethereum", ethAccount.address);
      setIntentionalEthConnect(false);
      closeWalletModal();
    }
  }, [
    ethAccount.isConnected,
    ethAccount.address,
    ethAccount.connector?.name,
    intentionalEthConnect,
    closeWalletModal,
    setWallet,
  ]);

  // Reset handled flag when modal opens
  useEffect(() => {
    if (isWalletModalOpen) {
      hasHandledEthConnection.current = false;
    }
  }, [isWalletModalOpen]);

  // Handle Solana connection
  useEffect(() => {
    if (publicKey && intentionalSolanaConnect) {
      setWallet("solana", publicKey.toString());
      setIntentionalSolanaConnect(false);
      closeWalletModal();
    }
  }, [publicKey, intentionalSolanaConnect, setWallet, closeWalletModal]);

  /**
   * Connect Wander (Arweave) wallet
   */
  const connectWander = async () => {
    setConnectingWallet("arweave");
    try {
      if (!window.arweaveWallet) {
        window.open("https://wander.app", "_blank");
        setConnectingWallet(null);
        return;
      }

      await window.arweaveWallet.connect(
        ARWEAVE_PERMISSIONS as unknown as string[]
      );
      const address = await window.arweaveWallet.getActiveAddress();

      setWallet("arweave", address);
      closeWalletModal();
    } catch (error) {
      console.error("Failed to connect Wander:", error);
    } finally {
      setConnectingWallet(null);
    }
  };

  /**
   * Connect Ethereum wallet via RainbowKit
   */
  const connectEthereumWallet = async () => {
    try {
      // If already connected, disconnect first
      if (ethAccount.isConnected) {
        clearEthereumTurboClientCache();
        resetTurboClients();
        await disconnectAsync();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setIntentionalEthConnect(true);

      if (openConnectModal) {
        openConnectModal();
      }
    } catch (error) {
      console.error("Failed to open wallet selection:", error);
      setIntentionalEthConnect(false);
    }
  };

  /**
   * Connect Phantom (Solana) wallet
   */
  const connectPhantom = async () => {
    try {
      setIntentionalSolanaConnect(true);

      // If already connected, use it
      if (publicKey) {
        setWallet("solana", publicKey.toString());
        setIntentionalSolanaConnect(false);
        closeWalletModal();
        return;
      }

      // Try to find Phantom
      const phantomWallet = wallets.find((w) => w.adapter.name === "Phantom");

      if (phantomWallet) {
        setConnectingWallet("solana");
        select(phantomWallet.adapter.name);

        // Wait for wallet selection
        let attempts = 0;
        while (attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (wallet?.adapter.name === "Phantom") {
            try {
              await connectSolana();
              break;
            } catch {
              if (attempts === 9) {
                console.error("Failed to connect after multiple attempts");
              }
            }
          }
          attempts++;
        }
      } else {
        // Fallback to Solana modal
        closeWalletModal();
        setSolanaModalVisible(true);
      }
    } catch (error) {
      console.error("Failed to connect Phantom:", error);
      setIntentionalSolanaConnect(false);
    } finally {
      setConnectingWallet(null);
    }
  };

  /**
   * Handle switching from Rainbow to MetaMask
   */
  const handleSwitchToMetaMask = async () => {
    try {
      // Disconnect Rainbow
      clearEthereumTurboClientCache();
      resetTurboClients();
      await disconnectAsync();
      setShowRainbowWarning(false);

      // Small delay then reopen RainbowKit
      await new Promise((resolve) => setTimeout(resolve, 200));
      setIntentionalEthConnect(true);
      hasHandledEthConnection.current = false;

      if (openConnectModal) {
        openConnectModal();
      }
    } catch (error) {
      console.error("Failed to switch wallet:", error);
    }
  };

  /**
   * Continue with Rainbow for browse-only mode
   */
  const handleContinueWithRainbow = () => {
    if (ethAccount.address) {
      setWallet("ethereum", ethAccount.address);
    }
    setShowRainbowWarning(false);
  };

  /**
   * Cancel and disconnect Rainbow
   */
  const handleCancelRainbow = async () => {
    try {
      clearEthereumTurboClientCache();
      resetTurboClients();
      await disconnectAsync();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setShowRainbowWarning(false);
  };

  if (!isWalletModalOpen && !showRainbowWarning) return null;

  const WALLET_OPTIONS = [
    {
      id: "ethereum",
      name: "Ethereum",
      description: "MetaMask tested",
      function: connectEthereumWallet,
      icon: "https://cryptologos.cc/logos/versions/ethereum-eth-logo-diamond-purple.svg?v=040",
      desktopOnly: false,
    },
    {
      id: "solana",
      name: "Solana",
      description: "Phantom, Solflare, etc.",
      function: connectPhantom,
      icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=040",
      desktopOnly: false,
    },
    {
      id: "arweave",
      name: "Arweave",
      description: "Wander wallet",
      function: connectWander,
      icon: "/wallets/wander.png",
      desktopOnly: true,
    },
  ];

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

          {/* Modal */}
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
                  disabled={connectingWallet !== null}
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
                  const isDisabledOnMobile = wallet.desktopOnly;

                  return (
                    <motion.button
                      key={wallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={wallet.function}
                      onMouseEnter={() => setHoveredWallet(wallet.id)}
                      onMouseLeave={() => setHoveredWallet(null)}
                      disabled={isThisConnecting}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-2xl
                        transition-all duration-200 ease-out
                        ${
                          isHovered && !isThisConnecting
                            ? "bg-blue-500/50 shadow-lg shadow-blue-500/25 scale-[1.02]"
                            : ""
                        }
                      `}
                    >
                      {/* Wallet Icon */}
                      <div
                        className={`
                        w-11 h-11 rounded-xl overflow-hidden shrink-0
                        flex items-center justify-center
                        transition-transform duration-200 shadow-md shadow-black/10
                        bg-white p-1
                        ${isHovered ? "scale-110" : ""}
                        ${
                          wallet.id === "ethereum" || wallet.id === "solana"
                            ? "p-2"
                            : ""
                        }
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

                      {/* Wallet Info */}
                      <div className="flex-1 text-left">
                        <span
                          className={`
                          text-base font-semibold block
                          transition-colors duration-200
                          ${
                            isHovered
                              ? "text-white font-black text-lg"
                              : "text-gray-900"
                          }
                        `}
                        >
                          {wallet.name}
                          <span
                            className={`text-sm font-medium ml-1
                              ${
                                isHovered ? "text-white/90" : "text-gray-400/50"
                              }`}
                          >
                            ({wallet.description})
                          </span>
                        </span>

                        {/* Mobile/Desktop indicator */}
                        <span
                          className={`text-xs flex items-center gap-1 mt-0.5
                          ${isHovered ? "text-white/70" : "text-gray-400"}`}
                        >
                          {wallet.desktopOnly ? (
                            <>
                              <Monitor className="w-3 h-3" /> Desktop only
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-3 h-3" /> Mobile &amp;
                              Desktop
                            </>
                          )}
                        </span>
                      </div>

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
                  Rainbow 🌈 support is one of our top priorities and coming
                  very soon! Please use MetaMask for now.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Rainbow Wallet Warning Modal */}
      {showRainbowWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelRainbow}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-[380px] pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  🌈 Rainbow Support Coming Soon
                </h2>
                <button
                  onClick={handleCancelRainbow}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  We&apos;re working on full Rainbow wallet support! For now,
                  saving places and recommendations requires{" "}
                  <span className="font-semibold text-gray-900">MetaMask</span>.
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSwitchToMetaMask}
                    className="w-full py-3 px-4 bg-linear-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Switch to MetaMask
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-2">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Rainbow support is one of our top priorities and coming very
                  soon!
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
