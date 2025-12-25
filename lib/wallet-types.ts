// lib/wallet-types.ts
// Shared type definitions for wallet and interaction data

/**
 * Supported wallet types
 */
export type WalletType = "arweave" | "ethereum" | "solana" | null;

/**
 * Interaction types that can be stored on Arweave
 */
export type InteractionType =
  | "recommendation"
  | "like"
  | "unlike"
  | "comment"
  | "profile";

/**
 * Recommendation data structure
 */
export interface RecommendationData {
  category: string;
  dietaryTags?: string[];
  caption?: string;
  rating?: number;
  // Add any additional fields your app needs
}

/**
 * Like/Unlike data structure
 */
export interface LikeData {
  action: "like" | "unlike";
}

/**
 * Comment data structure
 */
export interface CommentData {
  text: string;
  timestamp: string;
}

/**
 * User profile data structure
 */
export interface ProfileData {
  username?: string;
  walletAddress: string;
  bio?: string;
  avatar?: string;
  // Add any additional profile fields your app needs
}
