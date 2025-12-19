// lib/wallet-types.ts

// Which blockchain wallet is connected
export type WalletType = "arweave" | "ethereum" | "solana" | null;

// Connection state
export interface WalletState {
  walletType: WalletType;
  walletAddress: string | null;
  isConnecting: boolean;
  isWalletModalOpen: boolean;
}

// Arweave transaction types
export type InteractionType = "recommendation" | "like" | "unlike" | "comment";

// What we store in each Arweave transaction
export interface RecommendationData {
  caption: string;
  category: string;
  dietaryTags: string[];
}

export interface LikeData {
  action: "like" | "unlike";
}

export interface CommentData {
  text: string;
  timestamp: string;
}

// Cached user interactions (derived from Arweave queries)
export interface UserInteractions {
  likes: Record<string, boolean>; // placeId → true/false
  comments: Record<string, string[]>; // placeId → array of comment tx IDs
}

// Tags we attach to every Arweave transaction
export interface ArweaveTags {
  "App-Name": string;
  "Place-ID": string;
  Type: InteractionType;
  Author: string;
  "Author-Chain": WalletType;
  Timestamp: string;
  "Content-Type": string;
}
