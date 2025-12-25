// providers/WalletProviders.tsx
// Multi-chain wallet providers following turbo-app reference implementation
// Supports: RainbowKit (Ethereum), Solana wallet adapters, Arweave (window.arweaveWallet)

"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { mainnet, base, polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  RainbowKitProvider,
  connectorsForWallets,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";

// Import RainbowKit and Solana wallet adapter styles
import "@rainbow-me/rainbowkit/styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";

// WalletConnect Project ID - get one from https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Define supported chains
const chains = [mainnet, base, polygon] as const;

// Configure wallets - explicitly excluding Rainbow until it's fully supported
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet],
    },
    {
      groupName: "Other",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "Eat Around The Globe",
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

// Public RPC endpoints that support CORS
// Using Cloudflare and public RPCs as fallbacks
const RPC_URLS = {
  mainnet: process.env.NEXT_PUBLIC_ETHEREUM_RPC || "https://cloudflare-eth.com",
  base: process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org",
  polygon: process.env.NEXT_PUBLIC_POLYGON_RPC || "https://polygon-rpc.com",
};

// Configure Wagmi with explicit wallet connectors (no Rainbow)
const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: {
    [mainnet.id]: http(RPC_URLS.mainnet),
    [base.id]: http(RPC_URLS.base),
    [polygon.id]: http(RPC_URLS.polygon),
  },
  ssr: false,
});

// Custom RainbowKit theme to match your app's dark theme
const customRainbowTheme = lightTheme({
  accentColor: "#FE0230", // Your brand color (adjust as needed)
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
});

// Configure Solana wallets
const solanaWallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

// React Query client for RainbowKit/Wagmi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
    },
  },
});

interface WalletProvidersProps {
  children: ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customRainbowTheme}>
          <ConnectionProvider
            endpoint={
              process.env.NEXT_PUBLIC_SOLANA_RPC ||
              "https://api.mainnet-beta.solana.com"
            }
          >
            <WalletProvider wallets={solanaWallets} autoConnect={false}>
              <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default WalletProviders;
