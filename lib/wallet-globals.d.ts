// types/global.d.ts
// Global type declarations for wallet providers

interface Window {
  // Arweave wallet (Wander/ArConnect)
  arweaveWallet?: {
    connect(permissions: string[]): Promise<void>;
    disconnect(): Promise<void>;
    getActiveAddress(): Promise<string>;
    getActivePublicKey(): Promise<string>;
    getPermissions?(): Promise<string[]>;
    sign(transaction: any): Promise<any>;
    signDataItem(dataItem: any): Promise<ArrayBufferLike>;
    dispatch(transaction: any): Promise<any>;
    walletName?: string;
    walletVersion?: string;
  };

  // Ethereum wallet (MetaMask, Rainbow, etc.)
  ethereum?: {
    request(args: { method: string; params?: any[] }): Promise<any>;
    on(event: string, handler: (...args: any[]) => void): void;
    removeListener(event: string, handler: (...args: any[]) => void): void;
    isMetaMask?: boolean;
    isRainbow?: boolean;
  };

  // Solana wallet (Phantom, Solflare, etc.)
  solana?: {
    connect(): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    publicKey: {
      toString(): string;
      toBytes(): Uint8Array;
    };
    isConnected?: boolean;
    isPhantom?: boolean;
  };
}
