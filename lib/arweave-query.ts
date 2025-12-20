// lib/arweave-query.ts
// Query Arweave for Eat Around The Globe interactions using GraphQL

import type {
  InteractionType,
  RecommendationData,
  LikeData,
  CommentData,
  WalletType,
} from "./wallet-types";

// Arweave GraphQL endpoint
const ARWEAVE_GQL_ENDPOINT = "https://arweave.net/graphql";
const ARWEAVE_GATEWAY = "https://arweave.net";

// App identifier
const APP_NAME = "Eat-Around-The-Globe";

// Transaction node from GraphQL
interface TransactionEdge {
  node: {
    id: string;
    owner: { address: string };
    tags: { name: string; value: string }[];
    block?: { timestamp: number };
  };
}

// Parsed interaction from Arweave
export interface ArweaveInteraction {
  id: string;
  type: InteractionType;
  placeId: string;
  author: string;
  authorChain: WalletType;
  timestamp: string;
  blockTimestamp?: number;
}

export interface ParsedRecommendation extends ArweaveInteraction {
  type: "recommendation";
  data: RecommendationData;
}

export interface ParsedLike extends ArweaveInteraction {
  type: "like" | "unlike";
  data: LikeData;
}

export interface ParsedComment extends ArweaveInteraction {
  type: "comment";
  data: CommentData;
}

/**
 * GraphQL query to fetch transactions by Place-ID
 */
const QUERY_BY_PLACE_ID = `
  query GetInteractionsByPlace($placeId: String!, $appName: String!, $first: Int, $after: String) {
    transactions(
      tags: [
        { name: "App-Name", values: [$appName] }
        { name: "Place-ID", values: [$placeId] }
      ]
      first: $first
      after: $after
      sort: HEIGHT_DESC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          owner { address }
          tags { name value }
          block { timestamp }
        }
      }
    }
  }
`;

/**
 * GraphQL query to fetch transactions by author and type
 */
const QUERY_BY_AUTHOR = `
  query GetInteractionsByAuthor($author: String!, $appName: String!, $type: String, $first: Int, $after: String) {
    transactions(
      tags: [
        { name: "App-Name", values: [$appName] }
        { name: "Author", values: [$author] }
        ${`{ name: "Type", values: [$type] }`}
      ]
      first: $first
      after: $after
      sort: HEIGHT_DESC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          owner { address }
          tags { name value }
          block { timestamp }
        }
      }
    }
  }
`;

/**
 * GraphQL query to fetch all recommendations
 */
const QUERY_ALL_RECOMMENDATIONS = `
  query GetAllRecommendations($appName: String!, $first: Int, $after: String) {
    transactions(
      tags: [
        { name: "App-Name", values: [$appName] }
        { name: "Type", values: ["recommendation"] }
      ]
      first: $first
      after: $after
      sort: HEIGHT_DESC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          owner { address }
          tags { name value }
          block { timestamp }
        }
      }
    }
  }
`;

/**
 * Execute a GraphQL query against Arweave
 */
async function executeQuery<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(ARWEAVE_GQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Fetch transaction data from Arweave gateway
 */
async function fetchTransactionData<T>(txId: string): Promise<T> {
  const response = await fetch(`${ARWEAVE_GATEWAY}/${txId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch transaction data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse tags from a transaction into a map
 */
function parseTags(
  tags: { name: string; value: string }[]
): Record<string, string> {
  return tags.reduce(
    (acc, tag) => ({ ...acc, [tag.name]: tag.value }),
    {} as Record<string, string>
  );
}

/**
 * Get all interactions for a place
 */
export async function getPlaceInteractions(
  placeId: string,
  limit = 100
): Promise<{
  recommendations: ParsedRecommendation[];
  likes: ParsedLike[];
  comments: ParsedComment[];
}> {
  const data = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_BY_PLACE_ID, {
    placeId,
    appName: APP_NAME,
    first: limit,
  });

  const recommendations: ParsedRecommendation[] = [];
  const likes: ParsedLike[] = [];
  const comments: ParsedComment[] = [];

  for (const edge of data.transactions.edges) {
    const { node } = edge;
    const tagMap = parseTags(node.tags);
    const type = tagMap["Type"] as InteractionType;

    const baseInteraction: ArweaveInteraction = {
      id: node.id,
      type,
      placeId: tagMap["Place-ID"],
      author: tagMap["Author"],
      authorChain: tagMap["Author-Chain"] as WalletType,
      timestamp: tagMap["Timestamp"],
      blockTimestamp: node.block?.timestamp,
    };

    try {
      if (type === "recommendation") {
        const txData = await fetchTransactionData<RecommendationData>(node.id);
        recommendations.push({
          ...baseInteraction,
          type: "recommendation",
          data: txData,
        });
      } else if (type === "like" || type === "unlike") {
        const txData = await fetchTransactionData<LikeData>(node.id);
        likes.push({
          ...baseInteraction,
          type,
          data: txData,
        });
      } else if (type === "comment") {
        const txData = await fetchTransactionData<CommentData>(node.id);
        comments.push({
          ...baseInteraction,
          type: "comment",
          data: txData,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch data for tx ${node.id}:`, err);
    }
  }

  return { recommendations, likes, comments };
}

/**
 * Get user's like status for a place (latest wins)
 */
export async function getUserLikeStatus(
  placeId: string,
  userAddress: string
): Promise<boolean | null> {
  const data = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_BY_PLACE_ID, {
    placeId,
    appName: APP_NAME,
    first: 50,
  });

  // Filter to only like/unlike from this user
  const userLikes = data.transactions.edges
    .filter((edge) => {
      const tagMap = parseTags(edge.node.tags);
      return (
        tagMap["Author"] === userAddress &&
        (tagMap["Type"] === "like" || tagMap["Type"] === "unlike")
      );
    })
    .sort((a, b) => {
      // Sort by timestamp descending (latest first)
      const aTime = a.node.block?.timestamp || 0;
      const bTime = b.node.block?.timestamp || 0;
      return bTime - aTime;
    });

  if (userLikes.length === 0) {
    return null; // User has never liked/unliked
  }

  // Latest transaction determines current state
  const latestTags = parseTags(userLikes[0].node.tags);
  return latestTags["Type"] === "like";
}

/**
 * Get like count for a place (count unique users who have liked and not unliked)
 */
export async function getPlaceLikeCount(placeId: string): Promise<number> {
  const data = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_BY_PLACE_ID, {
    placeId,
    appName: APP_NAME,
    first: 500,
  });

  // Group by author and find their latest like/unlike status
  const userStatuses = new Map<string, { type: string; timestamp: number }>();

  for (const edge of data.transactions.edges) {
    const tagMap = parseTags(edge.node.tags);
    const type = tagMap["Type"];
    const author = tagMap["Author"];

    if (type !== "like" && type !== "unlike") continue;

    const timestamp = edge.node.block?.timestamp || 0;
    const existing = userStatuses.get(author);

    if (!existing || timestamp > existing.timestamp) {
      userStatuses.set(author, { type, timestamp });
    }
  }

  // Count users whose latest action is "like"
  let likeCount = 0;
  for (const status of userStatuses.values()) {
    if (status.type === "like") {
      likeCount++;
    }
  }

  return likeCount;
}

/**
 * Get all likes/unlikes by a user across all places
 */
export async function getUserLikes(
  userAddress: string
): Promise<Record<string, boolean>> {
  const data = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_BY_AUTHOR, {
    author: userAddress,
    appName: APP_NAME,
    type: "like",
    first: 500,
  });

  // Also fetch unlikes
  const unlikeData = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_BY_AUTHOR, {
    author: userAddress,
    appName: APP_NAME,
    type: "unlike",
    first: 500,
  });

  // Combine and sort by timestamp
  const allLikeActions = [
    ...data.transactions.edges,
    ...unlikeData.transactions.edges,
  ].sort((a, b) => {
    const aTime = a.node.block?.timestamp || 0;
    const bTime = b.node.block?.timestamp || 0;
    return bTime - aTime;
  });

  // Group by placeId, latest wins
  const likesByPlace: Record<string, boolean> = {};
  const processedPlaces = new Set<string>();

  for (const edge of allLikeActions) {
    const tagMap = parseTags(edge.node.tags);
    const placeId = tagMap["Place-ID"];

    if (processedPlaces.has(placeId)) continue;

    likesByPlace[placeId] = tagMap["Type"] === "like";
    processedPlaces.add(placeId);
  }

  return likesByPlace;
}

/**
 * Fetch ALL recommendations from Arweave (for initial app load)
 * Returns parsed recommendations with their data
 */
export async function getAllRecommendations(
  limit = 100
): Promise<ParsedRecommendation[]> {
  console.log("🔍 Fetching all recommendations from Arweave...");

  const data = await executeQuery<{
    transactions: { edges: TransactionEdge[] };
  }>(QUERY_ALL_RECOMMENDATIONS, {
    appName: APP_NAME,
    first: limit,
  });

  console.log(
    `📦 Found ${data.transactions.edges.length} recommendation transactions`
  );

  const recommendations: ParsedRecommendation[] = [];

  for (const edge of data.transactions.edges) {
    const { node } = edge;
    const tagMap = parseTags(node.tags);

    try {
      const txData = await fetchTransactionData<RecommendationData>(node.id);

      recommendations.push({
        id: node.id,
        type: "recommendation",
        placeId: tagMap["Place-ID"],
        author: tagMap["Author"],
        authorChain: tagMap["Author-Chain"] as WalletType,
        timestamp: tagMap["Timestamp"],
        blockTimestamp: node.block?.timestamp,
        data: txData,
      });
    } catch (err) {
      console.warn(
        `Failed to fetch data for recommendation tx ${node.id}:`,
        err
      );
    }
  }

  console.log(
    `✅ Successfully parsed ${recommendations.length} recommendations`
  );
  return recommendations;
}
