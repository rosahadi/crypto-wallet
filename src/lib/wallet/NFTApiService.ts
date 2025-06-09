import axios from "axios";
import { NFTData } from "../types/wallet";
import { BaseService } from "./BaseService";

export class NFTApiService extends BaseService {
  private explorerApiUrl: string;
  private explorerApiKey: string;

  constructor(
    explorerApiUrl: string,
    rpcUrl: string,
    explorerApiKey: string = ""
  ) {
    super(rpcUrl);
    this.explorerApiUrl = explorerApiUrl;
    this.explorerApiKey = explorerApiKey;
  }

  /**
   * Gets NFT holdings for an address using blockchain explorer API
   * Supports both ERC-721 and ERC-1155 tokens with metadata fetching
   * @param address - The address to query for NFTs
   * @returns Array of NFT data with images and metadata
   */
  async getNFTs(address: string): Promise<NFTData[]> {
    if (!address) {
      throw new Error("Address is required");
    }

    if (!this.explorerApiUrl) {
      throw new Error("Explorer API URL not set");
    }

    try {
      const apiKey = this.explorerApiKey || "";
      const nftMap = new Map<string, NFTData>();

      const erc721Url = `${
        this.explorerApiUrl
      }/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=desc${
        apiKey ? `&apikey=${apiKey}` : ""
      }`;

      const erc721Response = await axios.get(erc721Url, {
        timeout: 30000,
        headers: {
          Accept: "application/json",
        },
      });

      if (
        erc721Response.data.status === "1" &&
        Array.isArray(erc721Response.data.result)
      ) {
        await this.processNFTTransactions(
          erc721Response.data.result,
          address,
          nftMap,
          "ERC-721"
        );
      }

      // Fetch ERC-1155 NFT transactions
      const erc1155Url = `${
        this.explorerApiUrl
      }/api?module=account&action=token1155tx&address=${address}&startblock=0&endblock=99999999&sort=desc${
        apiKey ? `&apikey=${apiKey}` : ""
      }`;

      const erc1155Response = await axios.get(erc1155Url, {
        timeout: 30000,
        headers: {
          // Remove User-Agent header
          Accept: "application/json",
        },
      });

      if (
        erc1155Response.data.status === "1" &&
        Array.isArray(erc1155Response.data.result)
      ) {
        await this.processNFTTransactions(
          erc1155Response.data.result,
          address,
          nftMap,
          "ERC-1155"
        );
      }

      await this.fetchNFTBalances(address, nftMap);

      const nfts = Array.from(nftMap.values());

      const nftsWithMetadata = await this.fetchNFTMetadata(
        nfts
      );

      return nftsWithMetadata;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("API Error") ||
          error.message.includes("not set")
        ) {
          throw error;
        }
        throw new Error(
          `Failed to fetch NFTs: ${error.message}`
        );
      }

      return [];
    }
  }

  /**
   * Fetches metadata for an array of NFTs including images
   * @param nfts - Array of NFT data without metadata
   * @returns Array of NFT data with metadata
   */
  private async fetchNFTMetadata(
    nfts: NFTData[]
  ): Promise<NFTData[]> {
    const nftsWithMetadata: NFTData[] = [];

    const batchSize = 5;

    for (let i = 0; i < nfts.length; i += batchSize) {
      const batch = nfts.slice(i, i + batchSize);
      const batchPromises = batch.map((nft) =>
        this.fetchSingleNFTMetadata(nft)
      );

      try {
        const batchResults = await Promise.allSettled(
          batchPromises
        );

        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            nftsWithMetadata.push(result.value);
          } else {
            nftsWithMetadata.push(batch[index]);
          }
        });

        if (i + batchSize < nfts.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000)
          );
        }
      } catch {
        nftsWithMetadata.push(...batch);
      }
    }

    return nftsWithMetadata;
  }

  /**
   * Fetches metadata for a single NFT
   * @param nft - NFT data without metadata
   * @returns NFT data with metadata
   */
  private async fetchSingleNFTMetadata(
    nft: NFTData
  ): Promise<NFTData> {
    try {
      const tokenURI = await this.getTokenURI(
        nft.contractAddress,
        nft.tokenId,
        nft.tokenType
      );

      if (!tokenURI) {
        return nft;
      }

      const metadata = await this.fetchMetadataFromURI(
        tokenURI
      );

      if (metadata) {
        return {
          ...nft,
          name: metadata.name || nft.name,
          description: metadata.description,
          imageUrl: this.resolveImageURL(metadata.image),
          attributes: metadata.attributes,
          externalUrl: metadata.external_url,
        };
      }

      return nft;
    } catch {
      return nft;
    }
  }

  /**
   * Gets the tokenURI for an NFT from its contract
   * @param contractAddress - The NFT contract address
   * @param tokenId - The token ID
   * @param tokenType - The token type (ERC-721 or ERC-1155)
   * @returns The tokenURI or null if not found
   */
  private async getTokenURI(
    contractAddress: string,
    tokenId: string,
    tokenType: "ERC-721" | "ERC-1155"
  ): Promise<string | null> {
    try {
      let methodSignature: string;
      let data: string;

      if (tokenType === "ERC-721") {
        methodSignature = "0xc87b56dd";
        const paddedTokenId = BigInt(tokenId)
          .toString(16)
          .padStart(64, "0");
        data = `${methodSignature}${paddedTokenId}`;
      } else {
        methodSignature = "0x0e89341c";
        const paddedTokenId = BigInt(tokenId)
          .toString(16)
          .padStart(64, "0");
        data = `${methodSignature}${paddedTokenId}`;
      }

      const result = await this.callRPC<string>(
        "eth_call",
        [
          {
            to: contractAddress,
            data: data,
          },
          "latest",
        ]
      );

      if (!result || result === "0x") {
        return null;
      }

      const uri = this.parseContractString(result);
      return uri || null;
    } catch {
      return null;
    }
  }

  /**
   * Parses a string returned from a smart contract call
   * @param hexString - The hex string returned from the contract
   * @returns The parsed string
   */
  private parseContractString(hexString: string): string {
    try {
      const hex = hexString.startsWith("0x")
        ? hexString.slice(2)
        : hexString;

      if (hex.length < 128) {
        return "";
      }

      // Skip the first 32 bytes (offset) and get the length from the next 32 bytes
      const lengthHex = hex.substring(64, 128);
      const length = parseInt(lengthHex, 16);

      if (length === 0) {
        return "";
      }

      const stringHex = hex.substring(
        128,
        128 + length * 2
      );

      // Convert hex to string
      let result = "";
      for (let i = 0; i < stringHex.length; i += 2) {
        const byte = stringHex.substring(i, i + 2);
        if (byte !== "00") {
          result += String.fromCharCode(parseInt(byte, 16));
        }
      }

      return result;
    } catch {
      return "";
    }
  }

  /**
   * Fetches metadata from a given URI
   * @param uri - The metadata URI
   * @returns The metadata object or null
   */
  private async fetchMetadataFromURI(
    uri: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any | null> {
    try {
      let fetchUrl = uri;

      if (uri.startsWith("ipfs://")) {
        fetchUrl = uri.replace(
          "ipfs://",
          "https://ipfs.io/ipfs/"
        );
      } else if (
        uri.startsWith("Qm") &&
        uri.length === 46
      ) {
        // Direct IPFS hash
        fetchUrl = `https://ipfs.io/ipfs/${uri}`;
      }

      // Handle data URIs
      if (uri.startsWith("data:application/json;base64,")) {
        const base64Data = uri.split(",")[1];
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      }

      if (uri.startsWith("data:application/json;utf8,")) {
        const jsonString = decodeURIComponent(
          uri.split(",")[1]
        );
        return JSON.parse(jsonString);
      }

      if (uri.startsWith("data:application/json,")) {
        const jsonString = decodeURIComponent(
          uri.split(",")[1]
        );
        return JSON.parse(jsonString);
      }

      const response = await axios.get(fetchUrl, {
        timeout: 10000,
        headers: {
          // Remove User-Agent header
          Accept: "application/json",
        },
      });

      if (
        response.data &&
        typeof response.data === "object"
      ) {
        return response.data;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves and normalizes image URLs from metadata
   * @param imageUrl - The image URL from metadata
   * @returns The resolved image URL or undefined
   */
  private resolveImageURL(
    imageUrl?: string
  ): string | undefined {
    if (!imageUrl) {
      return undefined;
    }

    if (imageUrl.startsWith("ipfs://")) {
      return imageUrl.replace(
        "ipfs://",
        "https://ipfs.io/ipfs/"
      );
    }

    if (
      imageUrl.startsWith("Qm") &&
      imageUrl.length === 46
    ) {
      return `https://ipfs.io/ipfs/${imageUrl}`;
    }

    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return `https://ipfs.io${imageUrl}`;
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `https://ipfs.io/ipfs/${imageUrl}`;
  }

  /**
   * Helper method to process NFT transactions and update the NFT map
   * @param transactions - Array of NFT transactions
   * @param targetAddress - The address we're checking
   * @param nftMap - Map to store current NFT ownership
   * @param tokenType - Type of token (ERC-721 or ERC-1155)
   */
  private async processNFTTransactions(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactions: any[],
    targetAddress: string,
    nftMap: Map<string, NFTData>,
    tokenType: "ERC-721" | "ERC-1155"
  ): Promise<void> {
    const sortedTransactions = transactions.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) => {
        const blockDiff =
          parseInt(a.blockNumber) - parseInt(b.blockNumber);
        if (blockDiff !== 0) return blockDiff;
        return (
          parseInt(a.transactionIndex) -
          parseInt(b.transactionIndex)
        );
      }
    );

    for (const tx of sortedTransactions) {
      const key = `${tx.contractAddress.toLowerCase()}-${
        tx.tokenID
      }`;
      const isReceived =
        tx.to.toLowerCase() === targetAddress.toLowerCase();
      const isSent =
        tx.from.toLowerCase() ===
        targetAddress.toLowerCase();

      if (isReceived) {
        const nftData: NFTData = {
          tokenId: tx.tokenID,
          contractAddress: tx.contractAddress,
          name: tx.tokenName || "Unknown NFT",
          collection:
            tx.tokenSymbol || "Unknown Collection",
          tokenType: tokenType,
          ...(tx.tokenDecimal && {
            decimals: parseInt(tx.tokenDecimal),
          }),
          ...(tx.tokenValue && {
            amount: tx.tokenValue, // For ERC-1155 tokens
          }),
        };

        if (tokenType === "ERC-1155" && tx.tokenValue) {
          const existingNFT = nftMap.get(key);
          if (existingNFT && existingNFT.amount) {
            nftData.amount = (
              BigInt(existingNFT.amount) +
              BigInt(tx.tokenValue)
            ).toString();
          }
        }

        nftMap.set(key, nftData);
      } else if (isSent) {
        if (tokenType === "ERC-1155" && tx.tokenValue) {
          const existingNFT = nftMap.get(key);
          if (existingNFT && existingNFT.amount) {
            const newAmount =
              BigInt(existingNFT.amount) -
              BigInt(tx.tokenValue);
            if (newAmount <= 0n) {
              nftMap.delete(key);
            } else {
              existingNFT.amount = newAmount.toString();
              nftMap.set(key, existingNFT);
            }
          }
        } else {
          // For ERC-721, remove completely
          if (nftMap.has(key)) {
            nftMap.delete(key);
          }
        }
      }
    }
  }

  /**
   * Helper method to fetch NFT balances using additional API endpoints
   * @param targetAddress - The address to check
   * @param nftMap - Map to store NFT data
   */
  private async fetchNFTBalances(
    targetAddress: string,
    nftMap: Map<string, NFTData>
  ): Promise<void> {
    const apiKey = this.explorerApiKey || "";

    try {
      const balanceUrl = `${
        this.explorerApiUrl
      }/api?module=account&action=tokenlist&address=${targetAddress}${
        apiKey ? `&apikey=${apiKey}` : ""
      }`;

      const response = await axios.get(balanceUrl, {
        timeout: 30000,
        headers: {
          // Remove User-Agent header
          Accept: "application/json",
        },
      });

      if (
        response.data.status === "1" &&
        Array.isArray(response.data.result)
      ) {
        for (const token of response.data.result) {
          // Check if this might be an NFT (typically have type field or specific patterns)
          if (
            token.type === "ERC-721" ||
            token.type === "ERC-1155"
          ) {
            const key = `${token.contractAddress.toLowerCase()}-${
              token.tokenID || "0"
            }`;

            const nftData: NFTData = {
              tokenId: token.tokenID || "0",
              contractAddress: token.contractAddress,
              name: token.name || "Unknown NFT",
              collection:
                token.symbol || "Unknown Collection",
              tokenType: token.type as
                | "ERC-721"
                | "ERC-1155",
              ...(token.balance &&
                token.type === "ERC-1155" && {
                  amount: token.balance,
                }),
            };

            nftMap.set(key, nftData);
          }
        }
      }
    } catch (error) {
      console.warn(
        "Failed to fetch additional NFT balances:",
        error
      );
    }
  }
}
