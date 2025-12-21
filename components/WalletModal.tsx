"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useFoodGlobeStore } from "@/lib/store";
import { X, Loader2, Smartphone, Monitor } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitState,
} from "@reown/appkit/react";
import { resetSigners } from "@/lib/arweave";

// Wallet option configuration with official brand colors
const WALLET_OPTIONS = [
  {
    id: "walletconnect" as const,
    name: "WalletConnect",
    description: "Ethereum, Solana & More",
    icon: "/wallets/WalletConnect.svg",
    bgColor: "bg-[#3396FF]",
    hoverBg: "hover:bg-[#E8F4FF]",
    ringColor: "ring-[#3396FF]",
    installUrl: "https://walletconnect.com/",
    supportsAppKit: true,
    desktopOnly: false,
  },
  {
    id: "arweave" as const,
    name: "Wander",
    description: "Arweave",
    icon: "/wallets/Wander.png",
    bgColor: "bg-[#6B57F9]",
    hoverBg: "hover:bg-[#EBE0FF]",
    ringColor: "ring-[#6B57F9]",
    installUrl: "https://www.wander.app/",
    supportsAppKit: false,
    desktopOnly: true,
  },

  {
    id: "phantom" as const,
    name: "Phantom",
    description: "Coming Soon",
    icon: "/wallets/Phantom-Icon_Transparent_Purple.svg",
    bgColor: "bg-[#AB9FF2]",
    hoverBg: "hover:bg-[#F0EBFF]",
    ringColor: "ring-[#AB9FF2]",
    installUrl: "https://phantom.app/",
    supportsAppKit: false,
    desktopOnly: false,
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
  const [isMobile, setIsMobile] = useState(false);
  const wanderReadyRef = useRef(false);

  // AppKit hooks
  const { open: openAppKit } = useAppKit();
  const { address: appKitAddress, isConnected: isAppKitConnected } =
    useAppKitAccount();
  const { walletProvider: ethProvider } = useAppKitProvider("eip155");
  const { walletProvider: solProvider } = useAppKitProvider("solana");
  const { open: isAppKitModalOpen } = useAppKitState();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Listen for Wander wallet injection
  useEffect(() => {
    if (window.arweaveWallet) {
      console.log("✅ Wander wallet already available");
      wanderReadyRef.current = true;
      return;
    }

    const handleWalletLoaded = () => {
      console.log("✅ arweaveWalletLoaded event fired");
      wanderReadyRef.current = true;
    };

    window.addEventListener("arweaveWalletLoaded", handleWalletLoaded);
    return () => {
      window.removeEventListener("arweaveWalletLoaded", handleWalletLoaded);
    };
  }, []);

  // Watch for AppKit modal close (user cancelled)
  useEffect(() => {
    console.log("🔍 [MODAL CLOSE WATCH] State:", {
      isAppKitModalOpen,
      connectingWallet,
      isAppKitConnected,
      timestamp: new Date().toISOString(),
    });

    // If AppKit modal was closed and we're still in connecting state, reset
    // But wait 1000ms to give isAppKitConnected time to update (prevents race condition)
    if (
      !isAppKitModalOpen &&
      connectingWallet === "walletconnect" &&
      !isAppKitConnected
    ) {
      console.log(
        "⚠️ [RESET TRIGGER] AppKit modal closed, waiting 1000ms to check connection..."
      );

      const timeoutId = setTimeout(() => {
        console.log(
          "🔄 [RESET CHECK] Timeout fired - if connection succeeded, this will be cancelled"
        );
        // If we reach here, it means isAppKitConnected didn't update to true within 1000ms
        // This indicates the user truly cancelled (didn't scan QR or scan failed)
        console.log(
          "🔄 [RESET EXECUTED] User cancelled - clearing connecting state"
        );
        setIsConnecting(false);
        setConnectingWallet(null);
      }, 1000);

      // Cleanup: If isAppKitConnected becomes true before timeout fires,
      // this effect re-runs and cleanup cancels the timeout
      return () => {
        console.log(
          "🧹 [CLEANUP] Clearing reset timeout (likely because connection succeeded)"
        );
        clearTimeout(timeoutId);
      };
    }
  }, [isAppKitModalOpen, connectingWallet, isAppKitConnected, setIsConnecting]);

  // Watch for AppKit connection changes
  useEffect(() => {
    console.log("🔍 [CONNECTION WATCH] State:", {
      isAppKitConnected,
      appKitAddress,
      connectingWallet,
      hasEthProvider: !!ethProvider,
      hasSolProvider: !!solProvider,
      timestamp: new Date().toISOString(),
    });

    if (isAppKitConnected && appKitAddress && connectingWallet) {
      // Determine wallet type based on address format
      const isEthereum = appKitAddress.startsWith("0x");
      const walletTypeDetected = isEthereum ? "ethereum" : "solana";
      const provider = isEthereum ? ethProvider : solProvider;

      console.log(
        `✅ [CONNECTION SUCCESS] Connected via AppKit: ${walletTypeDetected}`,
        appKitAddress
      );

      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        console.log("🎉 [WALLET SET] Setting wallet in store");
        setWallet(walletTypeDetected, appKitAddress, provider);
        setConnectingWallet(null);
        setIsConnecting(false);
        closeWalletModal();
      }, 0);
    }
  }, [
    isAppKitConnected,
    appKitAddress,
    connectingWallet,
    ethProvider,
    solProvider,
    setWallet,
    setIsConnecting,
    closeWalletModal,
  ]);

  const handleConnect = async (
    walletId: "arweave" | "phantom" | "walletconnect"
  ) => {
    console.log(`🚀 [CONNECT CLICK] User clicked: ${walletId}`);
    const wallet = WALLET_OPTIONS.find((w) => w.id === walletId);

    // Check if trying to use desktop-only wallet on mobile
    if (wallet?.desktopOnly && isMobile) {
      alert(`${wallet.name} wallet is only available on desktop browsers.`);
      return;
    }

    console.log(`📝 [STATE UPDATE] Setting connecting state for: ${walletId}`);
    setIsConnecting(true);
    setConnectingWallet(walletId);

    try {
      if (walletId === "arweave") {
        // Arweave uses direct extension connection
        console.log("🔗 [ARWEAVE] Connecting to Wander...");
        await connectArweave();
        closeWalletModal();
      } else if (walletId === "phantom") {
        // Phantom uses direct Solana wallet connection
        console.log("🔗 [PHANTOM] Connecting to Phantom...");
        await connectPhantom();
        closeWalletModal();
      } else if (walletId === "walletconnect") {
        // WalletConnect opens AppKit modal with filtered wallet options
        // Reset any cached signers when switching wallets
        console.log("🔄 [WALLETCONNECT] Resetting signers...");
        resetSigners();

        console.log("🌐 [WALLETCONNECT] Opening AppKit modal...");
        // Open AppKit modal - it shows MetaMask, Phantom, etc. based on featuredWalletIds
        // The useEffect above will detect if it's ethereum or solana based on address format
        await openAppKit();
        console.log(
          "✅ [WALLETCONNECT] AppKit modal opened (awaiting user interaction)"
        );
        // Connection will be handled by the useEffect above which sets walletType to "ethereum" or "solana"
      }
    } catch (error) {
      console.error(`❌ [CONNECT ERROR] Failed to connect ${walletId}:`, error);
      if (error instanceof Error && !error.message.includes("cancelled")) {
        alert(`Failed to connect: ${error.message}`);
      }
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const connectArweave = async () => {
    console.log("🔗 Connecting to Wander (Injected API)...");

    if (!window.arweaveWallet) {
      window.open("https://www.wander.app/", "_blank");
      throw new Error(
        "Wander wallet not installed. Please install and refresh."
      );
    }

    await window.arweaveWallet.connect(
      [
        "ACCESS_ADDRESS",
        "ACCESS_PUBLIC_KEY",
        "SIGN_TRANSACTION",
        "SIGNATURE",
        "DISPATCH",
      ],
      {
        name: "Eat Around The Globe",
        logo: "https://eat-around-the-globe.vercel.app/globe-w-markers.png",
      }
    );

    const address = await window.arweaveWallet.getActiveAddress();
    console.log("✅ Connected to Wander:", address);

    setWallet("arweave", address);
    setIsConnecting(false);
    setConnectingWallet(null);
  };

  const connectPhantom = async () => {
    console.log("🟣 Connecting to Phantom...");

    // Detect if we're on Brave mobile (Brave blocks Phantom deep links)
    const isBraveMobile =
      isMobile &&
      // @ts-expect-error - brave is not in navigator types
      (navigator.brave?.isBrave || /Brave/i.test(navigator.userAgent));

    if (isBraveMobile) {
      alert(
        "Phantom is not supported in Brave mobile browser. Please try Safari, Chrome, or the in-app browser within the Phantom app."
      );
      setIsConnecting(false);
      setConnectingWallet(null);
      return;
    }

    // Check if Phantom is available (desktop extension or in-app browser)
    if (window.solana?.isPhantom) {
      console.log("✅ Phantom extension detected");

      try {
        // Connect to Phantom
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        console.log("✅ Connected to Phantom:", address);

        // Set wallet with the provider for signing
        setWallet("solana", address, window.solana);
        setIsConnecting(false);
        setConnectingWallet(null);
      } catch (error) {
        console.error("❌ Phantom connection failed:", error);
        throw error;
      }
    } else if (isMobile) {
      // Mobile: Open Phantom app via universal link
      // This will prompt Safari to open the Phantom app
      console.log("📱 Mobile detected, opening Phantom app...");

      const currentUrl = encodeURIComponent(window.location.href);
      const phantomUrl = `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;

      // Open the Phantom universal link
      window.location.assign(phantomUrl);

      // Reset connecting state since we're navigating away
      setIsConnecting(false);
      setConnectingWallet(null);
    } else {
      // Desktop without extension - prompt to install
      console.log("⚠️ Phantom not installed");
      window.open("https://phantom.app/", "_blank");
      throw new Error(
        "Phantom wallet not installed. Please install and refresh."
      );
    }
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
                  const isDisabledOnMobile = wallet.desktopOnly && isMobile;

                  return (
                    <motion.button
                      key={wallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleConnect(wallet.id)}
                      onMouseEnter={() => setHoveredWallet(wallet.id)}
                      onMouseLeave={() => setHoveredWallet(null)}
                      disabled={
                        isConnecting ||
                        isDisabledOnMobile ||
                        wallet.id === "phantom"
                      }
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-2xl
                        transition-all duration-200 ease-out
                        disabled:cursor-not-allowed
                        ${isDisabledOnMobile ? "opacity-50" : ""}
                        ${
                          isHovered && !isConnecting && !isDisabledOnMobile
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
                        bg-white p-1
                        ${isHovered && !isDisabledOnMobile ? "scale-110" : ""}
                      `}
                      >
                        <Image
                          src={wallet.icon}
                          alt={wallet.name}
                          width={44}
                          height={44}
                          className={`w-full h-full object-contain rounded-lg ${
                            wallet.id === "phantom" ? "opacity-50" : ""
                          }`}
                        />
                      </div>

                      {/* Wallet Info */}
                      <div className="flex-1 text-left">
                        <span
                          className={`
                          text-base font-semibold block
                          transition-colors duration-200
                          ${
                            isHovered && !isDisabledOnMobile
                              ? "text-white font-black text-lg"
                              : "text-gray-900"
                          }
                          ${wallet.id === "phantom" ? "opacity-50" : ""}
                        `}
                        >
                          {wallet.name}
                          {wallet.id === "arweave" ||
                            (wallet.id === "phantom" && (
                              <span
                                className={`text-sm font-medium
                              ${
                                isHovered && !isDisabledOnMobile
                                  ? "text-white/90"
                                  : "text-gray-400"
                              }`}
                              >
                                {" "}
                                ({wallet.description})
                              </span>
                            ))}
                        </span>

                        {/* Mobile/Desktop indicator */}
                        {wallet.id !== "phantom" ? (
                          <span
                            className={`text-xs flex items-center gap-1 mt-0.5
                          ${
                            isHovered && !isDisabledOnMobile
                              ? "text-white/70"
                              : "text-gray-400"
                          }`}
                          >
                            {wallet.desktopOnly ? (
                              <>
                                <Monitor className="w-3 h-3" /> Desktop only
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-3 h-3" /> Mobile &
                                Desktop
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1 mt-0.5 text-gray-400">
                            Use Solflare or another wallet via WalletConnect
                          </span>
                        )}
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
                  {isMobile
                    ? "Scan QR code or use deep link to connect your mobile wallet"
                    : "By connecting, your interactions will be saved permanently on Arweave"}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
