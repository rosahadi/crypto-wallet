import { NetworkConfig } from "../types/wallet";

const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY || "";
const ETHERSCAN_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY =
  process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY || "";

export const NETWORKS: NetworkConfig[] = [
  {
    id: 1,
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: "https://sepolia.etherscan.io",
    explorerApiUrl: `https://api-sepolia.etherscan.io`,
    explorerApiKey: ETHERSCAN_API_KEY,
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    id: 2,
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: `https://polygon-amoy.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: "https://amoy.polygonscan.com",
    explorerApiUrl: "https://api-amoy.polygonscan.com",
    explorerApiKey: POLYGONSCAN_API_KEY,
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
];

export const WALLET_SESSION_SECRET =
  process.env.WALLET_SESSION_SECRET || "";
export const SESSION_DURATION =
  parseInt(process.env.SESSION_DURATION_HOURS || "3", 10) *
  60 *
  60 *
  1000;
