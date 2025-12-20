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

  console.log("🔍 [SOLANA SIGNER] Analyzing provider:", {
    type: typeof walletProvider,
    keys: walletProvider ? Object.keys(walletProvider as object) : [],
    isObject: walletProvider !== null && typeof walletProvider === "object",
  });

  const originalProvider = walletProvider as {
    publicKey?: unknown;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    signTransaction?: (transaction: unknown) => Promise<unknown>;
    request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
    features?: unknown;
    chains?: unknown;
  };

  // Check if there's a nested wallet object (Reown wraps the actual wallet)
  const providerWithWallet = originalProvider as {
    wallet?: unknown;
    provider?: unknown;
  };

  console.log("🔍 [SOLANA SIGNER] Provider info:", {
    hasPublicKey: !!originalProvider.publicKey,
    hasSignMessage: typeof originalProvider.signMessage === "function",
    hasSignTransaction: typeof originalProvider.signTransaction === "function",
    hasRequest: typeof originalProvider.request === "function",
    publicKeyType: typeof originalProvider.publicKey,
    hasWallet: !!providerWithWallet.wallet,
    hasProvider: !!providerWithWallet.provider,
    hasFeatures: !!originalProvider.features,
    hasChains: !!originalProvider.chains,
  });

  // Log wallet features if available
  if (originalProvider.features) {
    const features = originalProvider.features as Record<string, unknown>;
    console.log("🔍 [SOLANA SIGNER] Wallet features:", {
      type: typeof features,
      keys: Object.keys(features),
      features: features,
    });
  }

  // If there's a nested wallet or provider, log its structure
  if (providerWithWallet.wallet) {
    const wallet = providerWithWallet.wallet as Record<string, unknown>;
    console.log("🔍 [SOLANA SIGNER] Nested wallet found:", {
      type: typeof wallet,
      keys: Object.keys(wallet),
      hasSignMessage: typeof wallet.signMessage === "function",
      hasPublicKey: !!wallet.publicKey,
    });
  }

  if (providerWithWallet.provider) {
    const nestedProvider = providerWithWallet.provider as Record<string, unknown>;
    console.log("🔍 [SOLANA SIGNER] Nested provider found:", {
      type: typeof nestedProvider,
      keys: Object.keys(nestedProvider),
      hasSignMessage: typeof nestedProvider.signMessage === "function",
      hasPublicKey: !!nestedProvider.publicKey,
    });
  }

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
          console.log("🔑 [SOLANA SIGNER] Using publicKey.toBytes()");
          return Buffer.from(pk.toBytes());
        }
        // Fallback: try to convert the public key directly
        console.log(
          "🔑 [SOLANA SIGNER] No toBytes() method, trying direct conversion"
        );
        return Buffer.from(pk as Uint8Array);
      },
    },
    signMessage: async (message: Uint8Array) => {
      console.log("✍️ [SOLANA SIGNER] signMessage called", {
        messageLength: message.length,
        messagePreview: Buffer.from(message.slice(0, 32)).toString("hex"),
      });

      // Try using request method with solana_signMessage first
      // This is the recommended way for WalletConnect/Reown
      if (originalProvider.request) {
        try {
          console.log("🔐 [SOLANA SIGNER] Attempting solana_signMessage via request()...");
          const result = (await originalProvider.request({
            method: "solana_signMessage",
            params: {
              message: Buffer.from(message).toString("base64"),
            },
          })) as { signature: string };

          console.log("✅ [SOLANA SIGNER] solana_signMessage succeeded");
          // Result should be base64 encoded signature, convert to Uint8Array
          const signature = Buffer.from(result.signature, "base64");
          console.log("🔑 [SOLANA SIGNER] Signature length:", signature.length);
          return signature;
        } catch (requestError) {
          console.error(
            "❌ [SOLANA SIGNER] solana_signMessage via request() failed:",
            requestError
          );

          // Fall back to direct signMessage if request fails
          if (originalProvider.signMessage) {
            console.log("🔄 [SOLANA SIGNER] Falling back to provider.signMessage()...");
            try {
              const result = await originalProvider.signMessage(message);
              console.log("✅ [SOLANA SIGNER] provider.signMessage() succeeded");
              return result.signature;
            } catch (signMessageError) {
              console.error(
                "❌ [SOLANA SIGNER] provider.signMessage() also failed:",
                signMessageError
              );
              throw signMessageError;
            }
          }

          throw requestError;
        }
      }

      // If no request method, try signMessage directly
      if (originalProvider.signMessage) {
        console.log("🔐 [SOLANA SIGNER] Attempting provider.signMessage()...");
        const result = await originalProvider.signMessage(message);
        console.log("✅ [SOLANA SIGNER] signMessage returned, processing...");

        // The result should be { signature: Uint8Array } according to the interface
        // But let's handle various possible formats defensively

        // Case 1: result has a signature property
        if (result && typeof result === "object" && "signature" in result) {
          const sig = (result as { signature: unknown }).signature;
          console.log("🔍 [SOLANA SIGNER] Has signature property, type:", typeof sig, "isUint8Array:", sig instanceof Uint8Array);

          // If it's already a Uint8Array, return it
          if (sig instanceof Uint8Array) {
            console.log("✅ [SOLANA SIGNER] Signature is Uint8Array, length:", sig.length);
            return sig;
          }

          // If it's a Buffer (Node.js), convert to Uint8Array
          if (Buffer.isBuffer(sig)) {
            console.log("🔄 [SOLANA SIGNER] Signature is Buffer, converting...");
            return new Uint8Array(sig);
          }

          // If it's an array or array-like object, convert it
          if (typeof sig === "object" && sig !== null && "length" in sig) {
            console.log("🔄 [SOLANA SIGNER] Signature is array-like, converting...");
            return Uint8Array.from(sig as ArrayLike<number>);
          }
        }

        // Case 2: result IS the signature directly (Uint8Array)
        if (result instanceof Uint8Array) {
          console.log("✅ [SOLANA SIGNER] Result IS Uint8Array, length:", result.length);
          return result;
        }

        // Case 3: result is a Buffer
        if (Buffer.isBuffer(result)) {
          console.log("🔄 [SOLANA SIGNER] Result is Buffer, converting...");
          return new Uint8Array(result);
        }

        console.error("❌ [SOLANA SIGNER] Unexpected signature format! Type:", typeof result);
        console.error("❌ [SOLANA SIGNER] Result:", result);
        throw new Error("Signature is not in expected format (Uint8Array)");
      }

      throw new Error("Provider does not support message signing");
    },
  };

  console.log("🔐 [SOLANA SIGNER] Creating InjectedSolanaSigner with wrapped provider...");
  try {
    const signer = new InjectedSolanaSigner(wrappedProvider);
    console.log("✅ [SOLANA SIGNER] InjectedSolanaSigner created successfully");

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
  console.log("📤 [UPLOAD RECOMMENDATION] Starting upload:", {
    placeId,
    data,
    walletType: config.walletType,
    walletAddress: config.walletAddress,
  });

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

  console.log("🏷️ [UPLOAD RECOMMENDATION] Tags:", tags);

  const dataItem = await createSignedDataItem(signer, data, tags);
  const result = await uploadDataItem(dataItem);

  console.log("✅ [UPLOAD RECOMMENDATION] Upload complete:", {
    txId: result.id,
    placeId,
    walletType: config.walletType,
  });

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
    console.log("🔍 Fetching profile for:", walletAddress);

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
      console.log("ℹ️ No profile found for:", walletAddress);
      return null;
    }

    const txId = edges[0].node.id;
    const tags = edges[0].node.tags;
    console.log("✅ [PROFILE FETCH] Found profile transaction:", {
      txId,
      tags,
    });

    // Fetch the actual data
    const dataResponse = await fetch(`https://arweave.net/${txId}`);
    const profileData: ProfileData = await dataResponse.json();

    console.log("✅ [PROFILE FETCH] Profile loaded:", {
      profileData,
      queriedAddress: walletAddress,
    });
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
