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
  ProfileData,
} from "./wallet-types";
import type { FoodPlace } from "./types";

// App identifier for all our transactions
const APP_NAME = "Eat-Around-The-Globe";

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
  await signer.setPublicKey();

  cachedEthereumSigner = signer;
  return signer;
}

/**
 * Create Solana signer from provider (Phantom, WalletConnect, etc.)
 *
 * Note: Reown AppKit's Solana provider doesn't support arbitrary message signing.
 * We create a custom wrapper that uses the Solana wallet's signMessage method
 * through the request interface.
 */
async function createSolanaSigner(
  walletProvider: unknown
): Promise<InjectedSolanaSigner> {
  if (cachedSolanaSigner) {
    return cachedSolanaSigner;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIORITY 1: Check for native Phantom browser extension
  // ═══════════════════════════════════════════════════════════════════════
  if (typeof window !== "undefined" && window.solana?.isPhantom) {
    console.log("🟣 [SOLANA SIGNER] Native Phantom detected!");

    // Connect if not already connected
    if (!window.solana.isConnected) {
      console.log("🔗 [SOLANA SIGNER] Connecting to Phantom...");
      await window.solana.connect();
    }

    if (!window.solana.publicKey) {
      throw new Error("Phantom wallet not connected");
    }

    console.log(
      "✅ [SOLANA SIGNER] Phantom connected:",
      window.solana.publicKey.toString()
    );

    // Create wrapper for native Phantom - matches InjectedSolanaSigner interface
    const phantomProvider = {
      publicKey: {
        toBuffer: () => {
          const pk = window.solana!.publicKey! as unknown as {
            toBytes: () => Uint8Array;
          };
          return Buffer.from(pk.toBytes());
        },
      },
      signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
        console.log("✍️ [PHANTOM NATIVE] Signing message...", {
          messageLength: message.length,
        });

        // Use Phantom's native signMessage - per docs: https://docs.phantom.com/solana/signing-a-message
        const result = await window.solana!.signMessage(message, "utf8");

        console.log("✅ [PHANTOM NATIVE] Message signed!", {
          signatureLength: result.signature.length,
        });

        return result.signature;
      },
    };

    const signer = new InjectedSolanaSigner(phantomProvider);
    console.log("✅ [SOLANA SIGNER] Native Phantom signer created");

    cachedSolanaSigner = signer;
    return signer;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIORITY 2: WalletConnect provider (Solflare, etc.)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("🔗 [SOLANA SIGNER] Using WalletConnect provider...");

  const originalProvider = walletProvider as {
    publicKey?: unknown;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    signTransaction?: (transaction: unknown) => Promise<unknown>;
    request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
    features?: unknown;
    chains?: unknown;
  };

  // Get the public key - it should be available on the provider
  if (!originalProvider.publicKey) {
    throw new Error("Provider does not have a publicKey");
  }

  // Create a wrapper that implements the interface InjectedSolanaSigner expects
  const wrappedProvider = {
    publicKey: {
      toBuffer: () => {
        // Convert the public key to buffer format that arbundles expects
        const pk = originalProvider.publicKey as { toBytes?: () => Uint8Array };
        if (pk.toBytes) {
          return Buffer.from(pk.toBytes());
        }
        // Fallback: try to convert the public key directly
        return Buffer.from(pk as Uint8Array);
      },
    },
    signMessage: async (message: Uint8Array) => {
      // Try using request method with solana_signMessage first
      if (originalProvider.request) {
        try {
          const result = (await originalProvider.request({
            method: "solana_signMessage",
            params: {
              message: Buffer.from(message).toString("base64"),
            },
          })) as { signature: string };

          const signature = Buffer.from(result.signature, "base64");
          return signature;
        } catch (requestError) {
          console.error(
            "❌ [SOLANA SIGNER] solana_signMessage via request() failed:",
            requestError
          );
        }
      }

      // Fall back to direct signMessage
      if (originalProvider.signMessage) {
        try {
          const result = await originalProvider.signMessage(message);

          // Cast to unknown to allow runtime type checking across different wallet implementations
          const rawResult: unknown = result;

          // Case 1: result has a signature property
          if (
            rawResult &&
            typeof rawResult === "object" &&
            "signature" in rawResult
          ) {
            const sig = (rawResult as { signature: unknown }).signature;

            if (sig instanceof Uint8Array) {
              return sig;
            }

            if (Buffer.isBuffer(sig)) {
              return new Uint8Array(sig);
            }

            // Handle array-like objects (including {0: x, 1: y, ...} format)
            if (typeof sig === "object" && sig !== null) {
              if ("length" in sig) {
                return Uint8Array.from(sig as ArrayLike<number>);
              }
              // Check if it's an object with numeric keys (like {0: 1, 1: 2, ...})
              const keys = Object.keys(sig);
              if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
                const arr = new Uint8Array(keys.length);
                for (let i = 0; i < keys.length; i++) {
                  arr[i] = (sig as Record<string, number>)[i];
                }
                return arr;
              }
            }

            // If signature is a base64 string
            if (typeof sig === "string") {
              return Uint8Array.from(Buffer.from(sig, "base64"));
            }

            console.error(
              "❌ [SOLANA SIGNER] Unknown signature format in result.signature:",
              sig
            );
            throw new Error(
              `Unknown signature format: ${typeof sig}, constructor: ${
                (sig as { constructor?: { name?: string } })?.constructor?.name
              }`
            );
          }

          // Case 2: result IS the signature directly (some wallets do this)
          if (rawResult instanceof Uint8Array) {
            return rawResult;
          }

          if (Buffer.isBuffer(rawResult)) {
            return new Uint8Array(rawResult);
          }

          console.error(
            "❌ [SOLANA SIGNER] Unexpected result format:",
            rawResult
          );
          throw new Error(
            `Unexpected signMessage result format: ${typeof rawResult}`
          );
        } catch (signMessageError) {
          console.error(
            "❌ [SOLANA SIGNER] provider.signMessage() failed:",
            signMessageError
          );
          throw signMessageError;
        }
      }

      throw new Error("Provider does not support message signing");
    },
  };

  try {
    const signer = new InjectedSolanaSigner(wrappedProvider);
    cachedSolanaSigner = signer;
    return signer;
  } catch (error) {
    console.error("❌ [SOLANA SIGNER] Failed to create signer:", error);
    throw error;
  }
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
    await window.arweaveWallet.connect(
      missingPermissions as ArweavePermission[],
      {
        name: "Eat Around The Globe",
        logo: "https://eat-around-the-globe.vercel.app/globe-w-markers.png",
      }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA ITEM CREATION & SIGNING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create standard tags for all Eat Around The Globe transactions
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
  await dataItem.sign(signer);

  return dataItem;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD TO ARWEAVE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload a signed data item to Arweave via Turbo
 */
async function uploadDataItem(dataItem: DataItem): Promise<{ id: string }> {
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

  return { id: result.id };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API - UPLOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

interface UploadConfig {
  walletType: WalletType;
  walletAddress: string;
  provider?: unknown; // Required for ETH/SOL
  placeInfo?: Pick<
    FoodPlace,
    "name" | "country" | "countryCode" | "city" | "address"
  >; // Optional place information for tags (subset of FoodPlace)
  profileInfo?: Pick<ProfileData, "username">; // Optional profile information for tags (subset of ProfileData)
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

  // Add caption tag if available
  if (data.caption && data.caption.trim()) {
    tags.push({ name: "Caption", value: data.caption.trim() });
  }

  // Add recommender name from profile if available
  if (config.profileInfo?.username) {
    tags.push({ name: "Recommender-Name", value: config.profileInfo.username });
  }

  // Add place information tags (stable data that won't change)
  if (config.placeInfo) {
    tags.push({ name: "Place-Name", value: config.placeInfo.name });
    tags.push({ name: "Country", value: config.placeInfo.country });
    tags.push({ name: "Country-Code", value: config.placeInfo.countryCode });
    tags.push({ name: "City", value: config.placeInfo.city });
    if (config.placeInfo.address) {
      tags.push({ name: "Address", value: config.placeInfo.address });
    }
  }

  const dataItem = await createSignedDataItem(signer, data, tags);
  const result = await uploadDataItem(dataItem);

  return result;
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

  // Add user name from profile if available
  if (config.profileInfo?.username) {
    tags.push({ name: "User-Name", value: config.profileInfo.username });
  }

  // Add place information tags (stable data that won't change)
  if (config.placeInfo) {
    tags.push({ name: "Place-Name", value: config.placeInfo.name });
    tags.push({ name: "Country", value: config.placeInfo.country });
    tags.push({ name: "Country-Code", value: config.placeInfo.countryCode });
    tags.push({ name: "City", value: config.placeInfo.city });
  }

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

  // Add user name from profile if available
  if (config.profileInfo?.username) {
    tags.push({ name: "User-Name", value: config.profileInfo.username });
  }

  // Add place information tags (stable data that won't change)
  if (config.placeInfo) {
    tags.push({ name: "Place-Name", value: config.placeInfo.name });
    tags.push({ name: "Country", value: config.placeInfo.country });
    tags.push({ name: "Country-Code", value: config.placeInfo.countryCode });
    tags.push({ name: "City", value: config.placeInfo.city });
  }

  // Add comment metadata for querying
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  tags.push({ name: "Comment-Word-Count", value: wordCount.toString() });

  const commentData: CommentData = {
    text,
    timestamp: new Date().toISOString(),
  };

  const dataItem = await createSignedDataItem(signer, commentData, tags);
  return uploadDataItem(dataItem);
}

/**
 * Upload a user profile to Arweave
 */
export async function uploadProfile(
  data: ProfileData,
  config: UploadConfig
): Promise<{ id: string }> {
  const signer = await createSigner({
    walletType: config.walletType,
    provider: config.provider,
  });

  // Profile tags - no Place-ID needed
  const tags = [
    { name: "App-Name", value: APP_NAME },
    { name: "Type", value: "profile" as InteractionType },
    { name: "Author", value: config.walletAddress },
    { name: "Author-Chain", value: config.walletType || "arweave" },
    { name: "Version", value: new Date().toISOString() }, // Timestamp for versioning
    { name: "Content-Type", value: "application/json" },
  ];

  // Add username tag for easier querying by username
  if (data.username) {
    tags.push({ name: "Username", value: data.username });
  }

  const dataItem = await createSignedDataItem(signer, data, tags);
  return uploadDataItem(dataItem);
}

/**
 * Fetch the latest user profile from Arweave
 */
export async function fetchUserProfile(
  walletAddress: string
): Promise<ProfileData | null> {
  try {
    const query = `
      query GetUserProfile($author: String!) {
        transactions(
          tags: [
            { name: "App-Name", values: ["${APP_NAME}"] }
            { name: "Type", values: ["profile"] }
            { name: "Author", values: [$author] }
          ]
          sort: HEIGHT_DESC
          first: 1
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://arweave.net/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { author: walletAddress },
      }),
    });

    const result = await response.json();
    const edges = result.data?.transactions?.edges || [];

    if (edges.length === 0) {
      return null;
    }

    const txId = edges[0].node.id;

    // Fetch the actual data
    const dataResponse = await fetch(`https://arweave.net/${txId}`);
    const profileData: ProfileData = await dataResponse.json();

    return profileData;
  } catch (error) {
    console.error("❌ Failed to fetch profile:", error);
    return null;
  }
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
