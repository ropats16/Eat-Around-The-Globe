// hooks/useEthereumTurboClient.ts
// Ethereum Turbo client using walletAdapter pattern
//
// Uses the Turbo SDK's built-in walletAdapter support instead of InjectedEthereumSigner
// from @ar.io/sdk. This avoids version-specific issues with InjectedEthereumSigner.

import { useCallback, useRef } from "react";
import { TurboFactory, TurboAuthenticatedClient } from "@ardrive/turbo-sdk/web";
import { ethers } from "ethers";
import { useAccount, useConfig } from "wagmi";
import { getConnectorClient } from "wagmi/actions";
import type { Config as WagmiConfig, Connector } from "wagmi";

// Cache structure
interface CachedEthereumClient {
  client: TurboAuthenticatedClient;
  ethersSigner: ethers.JsonRpcSigner;
  address: string;
  wagmiConfig: WagmiConfig;
  connector: Connector;
}

// Module-level cache
let clientCache: CachedEthereumClient | null = null;

export function clearEthereumTurboClientCache() {
  clientCache = null;
  console.log("🧹 Cleared Ethereum Turbo client cache");
}

export function useEthereumTurboClient() {
  const wagmiConfig = useConfig();
  const ethAccount = useAccount();
  const creatingRef = useRef<Promise<TurboAuthenticatedClient> | null>(null);

  const createEthereumTurboClient =
    useCallback(async (): Promise<TurboAuthenticatedClient> => {
      // Check cache - use wagmi's address as the source of truth
      const expectedAddress = ethAccount.address;

      if (
        clientCache &&
        expectedAddress &&
        clientCache.address.toLowerCase() === expectedAddress.toLowerCase()
      ) {
        console.log("✅ Using cached Ethereum Turbo client");
        return clientCache.client;
      }

      // Prevent duplicate creation
      if (creatingRef.current) {
        return creatingRef.current;
      }

      const createClient = async (): Promise<TurboAuthenticatedClient> => {
        if (
          !ethAccount.isConnected ||
          !ethAccount.connector ||
          !ethAccount.address
        ) {
          throw new Error("Ethereum wallet not connected");
        }

        // Use wagmi's address as the source of truth
        const userAddress = ethAccount.address;

        console.log("🔐 Creating Ethereum Turbo client...");
        console.log("   Connector:", ethAccount.connector.name);
        console.log("   Address:", userAddress);

        // Get the viem wallet client from wagmi
        const connectorClient = await getConnectorClient(wagmiConfig, {
          connector: ethAccount.connector,
        });

        // Create ethers provider from the connector's transport
        // This is the pattern from the working turbo-app implementation
        const ethersProvider = new ethers.BrowserProvider(
          connectorClient.transport,
          "any"
        );
        const ethersSigner = await ethersProvider.getSigner();

        const signerAddress = await ethersSigner.getAddress();
        console.log("📝 Got ethers signer for address:", signerAddress);

        // Verify address matches what wagmi reports
        if (signerAddress.toLowerCase() !== userAddress.toLowerCase()) {
          console.warn("⚠️ Address mismatch between wagmi and ethers signer:", {
            wagmi: userAddress,
            ethers: signerAddress,
          });
        }

        // Use walletAdapter pattern - this lets the Turbo SDK handle signing internally
        // This avoids issues with InjectedEthereumSigner from @ar.io/sdk
        console.log("🔧 Creating Turbo client with walletAdapter pattern...");

        const client = TurboFactory.authenticated({
          token: "ethereum",
          walletAdapter: {
            getSigner: () => ethersSigner,
          },
        });

        // Cache client
        clientCache = {
          client,
          ethersSigner,
          address: userAddress,
          wagmiConfig,
          connector: ethAccount.connector,
        };

        console.log("✅ Ethereum Turbo client created with walletAdapter");

        return client;
      };

      creatingRef.current = createClient();

      try {
        return await creatingRef.current;
      } finally {
        creatingRef.current = null;
      }
    }, [
      wagmiConfig,
      ethAccount.isConnected,
      ethAccount.connector,
      ethAccount.address,
    ]);

  return {
    createEthereumTurboClient,
    clearCache: clearEthereumTurboClientCache,
    isConnected: ethAccount.isConnected,
    address: ethAccount.address,
    connectorName: ethAccount.connector?.name,
  };
}
