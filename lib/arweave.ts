// lib/arweave.ts
// Arweave upload service using Turbo SDK

import { TurboFactory, ArconnectSigner } from "@ardrive/turbo-sdk/web";
import type { TurboAuthenticatedClient } from "@ardrive/turbo-sdk/web";
import type {
  InteractionType,
  RecommendationData,
  LikeData,
  CommentData,
  WalletType,
} from "./wallet-types";

// App identifier for all our transactions
const APP_NAME = "Food-Globe";

// Singleton Turbo client
let turboClient: TurboAuthenticatedClient | null = null;

/**
 * Required permissions for Wander wallet
 * ACCESS_PUBLIC_KEY and SIGNATURE are required for Turbo SDK's ArconnectSigner
 */
export const ARWEAVE_PERMISSIONS = [
  "ACCESS_ADDRESS",
  "ACCESS_PUBLIC_KEY",
  "SIGN_TRANSACTION",
  "SIGNATURE",
  "DISPATCH",
] as const;

type ArweavePermission = (typeof ARWEAVE_PERMISSIONS)[number];

/**
 * Check and request missing permissions
 * Returns true if all permissions are granted
 */
export async function ensurePermissions(): Promise<boolean> {
  if (!window.arweaveWallet) {
    throw new Error("Arweave wallet not available. Please connect Wander.");
  }

  try {
    // Get current permissions
    const currentPermissions = await window.arweaveWallet.getPermissions();
    console.log("📋 Current permissions:", currentPermissions);

    // Find missing permissions
    const missingPermissions = ARWEAVE_PERMISSIONS.filter(
      (p) => !currentPermissions.includes(p)
    );

    if (missingPermissions.length === 0) {
      console.log("✅ All permissions already granted");
      return true;
    }

    console.log("⚠️ Missing permissions:", missingPermissions);

    // Request missing permissions
    await window.arweaveWallet.connect(
      missingPermissions as ArweavePermission[],
      {
        name: "Food Globe",
        logo: "https://food-globe.vercel.app/icon-192x192.png",
      }
    );

    console.log("✅ Additional permissions granted");
    return true;
  } catch (error) {
    console.error("❌ Failed to get/request permissions:", error);
    throw error;
  }
}

/**
 * Initialize or get the Turbo client
 * Only works with Arweave wallet (Wander)
 */
export async function getTurboClient(): Promise<TurboAuthenticatedClient> {
  if (turboClient) {
    return turboClient;
  }

  if (!window.arweaveWallet) {
    throw new Error("Arweave wallet not available. Please connect Wander.");
  }

  // Ensure we have all required permissions before creating client
  await ensurePermissions();

  // Create signer from the injected wallet
  const signer = new ArconnectSigner(window.arweaveWallet);

  // Initialize authenticated Turbo client
  turboClient = TurboFactory.authenticated({ signer });

  return turboClient;
}

/**
 * Reset the Turbo client (call on wallet disconnect)
 */
export function resetTurboClient(): void {
  turboClient = null;
}

/**
 * Check if user has sufficient balance for upload
 */
export async function checkBalance(): Promise<{
  hasBalance: boolean;
  balanceInWinc: string;
}> {
  const turbo = await getTurboClient();
  const balance = await turbo.getBalance();

  return {
    hasBalance: BigInt(balance.winc) > BigInt(0),
    balanceInWinc: balance.winc,
  };
}

/**
 * Create standard tags for all Food Globe transactions
 */
function createBaseTags(
  placeId: string,
  type: InteractionType,
  author: string,
  authorChain: WalletType
): { name: string; value: string }[] {
  return [
    { name: "App-Name", value: APP_NAME },
    { name: "Place-ID", value: placeId },
    { name: "Type", value: type },
    { name: "Author", value: author },
    { name: "Author-Chain", value: authorChain || "arweave" },
    { name: "Timestamp", value: new Date().toISOString() },
    { name: "Content-Type", value: "application/json" },
  ];
}

/**
 * Upload a recommendation to Arweave
 */
export async function uploadRecommendation(
  placeId: string,
  data: RecommendationData,
  author: string,
  authorChain: WalletType = "arweave"
): Promise<{ id: string; owner: string }> {
  const turbo = await getTurboClient();

  const tags = createBaseTags(placeId, "recommendation", author, authorChain);

  // Add recommendation-specific tags for easier querying
  tags.push({ name: "Category", value: data.category });
  if (data.dietaryTags.length > 0) {
    tags.push({ name: "Dietary-Tags", value: data.dietaryTags.join(",") });
  }

  const jsonData = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(jsonData);

  const result = await turbo.upload({
    data: dataBuffer,
    dataItemOpts: { tags },
  });

  console.log("✅ Recommendation uploaded:", result.id);
  return { id: result.id, owner: result.owner };
}

/**
 * Upload a like/unlike action to Arweave
 */
export async function uploadLikeAction(
  placeId: string,
  action: "like" | "unlike",
  author: string,
  authorChain: WalletType = "arweave"
): Promise<{ id: string; owner: string }> {
  const turbo = await getTurboClient();

  const type: InteractionType = action === "like" ? "like" : "unlike";
  const tags = createBaseTags(placeId, type, author, authorChain);

  const likeData: LikeData = { action };
  const jsonData = JSON.stringify(likeData);
  const dataBuffer = new TextEncoder().encode(jsonData);

  const result = await turbo.upload({
    data: dataBuffer,
    dataItemOpts: { tags },
  });

  console.log(`✅ ${action} uploaded:`, result.id);
  return { id: result.id, owner: result.owner };
}

/**
 * Upload a comment to Arweave
 */
export async function uploadComment(
  placeId: string,
  text: string,
  author: string,
  authorChain: WalletType = "arweave"
): Promise<{ id: string; owner: string }> {
  const turbo = await getTurboClient();

  const tags = createBaseTags(placeId, "comment", author, authorChain);

  const commentData: CommentData = {
    text,
    timestamp: new Date().toISOString(),
  };
  const jsonData = JSON.stringify(commentData);
  const dataBuffer = new TextEncoder().encode(jsonData);

  const result = await turbo.upload({
    data: dataBuffer,
    dataItemOpts: { tags },
  });

  console.log("✅ Comment uploaded:", result.id);
  return { id: result.id, owner: result.owner };
}

/**
 * Get the cost estimate for an upload (in Winston)
 */
export async function getUploadCost(dataSizeBytes: number): Promise<string> {
  const turbo = await getTurboClient();
  const [{ winc }] = await turbo.getUploadCosts({ bytes: [dataSizeBytes] });
  return winc;
}
