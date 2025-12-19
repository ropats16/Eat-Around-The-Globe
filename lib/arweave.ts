// lib/arweave.ts
// Arweave upload service with multi-wallet support using arbundles

import {
  createData,
  ArconnectSigner,
  InjectedEthereumSigner,
  InjectedSolanaSigner,
  DataItem,
} from "@dha-team/arbundles";
import type { Signer } from "@dha-team/arbundles";
import type {
  InteractionType,
  RecommendationData,
  LikeData,
  CommentData,
  WalletType,
} from "./wallet-types";

// App identifier for all our transactions
const APP_NAME = "Food-Globe";

// Turbo upload endpoint
const TURBO_UPLOAD_URL = "https://upload.ardrive.io/v1/tx";

/**
 * Required permissions for Wander wallet
 */
export const ARWEAVE_PERMISSIONS = [
  "ACCESS_ADDRESS",
  "ACCESS_PUBLIC_KEY",
  "SIGN_TRANSACTION",
  "SIGNATURE",
  "DISPATCH",
] as const;

type ArweavePermission = (typeof ARWEAVE_PERMISSIONS)[number];

// ═══════════════════════════════════════════════════════════════════════════
// SIGNER CREATION
// ═══════════════════════════════════════════════════════════════════════════

interface SignerConfig {
  walletType: WalletType;
  provider?: unknown; // For ETH/SOL - the wallet provider from AppKit
}

// Cache for initialized signers (to avoid multiple setPublicKey calls)
let cachedArweaveSigner: ArconnectSigner | null = null;
let cachedEthereumSigner: InjectedEthereumSigner | null = null;
let cachedSolanaSigner: InjectedSolanaSigner | null = null;

/**
 * Reset all cached signers (call on wallet disconnect)
 */
export function resetSigners(): void {
  cachedArweaveSigner = null;
  cachedEthereumSigner = null;
  cachedSolanaSigner = null;
}

/**
 * Create a signer based on wallet type
 */
export async function createSigner(config: SignerConfig): Promise<Signer> {
  switch (config.walletType) {
    case "arweave":
      return createArweaveSigner();

    case "ethereum":
      if (!config.provider) {
        throw new Error("Ethereum provider required");
      }
      return createEthereumSigner(config.provider);

    case "solana":
      if (!config.provider) {
        throw new Error("Solana provider required");
      }
      return createSolanaSigner(config.provider);

    default:
      throw new Error(`Unsupported wallet type: ${config.walletType}`);
  }
}

/**
 * Create Arweave signer from Wander extension
 */
async function createArweaveSigner(): Promise<ArconnectSigner> {
  if (cachedArweaveSigner) {
    return cachedArweaveSigner;
  }

  if (!window.arweaveWallet) {
    throw new Error("Wander wallet not available. Please connect Wander.");
  }

  // Ensure permissions
  await ensureArweavePermissions();

  // Create signer
  const signer = new ArconnectSigner(window.arweaveWallet);
  await signer.setPublicKey();

  cachedArweaveSigner = signer;
  return signer;
}

/**
 * Create Ethereum signer from provider (MetaMask, WalletConnect, etc.)
 * Uses ethers v5 Web3Provider
 */
async function createEthereumSigner(
  walletProvider: unknown
): Promise<InjectedEthereumSigner> {
  if (cachedEthereumSigner) {
    return cachedEthereumSigner;
  }

  // InjectedEthereumSigner expects a provider with getSigner() method
  // We need to create a minimal wrapper that provides this
  const providerWrapper = {
    getSigner: () => {
      // The provider from AppKit already has the signer methods we need
      // We need to wrap it to match the expected interface
      const provider = walletProvider as {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };

      return {
        signMessage: async (message: string | Uint8Array): Promise<string> => {
          // Get the current account
          const accounts = (await provider.request({
            method: "eth_accounts",
          })) as string[];
          const account = accounts[0];

          // Convert message to hex if it's bytes
          const messageHex =
            typeof message === "string"
              ? message
              : "0x" + Buffer.from(message).toString("hex");

          // Sign using personal_sign
          const signature = (await provider.request({
            method: "personal_sign",
            params: [messageHex, account],
          })) as string;

          return signature;
        },
        getAddress: async (): Promise<string> => {
          const accounts = (await provider.request({
            method: "eth_accounts",
          })) as string[];
          return accounts[0];
        },
      };
    },
  };

  // Create arbundles signer
  const signer = new InjectedEthereumSigner(providerWrapper);

  // Initialize public key (triggers wallet popup to sign a message)
  console.log(
    "🔐 Initializing Ethereum signer (you may see a signature request)..."
  );
  await signer.setPublicKey();
  console.log("✅ Ethereum signer initialized");

  cachedEthereumSigner = signer;
  return signer;
}

/**
 * Create Solana signer from provider (Phantom, WalletConnect, etc.)
 */
async function createSolanaSigner(
  walletProvider: unknown
): Promise<InjectedSolanaSigner> {
  if (cachedSolanaSigner) {
    return cachedSolanaSigner;
  }

  // InjectedSolanaSigner expects a wallet adapter interface
  const signer = new InjectedSolanaSigner(walletProvider);
  console.log("✅ Solana signer initialized");

  cachedSolanaSigner = signer;
  return signer;
}

/**
 * Ensure Arweave permissions are granted
 */
async function ensureArweavePermissions(): Promise<void> {
  if (!window.arweaveWallet) {
    throw new Error("Arweave wallet not available");
  }

  const currentPermissions = await window.arweaveWallet.getPermissions();
  const missingPermissions = ARWEAVE_PERMISSIONS.filter(
    (p) => !currentPermissions.includes(p)
  );

  if (missingPermissions.length > 0) {
    console.log(
      "⚠️ Requesting missing Arweave permissions:",
      missingPermissions
    );
    await window.arweaveWallet.connect(
      missingPermissions as ArweavePermission[],
      {
        name: "Food Globe",
        logo: "https://food-globe.vercel.app/icon-192x192.png",
      }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA ITEM CREATION & SIGNING
// ═══════════════════════════════════════════════════════════════════════════

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
 * Create and sign a data item
 */
async function createSignedDataItem(
  signer: Signer,
  data: object,
  tags: { name: string; value: string }[]
): Promise<DataItem> {
  const jsonString = JSON.stringify(data);

  // Create data item
  const dataItem = createData(jsonString, signer, { tags });

  // Sign it (triggers wallet popup)
  console.log("✍️ Signing data item...");
  await dataItem.sign(signer);
  console.log("✅ Data item signed, ID:", dataItem.id);

  return dataItem;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD TO ARWEAVE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload a signed data item to Arweave via Turbo
 */
async function uploadDataItem(dataItem: DataItem): Promise<{ id: string }> {
  console.log("📤 Uploading to Arweave...");

  // Get raw bytes and convert to ArrayBuffer for fetch
  const rawData = dataItem.getRaw();
  // Create a new ArrayBuffer and copy the data
  const arrayBuffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData[i];
  }

  const response = await fetch(TURBO_UPLOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Uploaded to Arweave:", result.id);

  return { id: result.id };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API - UPLOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface UploadConfig {
  walletType: WalletType;
  walletAddress: string;
  provider?: unknown; // Required for ETH/SOL
}

/**
 * Upload a recommendation to Arweave
 */
export async function uploadRecommendation(
  placeId: string,
  data: RecommendationData,
  config: UploadConfig
): Promise<{ id: string }> {
  const signer = await createSigner({
    walletType: config.walletType,
    provider: config.provider,
  });

  const tags = createBaseTags(
    placeId,
    "recommendation",
    config.walletAddress,
    config.walletType
  );

  // Add recommendation-specific tags
  tags.push({ name: "Category", value: data.category });
  if (data.dietaryTags.length > 0) {
    tags.push({ name: "Dietary-Tags", value: data.dietaryTags.join(",") });
  }

  const dataItem = await createSignedDataItem(signer, data, tags);
  return uploadDataItem(dataItem);
}

/**
 * Upload a like/unlike action to Arweave
 */
export async function uploadLikeAction(
  placeId: string,
  action: "like" | "unlike",
  config: UploadConfig
): Promise<{ id: string }> {
  const signer = await createSigner({
    walletType: config.walletType,
    provider: config.provider,
  });

  const type: InteractionType = action === "like" ? "like" : "unlike";
  const tags = createBaseTags(
    placeId,
    type,
    config.walletAddress,
    config.walletType
  );

  const likeData: LikeData = { action };
  const dataItem = await createSignedDataItem(signer, likeData, tags);
  return uploadDataItem(dataItem);
}

/**
 * Upload a comment to Arweave
 */
export async function uploadComment(
  placeId: string,
  text: string,
  config: UploadConfig
): Promise<{ id: string }> {
  const signer = await createSigner({
    walletType: config.walletType,
    provider: config.provider,
  });

  const tags = createBaseTags(
    placeId,
    "comment",
    config.walletAddress,
    config.walletType
  );

  const commentData: CommentData = {
    text,
    timestamp: new Date().toISOString(),
  };

  const dataItem = await createSignedDataItem(signer, commentData, tags);
  return uploadDataItem(dataItem);
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY - for existing Arweave-only code
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use uploadRecommendation with config instead
 */
export async function uploadRecommendationLegacy(
  placeId: string,
  data: RecommendationData,
  author: string,
  authorChain: WalletType = "arweave"
): Promise<{ id: string; owner: string }> {
  const result = await uploadRecommendation(placeId, data, {
    walletType: authorChain,
    walletAddress: author,
  });
  return { id: result.id, owner: author };
}
