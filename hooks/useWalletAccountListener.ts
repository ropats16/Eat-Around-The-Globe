/**
 * hooks/useWalletAccountListener.ts
 *
 * Monitors wallet account changes across all chains and clears caches.
 * This prevents stale signer usage when users switch accounts.
 *
 * USAGE: Call this hook once in a root component (e.g., app/page.tsx or a layout client component)
 *
 * function MyApp() {
 *   useWalletAccountListener();
 *   return <>{children}</>;
 * }
 */

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useFoodGlobeStore } from "@/lib/store";
import { clearEthereumTurboClientCache } from "./useEthereumTurboClient";
import { resetTurboClients } from "@/hooks/useArweaveUpload";

export function useWalletAccountListener() {
  const { address: ethAddress, connector } = useAccount();
  const { publicKey: solanaPublicKey } = useWallet();
  const { walletType, walletAddress, disconnectWallet } = useFoodGlobeStore();

  // Track previous values to detect changes
  const prevEthAddress = useRef<string | undefined>(undefined);
  const prevSolanaKey = useRef<string | undefined>(undefined);
  const prevConnector = useRef<typeof connector>(undefined);

  // Listen for Ethereum account changes via wagmi
  useEffect(() => {
    // Skip initial mount
    if (prevEthAddress.current === undefined) {
      prevEthAddress.current = ethAddress;
      return;
    }

    // Detect address change
    if (ethAddress !== prevEthAddress.current) {
      console.log("🔄 Ethereum address changed:", {
        from: prevEthAddress.current,
        to: ethAddress,
      });

      // Clear caches
      clearEthereumTurboClientCache();

      // If we were connected with Ethereum, update or disconnect
      if (walletType === "ethereum") {
        if (ethAddress) {
          // Account switched to new address
          useFoodGlobeStore.getState().setWallet("ethereum", ethAddress);
        } else {
          // Disconnected
          disconnectWallet();
          resetTurboClients();
        }
      }

      prevEthAddress.current = ethAddress;
    }
  }, [ethAddress, walletType, disconnectWallet]);

  // Listen for connector changes (e.g., switching from MetaMask to Rainbow)
  useEffect(() => {
    if (prevConnector.current === undefined) {
      prevConnector.current = connector;
      return;
    }

    if (connector?.id !== prevConnector.current?.id) {
      console.log("🔄 Wallet connector changed:", {
        from: prevConnector.current?.name,
        to: connector?.name,
      });

      // Clear Ethereum caches on connector change
      clearEthereumTurboClientCache();
      prevConnector.current = connector;
    }
  }, [connector]);

  // Listen for Solana account changes
  useEffect(() => {
    const solanaKeyStr = solanaPublicKey?.toString();

    if (prevSolanaKey.current === undefined) {
      prevSolanaKey.current = solanaKeyStr;
      return;
    }

    if (solanaKeyStr !== prevSolanaKey.current) {
      console.log("🔄 Solana address changed:", {
        from: prevSolanaKey.current,
        to: solanaKeyStr,
      });

      // If we were connected with Solana, update or disconnect
      if (walletType === "solana") {
        if (solanaKeyStr) {
          useFoodGlobeStore.getState().setWallet("solana", solanaKeyStr);
        } else {
          disconnectWallet();
          resetTurboClients();
        }
      }

      prevSolanaKey.current = solanaKeyStr;
    }
  }, [solanaPublicKey, walletType, disconnectWallet]);

  // Listen for Arweave wallet switch events
  useEffect(() => {
    if (typeof window === "undefined" || !window.arweaveWallet) return;

    const handleWalletSwitch = async (
      event: CustomEvent<{ address: string }>
    ) => {
      console.log("🔄 Arweave wallet switched:", event.detail);

      if (walletType === "arweave") {
        const newAddress = event.detail.address;
        if (newAddress && newAddress !== walletAddress) {
          // Reset Arweave Turbo client
          resetTurboClients();
          useFoodGlobeStore.getState().setWallet("arweave", newAddress);
        }
      }
    };

    // Wander/ArConnect dispatch this event
    window.addEventListener(
      "walletSwitch",
      handleWalletSwitch as unknown as EventListener
    );

    return () => {
      window.removeEventListener(
        "walletSwitch",
        handleWalletSwitch as unknown as EventListener
      );
    };
  }, [walletType, walletAddress]);

  // Also listen for direct MetaMask events (for wallets that don't go through wagmi properly)
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔄 MetaMask accountsChanged event:", accounts);

      if (walletType === "ethereum") {
        clearEthereumTurboClientCache();

        if (accounts.length === 0) {
          disconnectWallet();
          resetTurboClients();
        } else if (accounts[0].toLowerCase() !== walletAddress?.toLowerCase()) {
          useFoodGlobeStore.getState().setWallet("ethereum", accounts[0]);
        }
      }
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, [walletType, walletAddress, disconnectWallet]);
}
