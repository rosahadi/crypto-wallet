import React from "react";
import {
  Grid,
  ImageIcon,
  ExternalLink,
  Hash,
  Package,
  Copy,
  CheckCircle,
  Eye,
} from "lucide-react";
import { WalletData, NFT } from "@/lib/types/wallet";
import Image from "next/image";
import { useState } from "react";

interface NFTsTabProps {
  walletData: WalletData;
}

export default function NFTsTab({
  walletData,
}: NFTsTabProps) {
  const [copiedTokenId, setCopiedTokenId] = useState<
    string | null
  >(null);
  const [imageErrors, setImageErrors] = useState<
    Set<string>
  >(new Set());

  const copyToClipboard = async (tokenId: string) => {
    await navigator.clipboard.writeText(tokenId);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleImageError = (nftKey: string) => {
    setImageErrors((prev) => new Set([...prev, nftKey]));
  };

  const getOpenSeaUrl = (
    nft: NFT,
    networkName?: string
  ) => {
    const networkMap: { [key: string]: string } = {
      "Ethereum Mainnet": "ethereum",
      Polygon: "matic",
      Arbitrum: "arbitrum",
      Optimism: "optimism",
      Avalanche: "avalanche",
      BSC: "bsc",
      Klaytn: "klaytn",
      Solana: "solana",
      Sepolia: "sepolia",
      Goerli: "goerli",
      Mumbai: "mumbai",
    };

    const chain =
      networkMap[networkName || "Ethereum Mainnet"] ||
      "ethereum";
    const baseUrl = [
      "sepolia",
      "goerli",
      "mumbai",
    ].includes(chain)
      ? "https://testnets.opensea.io"
      : "https://opensea.io";

    return `${baseUrl}/assets/${chain}/${nft.contractAddress}/${nft.tokenId}`;
  };

  const getTokenTypeColor = (tokenType?: string) => {
    switch (tokenType) {
      case "ERC-721":
        return "text-crypto-cyan";
      case "ERC-1155":
        return "text-crypto-purple";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  const getTokenTypeBg = (tokenType?: string) => {
    switch (tokenType) {
      case "ERC-721":
        return "bg-[rgba(6,182,212,0.2)]";
      case "ERC-1155":
        return "bg-[rgba(139,92,246,0.2)]";
      default:
        return "bg-[var(--bg-accent)]";
    }
  };

  const formatAmount = (amount?: string) => {
    if (!amount || amount === "0" || amount === "1")
      return null;

    try {
      const bigIntAmount = BigInt(amount);
      return bigIntAmount.toString();
    } catch {
      return amount;
    }
  };

  if (!walletData.nfts) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-crypto-cyan mx-auto mb-4"></div>
        <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
          Loading NFTs...
        </h3>
        <p>Fetching your NFT collection</p>
      </div>
    );
  }

  if (walletData.nfts.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <Grid className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
          No NFTs found
        </h3>
        <p>Your NFT collection will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {walletData.nfts.map((nft: NFT) => {
          const nftKey = `${nft.contractAddress}-${nft.tokenId}`;
          const formattedAmount = formatAmount(nft.amount);
          const hasImageError = imageErrors.has(nftKey);

          return (
            <div
              key={nftKey}
              className="bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors overflow-hidden border border-[var(--border-primary)]"
            >
              {/* NFT Image Container */}
              <div className="relative aspect-square bg-[var(--bg-tertiary)] overflow-hidden">
                {nft.imageUrl && !hasImageError ? (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.name || "NFT"}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(nftKey)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-[var(--text-muted)]" />
                  </div>
                )}

                {/* Token Type Badge */}
                {nft.tokenType && (
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getTokenTypeBg(
                        nft.tokenType
                      )} ${getTokenTypeColor(
                        nft.tokenType
                      )}`}
                    >
                      {nft.tokenType}
                    </span>
                  </div>
                )}

                {/* Amount Badge for ERC-1155 */}
                {formattedAmount && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-[rgba(16,185,129,0.2)] text-crypto-emerald px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {formattedAmount}
                    </span>
                  </div>
                )}
              </div>

              {/* NFT Details */}
              <div className="p-6 space-y-3">
                {/* Name and Collection */}
                <div>
                  <h3 className="font-medium text-[var(--text-primary)] truncate">
                    {nft.name || "Unnamed NFT"}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {nft.collection || "Unknown Collection"}
                  </p>
                </div>

                {/* Token ID with copy function */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-[var(--text-secondary)]">
                    <Hash className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      #{nft.tokenId}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(nft.tokenId)
                    }
                    className="text-crypto-cyan hover:text-crypto-blue transition-colors"
                  >
                    {copiedTokenId === nft.tokenId ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Description */}
                {nft.description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {nft.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <a
                    href={getOpenSeaUrl(
                      nft,
                      walletData.network?.name
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs bg-crypto-gradient hover:opacity-80 text-[var(--text-primary)] transition-opacity py-2 px-3 rounded flex items-center justify-center"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    OpenSea
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>

                  <a
                    href={`${walletData.network?.explorerUrl}/token/${nft.contractAddress}?a=${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors py-2 px-3 rounded flex items-center justify-center border border-[var(--border-secondary)]"
                  >
                    Explorer
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
