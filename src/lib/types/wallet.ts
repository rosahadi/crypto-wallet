export interface NetworkStatus {
  isConnected: boolean;
  blockNumber: number;
  gasPrice: string;
  name: string;
  explorerUrl: string;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  formattedBalance?: string;
  price?: number;
  value?: number;
  logoURI?: string;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  collection?: string;
  tokenType?: "ERC-721" | "ERC-1155";
  amount?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Represents a native cryptocurrency (like ETH for Ethereum)
 */
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Configuration for a blockchain network
 */
export interface NetworkConfig {
  id: number;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  explorerApiKey: string;
  nativeCurrency: NativeCurrency;
}

export interface WalletOpResult {
  success: boolean;
  message: string;
  data?: {
    txHash?: string;
    address?: string;
    [key: string]: unknown;
  };
  redirect?: string;
  requiresAuth?: boolean;
}

export interface DerivedAddress {
  address: string;
  index: number;
  label?: string;
  isDefault?: boolean;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  timestamp: number;
  status: "pending" | "success" | "failed";
  data?: string;
  nonce?: number;
  type?: string;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: string;
  isIncoming?: boolean;
  tokenTransfers?: {
    token: string;
    from: string;
    to: string;
    value: string;
    symbol?: string;
    decimals?: number;
  }[];
}

export interface WalletData {
  address: string;
  ethBalance: string;
  formattedEthBalance: string;
  tokens: Token[];
  nfts: NFT[];
  transactions: TransactionData[];
  network: NetworkConfig | null;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: unknown[];
  logsBloom: string;
  status: string;
  type: string;
}

export interface NFTData {
  tokenId: string;
  contractAddress: string;
  name: string;
  collection: string;
  tokenType: "ERC-721" | "ERC-1155";
  decimals?: number;
  amount?: string;
  description?: string;
  imageUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  externalUrl?: string;
}

export interface RawTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  gasUsed: string;
  gasPrice: string;
  nonce: string;
  input: string;
  isError: string;
  txreceipt_status: string;
}

export interface StoredWallet {
  address: string;
  encryptedMnemonic: string;
  createdAt: number;
  lastAccessAt: number;
}

export interface WalletAuthData {
  address: string;
  mnemonic: string;
  networkId?: number;
}

export interface NetworkFeeData {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface TransactionResult {
  success: boolean;
  message?: string;
  txHash?: string;
  address?: string;
}

export interface NetworkFee {
  eth: string;
  wei: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
