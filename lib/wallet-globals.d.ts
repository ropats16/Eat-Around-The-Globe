// lib/wallet-globals.d.ts

// Arweave Wallet (Wander / ArConnect)
interface ArweaveWallet {
  connect: (
    permissions: string[],
    appInfo?: { name?: string; logo?: string }
  ) => Promise<void>;
  disconnect: () => Promise<void>;
  getActiveAddress: () => Promise<string>;
  getActivePublicKey: () => Promise<string>;
  sign: (
    transaction: unknown,
    options?: { saltLength?: number }
  ) => Promise<unknown>;
  signature: (
    data: Uint8Array,
    options?: { name?: string; saltLength?: number }
  ) => Promise<Uint8Array>;
  getPermissions: () => Promise<string[]>;
}

// Ethereum Wallet (MetaMask)
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    callback: (...args: unknown[]) => void
  ) => void;
}

// Solana Wallet (Phantom)
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: { toString: () => string } | null;
  isConnected: boolean;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding?: string
  ) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: unknown) => Promise<unknown>;
  signAllTransactions: (transactions: unknown[]) => Promise<unknown[]>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

// Extend the Window interface
declare global {
  interface Window {
    arweaveWallet?: ArweaveWallet;
    ethereum?: EthereumProvider;
    solana?: PhantomProvider;
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

export {};
