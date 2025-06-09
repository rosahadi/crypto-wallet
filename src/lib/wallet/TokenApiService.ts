import axios from "axios";
import { Token } from "../types/wallet";
import { BaseService } from "./BaseService";

export class TokenApiService extends BaseService {
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
   * Gets token balance for a specific token contract
   * @param tokenAddress - The token contract address
   * @param holderAddress - The address to check balance for
   * @returns Token balance as string
   */
  async getTokenBalance(
    tokenAddress: string,
    holderAddress: string
  ): Promise<string> {
    const data = `0x70a08231000000000000000000000000${holderAddress
      .slice(2)
      .toLowerCase()}`;

    try {
      const result = await this.callRPC<string>(
        "eth_call",
        [{ to: tokenAddress, data: data }, "latest"]
      );

      const balanceBigInt = BigInt(result);
      return balanceBigInt.toString();
    } catch {
      return "0";
    }
  }

  /**
   * Gets token metadata (name, symbol, decimals)
   * @param tokenAddress - The token contract address
   * @returns Token metadata object
   */
  async getTokenMetadata(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    const nameSignature = "0x06fdde03";
    const symbolSignature = "0x95d89b41";
    const decimalsSignature = "0x313ce567";

    try {
      const nameResult = await this.callRPC<string>(
        "eth_call",
        [
          { to: tokenAddress, data: nameSignature },
          "latest",
        ]
      );

      const symbolResult = await this.callRPC<string>(
        "eth_call",
        [
          { to: tokenAddress, data: symbolSignature },
          "latest",
        ]
      );

      const decimalsResult = await this.callRPC<string>(
        "eth_call",
        [
          { to: tokenAddress, data: decimalsSignature },
          "latest",
        ]
      );

      const parseHexString = (hexStr: string): string => {
        const dataStart = 2 + 2 * 32;
        const lengthHex = hexStr.substring(
          dataStart,
          dataStart + 64
        );
        const length = parseInt(lengthHex, 16);
        const stringData = hexStr.substring(
          dataStart + 64,
          dataStart + 64 + length * 2
        );

        let result = "";
        for (let i = 0; i < stringData.length; i += 2) {
          result += String.fromCharCode(
            parseInt(stringData.substring(i, i + 2), 16)
          );
        }

        return result;
      };

      return {
        name: parseHexString(nameResult),
        symbol: parseHexString(symbolResult),
        decimals: parseInt(decimalsResult.slice(-2), 16),
      };
    } catch {
      return {
        name: "Unknown Token",
        symbol: "???",
        decimals: 18,
      };
    }
  }

  /**
   * Gets all tokens held by an address
   * @param address - The address to query tokens for
   * @returns Array of Token objects with balances
   */
  async getTokens(address: string): Promise<Token[]> {
    if (!this.explorerApiUrl) {
      throw new Error("Explorer API URL not set");
    }

    try {
      const apiKey = this.explorerApiKey || "";
      const url = `${
        this.explorerApiUrl
      }/api?module=account&action=tokenlist&address=${address}${
        apiKey ? `&apikey=${apiKey}` : ""
      }`;

      const response = await axios.get(url);

      if (response.data.status !== "1") {
        return [];
      }

      if (
        !response.data.result ||
        !Array.isArray(response.data.result)
      ) {
        return [];
      }

      const tokens = response.data.result
        .filter((token: Token) => {
          const balance = BigInt(token.balance || "0");
          return balance > 0n;
        })
        .map((token: Token) => ({
          address: token.address,
          name: token.name || "Unknown Token",
          symbol: token.symbol || "???",
          decimals: token.decimals || 18,
          balance: token.balance,
        }));

      return tokens;
    } catch {
      return [];
    }
  }

  /**
   * Creates token transfer transaction data
   * @param to - Recipient address
   * @param amount - Amount to transfer (in token's smallest unit)
   * @returns Encoded transaction data for token transfer
   */
  createTokenTransferData(
    to: string,
    amount: bigint
  ): string {
    const methodId = "0xa9059cbb";
    const encodedAddress = to.startsWith("0x")
      ? to.slice(2).toLowerCase()
      : to.toLowerCase();
    const paddedAddress = encodedAddress.padStart(64, "0");
    const encodedAmount = amount
      .toString(16)
      .padStart(64, "0");

    return `${methodId}${paddedAddress}${encodedAmount}`;
  }
}
