// lib/appkit-config.ts
// WalletConnect AppKit configuration for multi-chain wallet support

import { createAppKit } from "@reown/appkit/react";
import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { mainnet, arbitrum, polygon } from "@reown/appkit/networks";
import { solana } from "@reown/appkit/networks";

// Only run on client side
if (typeof window === "undefined") {
  throw new Error(
    "AppKit should only be initialized on the client side. Import this file dynamically in a useEffect."
  );
}

// Get project ID from environment variable
// Create one at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work."
  );
}

// Metadata for the app
const metadata = {
  name: "Food Globe",
  description: "Discover and share food recommendations around the world",
  url: "https://food-globe.vercel.app",
  icons: ["https://food-globe.vercel.app/icon-192x192.png"],
};

// Create adapters
const ethers5Adapter = new Ethers5Adapter();
const solanaAdapter = new SolanaAdapter();

// Networks to support
const networks = [mainnet, arbitrum, polygon, solana];

// Clear any stale WalletConnect data on initialization
// This prevents "No matching key" errors from previous sessions
try {
  const wcKeys = Object.keys(localStorage).filter(
    (key) => key.startsWith("wc@") || key.startsWith("WALLETCONNECT")
  );
  // Clear stale sessions - comment this out if you want to preserve sessions across refreshes
  wcKeys.forEach((key) => localStorage.removeItem(key));
  if (wcKeys.length > 0) {
    console.log(`Cleared ${wcKeys.length} stale WalletConnect session(s)`);
  }
} catch (error) {
  console.warn("Could not clear WalletConnect storage:", error);
}

// Create and export AppKit instance
export const appKit = projectId
  ? createAppKit({
      adapters: [ethers5Adapter, solanaAdapter],
      networks: networks as [typeof mainnet, ...typeof networks],
      projectId,
      metadata,
      features: {
        analytics: false,
        email: false,
        socials: false,
      },
      themeMode: "light",
    })
  : null;

// Export for type inference
export type AppKitInstance = typeof appKit;
