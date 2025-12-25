// hooks/useArweaveUpload.ts
// Consolidated Arweave upload hook with multi-wallet support

"use client";

import { useCallback } from "react";
import { TurboFactory, TurboAuthenticatedClient } from "@ardrive/turbo-sdk/web";
import { ArconnectSigner } from "@ar.io/sdk/web";
import { useFoodGlobeStore } from "@/lib/store";
import {
  useEthereumTurboClient,
  clearEthereumTurboClientCache,
} from "./useEthereumTurboClient";
import { useAccount } from "wagmi";
import type { ProfileData, RecommendationData } from "@/lib/wallet-types";

// App identifier for all transactions
const APP_NAME = "Eat-Around-The-Globe";

// Arweave permissions needed for Wander wallet
const ARWEAVE_PERMISSIONS = [
  "ACCESS_ADDRESS",
  "ACCESS_PUBLIC_KEY",
  "SIGN_TRANSACTION",
  "SIGNATURE",
  "DISPATCH",
];

// Types
interface Tag {
  name: string;
  value: string;
}

interface PlaceInfo {
  name: string;
  country: string;
  countryCode: string;
  city: string;
  address?: string;
}

// Solana Turbo client cache
let cachedSolanaTurboClient: TurboAuthenticatedClient | null = null;
let cachedSolanaAddress: string | null = null;

// Arweave Turbo client cache
let cachedArweaveTurboClient: TurboAuthenticatedClient | null = null;
let cachedArweaveAddress: string | null = null;

/**
 * Reset ALL Turbo client caches (Ethereum, Arweave, Solana)
 * Call this on wallet disconnect
 */
export function resetTurboClients(): void {
  // Clear Ethereum cache
  clearEthereumTurboClientCache();

  // Clear Solana cache
  cachedSolanaTurboClient = null;
  cachedSolanaAddress = null;

  // Clear Arweave cache
  cachedArweaveTurboClient = null;
  cachedArweaveAddress = null;

  console.log("🧹 Reset all Turbo clients");
}

/**
 * Create Solana Turbo client using wallet adapter
 */
async function createSolanaTurboClient(
  address: string
): Promise<TurboAuthenticatedClient> {
  if (cachedSolanaTurboClient && cachedSolanaAddress === address) {
    return cachedSolanaTurboClient;
  }

  if (!window.solana) {
    throw new Error("Solana wallet not available");
  }

  // Use walletAdapter which is the correct approach for Turbo SDK with Solana
  const client = TurboFactory.authenticated({
    token: "solana",
    walletAdapter: window.solana,
  });

  cachedSolanaTurboClient = client;
  cachedSolanaAddress = address;

  return client;
}

/**
 * Create Arweave Turbo client (for Wander wallet)
 */
async function createArweaveTurboClient(
  address: string
): Promise<TurboAuthenticatedClient> {
  if (cachedArweaveTurboClient && cachedArweaveAddress === address) {
    return cachedArweaveTurboClient;
  }

  if (!window.arweaveWallet) {
    throw new Error("Wander wallet not available");
  }

  // Ensure permissions
  const currentPermissions =
    (await window.arweaveWallet.getPermissions?.()) || [];
  const missingPermissions = ARWEAVE_PERMISSIONS.filter(
    (p) => !currentPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    await window.arweaveWallet.connect(ARWEAVE_PERMISSIONS);
  }

  const signer = new ArconnectSigner(window.arweaveWallet);

  const client = TurboFactory.authenticated({
    signer,
    token: "arweave",
  });

  cachedArweaveTurboClient = client;
  cachedArweaveAddress = address;

  return client;
}

/**
 * Create base tags for all uploads
 */
function createBaseTags(
  placeId: string,
  type: string,
  authorAddress: string,
  authorChain: string | null
): Tag[] {
  return [
    { name: "App-Name", value: APP_NAME },
    { name: "Type", value: type },
    { name: "Place-ID", value: placeId },
    { name: "Author", value: authorAddress },
    { name: "Author-Chain", value: authorChain || "unknown" },
    { name: "Version", value: new Date().toISOString() },
    { name: "Content-Type", value: "application/json" },
  ];
}

/**
 * Main hook for Arweave uploads
 */
export function useArweaveUpload() {
  const { walletAddress, walletType, userProfile } = useFoodGlobeStore();
  const { createEthereumTurboClient, connectorName } = useEthereumTurboClient();
  const ethAccount = useAccount();

  /**
   * Get or create Turbo client based on current wallet type
   */
  const getTurboClient =
    useCallback(async (): Promise<TurboAuthenticatedClient> => {
      if (!walletType || !walletAddress) {
        throw new Error("No wallet connected");
      }

      switch (walletType) {
        case "ethereum":
          // Check for Rainbow wallet - uploads not yet supported
          const walletName = connectorName || ethAccount.connector?.name;
          if (walletName === "Rainbow") {
            throw new Error(
              "Rainbow wallet uploads coming soon! Please use MetaMask for now. We're working on full Rainbow support."
            );
          }
          return createEthereumTurboClient();

        case "arweave":
          return createArweaveTurboClient(walletAddress);

        case "solana":
          return createSolanaTurboClient(walletAddress);

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    }, [
      walletType,
      walletAddress,
      createEthereumTurboClient,
      connectorName,
      ethAccount.connector?.name,
    ]);

  /**
   * Upload JSON data with tags
   */
  const uploadJson = useCallback(
    async (
      data: Record<string, unknown>,
      tags: Tag[]
    ): Promise<{ id: string }> => {
      const turbo = await getTurboClient();

      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], "data.json", { type: "application/json" });

      const result = await turbo.uploadFile({
        file,
        dataItemOpts: { tags },
      });

      console.log(`✅ Upload successful: ${result.id}`);
      return { id: result.id };
    },
    [getTurboClient]
  );

  /**
   * Upload a like/unlike action
   */
  const uploadLike = useCallback(
    async (
      placeId: string,
      action: "like" | "unlike",
      placeInfo?: PlaceInfo
    ): Promise<{ id: string }> => {
      if (!walletAddress || !walletType) {
        throw new Error("Wallet not connected");
      }

      const tags = createBaseTags(placeId, action, walletAddress, walletType);

      // Add username if available
      if (userProfile?.username) {
        tags.push({ name: "User-Name", value: userProfile.username });
      }

      // Add place info
      if (placeInfo) {
        tags.push({ name: "Place-Name", value: placeInfo.name });
        tags.push({ name: "Country", value: placeInfo.country });
        tags.push({ name: "Country-Code", value: placeInfo.countryCode });
        tags.push({ name: "City", value: placeInfo.city });
        if (placeInfo.address) {
          tags.push({ name: "Address", value: placeInfo.address });
        }
      }

      const payload = {
        type: action,
        placeId,
        user: {
          address: walletAddress,
          username: userProfile?.username || "anon",
        },
        place: placeInfo || {},
        timestamp: new Date().toISOString(),
      };

      return uploadJson(payload, tags);
    },
    [walletAddress, walletType, userProfile, uploadJson]
  );

  /**
   * Upload a recommendation
   */
  const uploadRecommendation = useCallback(
    async (
      placeId: string,
      data: RecommendationData,
      placeInfo?: PlaceInfo
    ): Promise<{ id: string }> => {
      if (!walletAddress || !walletType) {
        throw new Error("Wallet not connected");
      }

      const tags = createBaseTags(
        placeId,
        "recommendation",
        walletAddress,
        walletType
      );

      // Add recommendation-specific tags
      tags.push({ name: "Category", value: data.category });

      if (data.dietaryTags && data.dietaryTags.length > 0) {
        tags.push({ name: "Dietary-Tags", value: data.dietaryTags.join(",") });
      }

      if (data.caption?.trim()) {
        tags.push({ name: "Caption", value: data.caption.trim() });
      }

      // Add username if available
      if (userProfile?.username) {
        tags.push({ name: "Recommender-Name", value: userProfile.username });
      }

      // Add place info
      if (placeInfo) {
        tags.push({ name: "Place-Name", value: placeInfo.name });
        tags.push({ name: "Country", value: placeInfo.country });
        tags.push({ name: "Country-Code", value: placeInfo.countryCode });
        tags.push({ name: "City", value: placeInfo.city });
        if (placeInfo.address) {
          tags.push({ name: "Address", value: placeInfo.address });
        }
      }

      const payload = {
        type: "recommendation",
        placeId,
        ...data,
        recommender: {
          address: walletAddress,
          username: userProfile?.username || "anon",
        },
        place: placeInfo || {},
        timestamp: new Date().toISOString(),
      };

      return uploadJson(payload, tags);
    },
    [walletAddress, walletType, userProfile, uploadJson]
  );

  /**
   * Upload a comment
   */
  const uploadComment = useCallback(
    async (
      placeId: string,
      text: string,
      placeInfo?: PlaceInfo
    ): Promise<{ id: string }> => {
      if (!walletAddress || !walletType) {
        throw new Error("Wallet not connected");
      }

      const tags = createBaseTags(
        placeId,
        "comment",
        walletAddress,
        walletType
      );

      // Add username if available
      if (userProfile?.username) {
        tags.push({ name: "User-Name", value: userProfile.username });
      }

      // Add word count for querying
      const wordCount = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      tags.push({ name: "Comment-Word-Count", value: wordCount.toString() });

      // Add place info
      if (placeInfo) {
        tags.push({ name: "Place-Name", value: placeInfo.name });
        tags.push({ name: "Country", value: placeInfo.country });
        tags.push({ name: "Country-Code", value: placeInfo.countryCode });
        tags.push({ name: "City", value: placeInfo.city });
      }

      const payload = {
        type: "comment",
        placeId,
        text,
        user: {
          address: walletAddress,
          username: userProfile?.username || "anon",
        },
        place: placeInfo || {},
        timestamp: new Date().toISOString(),
      };

      return uploadJson(payload, tags);
    },
    [walletAddress, walletType, userProfile, uploadJson]
  );

  /**
   * Upload a user profile
   */
  const uploadProfile = useCallback(
    async (profileData: {
      username: string;
      bio?: string;
      avatar?: string;
    }): Promise<{ id: string }> => {
      if (!walletAddress || !walletType) {
        throw new Error("Wallet not connected");
      }

      const tags: Tag[] = [
        { name: "App-Name", value: APP_NAME },
        { name: "Type", value: "profile" },
        { name: "Author", value: walletAddress },
        { name: "Author-Chain", value: walletType },
        { name: "Version", value: new Date().toISOString() },
        { name: "Content-Type", value: "application/json" },
        { name: "Username", value: profileData.username },
      ];

      const payload = {
        type: "profile",
        walletAddress,
        ...profileData,
        timestamp: new Date().toISOString(),
      };

      return uploadJson(payload, tags);
    },
    [walletAddress, walletType, uploadJson]
  );

  return {
    // Upload functions
    uploadLike,
    uploadRecommendation,
    uploadComment,
    uploadProfile,

    // State
    isReady: !!walletAddress && !!walletType,
    walletAddress,
    walletType,
  };
}

export default useArweaveUpload;
