// lib/arweave.ts
// Arweave utility functions and constants
// For queries, use arweave-query.ts
// For uploads, use the useArweaveUpload hook

import type { ProfileData } from "./wallet-types";

// App identifier for all transactions
export const APP_NAME = "Eat-Around-The-Globe";

// Arweave permissions needed for Wander wallet
export const ARWEAVE_PERMISSIONS = [
  "ACCESS_ADDRESS",
  "ACCESS_PUBLIC_KEY",
  "SIGN_TRANSACTION",
  "SIGNATURE",
  "DISPATCH",
] as const;

export const UPLOAD_URL = "https://upload.ardrive.io";
export const ARWEAVE_GATEWAY = "https://arweave.net";

/**
 * Ensure Arweave wallet has required permissions
 */
export async function ensureArweavePermissions(): Promise<void> {
  if (!window.arweaveWallet) {
    throw new Error("Wander wallet not available");
  }

  try {
    const currentPermissions =
      (await window.arweaveWallet.getPermissions?.()) || [];
    const missingPermissions = ARWEAVE_PERMISSIONS.filter(
      (p) => !currentPermissions.includes(p)
    );

    if (missingPermissions.length > 0) {
      await window.arweaveWallet.connect([...ARWEAVE_PERMISSIONS]);
    }
  } catch (error) {
    console.error("Failed to ensure Arweave permissions:", error);
    throw new Error("Please connect Wander wallet and approve permissions");
  }
}

/**
 * Fetch the latest user profile from Arweave
 * Tries both checksummed and lowercase address for Ethereum compatibility
 */
export async function fetchUserProfile(
  walletAddress: string
): Promise<ProfileData | null> {
  const isEthereumAddress =
    walletAddress.startsWith("0x") && walletAddress.length === 42;
  const addressesToTry = isEthereumAddress
    ? [walletAddress, walletAddress.toLowerCase()]
    : [walletAddress];

  for (const addressToQuery of addressesToTry) {
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

      const response = await fetch(`${ARWEAVE_GATEWAY}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { author: addressToQuery },
        }),
      });

      const result = await response.json();
      const edges = result.data?.transactions?.edges || [];

      if (edges.length === 0) {
        continue; // Try next address format
      }

      const txId = edges[0].node.id;

      // Fetch the actual data
      const dataResponse = await fetch(`${ARWEAVE_GATEWAY}/${txId}`);
      const profileData: ProfileData = await dataResponse.json();

      return profileData;
    } catch {
      // Continue to next address format on error
    }
  }

  return null;
}

// Re-export resetTurboClients for convenience
export { resetTurboClients } from "@/hooks/useArweaveUpload";
