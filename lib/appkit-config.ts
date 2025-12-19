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

// Only include these specific wallets - limits the wallet list
const includeWalletIds = [
  // EVM wallets
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  // "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow

  // Solana wallets
  // "225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f", // Phantom
  "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393", // Phantom
];

console.log("🔧 AppKit Config - includeWalletIds:", includeWalletIds);
console.log(
  "🔧 AppKit Config - projectId:",
  projectId ? "✅ Set" : "❌ Missing"
);

// Create and export AppKit instance
export const appKit = projectId
  ? createAppKit({
      adapters: [ethers5Adapter, solanaAdapter],
      networks: networks as [typeof mainnet, ...typeof networks],
      projectId,
      metadata,
      includeWalletIds, // Restrict to only these wallets
      featuredWalletIds: includeWalletIds, // Also feature them
      enableWalletGuide: false, // Don't show wallet guide
      features: {
        analytics: false,
        email: false,
        socials: false,
      },
      themeMode: "light",
    })
  : null;

console.log("🔧 AppKit instance created:", appKit ? "✅ Success" : "❌ Failed");

// Export for type inference
export type AppKitInstance = typeof appKit;
