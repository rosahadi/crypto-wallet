import axios, { AxiosResponse } from "axios";
import { Token } from "../types/wallet";
import { BaseService } from "./BaseService";

class RateLimiter {
  private queue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private minInterval: number;

  constructor(callsPerSecond: number = 2) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise((resolve) =>
          setTimeout(resolve, this.minInterval)
        );
      }
    }

    this.isProcessing = false;
  }
}

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

interface ExplorerApiResponse {
  status: string;
  message: string;
  result: TokenTransaction[] | string;
}

interface TokenTransaction {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  from: string;
  to: string;
  value: string;
  hash: string;
  blockNumber: string;
  timeStamp: string;
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export class TokenApiService extends BaseService {
  private explorerApiUrl: string;
  private explorerApiKey: string;
  private rateLimiter: RateLimiter;

  constructor(
    explorerApiUrl: string,
    rpcUrl: string,
    explorerApiKey: string = ""
  ) {
    super(rpcUrl);
    this.explorerApiUrl = explorerApiUrl;
    this.explorerApiKey = explorerApiKey;
    this.rateLimiter = new RateLimiter(1.5);
  }

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

  async getTokenMetadata(
    tokenAddress: string
  ): Promise<TokenMetadata> {
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

  private async makeApiCall(
    url: string
  ): Promise<ExplorerApiResponse> {
    return this.rateLimiter.add(async () => {
      const response: AxiosResponse<ExplorerApiResponse> =
        await axios.get(url);
      return response.data;
    });
  }

  async getTokens(address: string): Promise<Token[]> {
    if (!this.explorerApiUrl) {
      throw new Error("Explorer API URL not set");
    }

    try {
      const apiKey = this.explorerApiKey || "";

      const url = `${
        this.explorerApiUrl
      }/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=desc${
        apiKey ? `&apikey=${apiKey}` : ""
      }`;

      const data = await this.makeApiCall(url);

      if (data.status !== "1") {
        if (data.message === "NOTOK") {
          if (
            typeof data.result === "string" &&
            data.result.includes("rate limit")
          ) {
            await new Promise((resolve) =>
              setTimeout(resolve, 2000)
            );
            return [];
          }
          if (
            typeof data.result === "string" &&
            data.result.includes("No transactions found")
          ) {
            return [];
          }
        }

        return [];
      }

      if (!data.result || !Array.isArray(data.result)) {
        return [];
      }

      const uniqueTokens = new Map<string, TokenInfo>();

      for (const tx of data.result) {
        if (
          tx.contractAddress &&
          !uniqueTokens.has(tx.contractAddress)
        ) {
          uniqueTokens.set(tx.contractAddress, {
            address: tx.contractAddress,
            name: tx.tokenName || "Unknown Token",
            symbol: tx.tokenSymbol || "???",
            decimals: parseInt(tx.tokenDecimal) || 18,
          });
        }
      }

      const tokensWithBalances =
        await this.getTokenBalancesBatch(
          Array.from(uniqueTokens.values()),
          address
        );

      const tokens = tokensWithBalances.filter((token) => {
        try {
          const balance = BigInt(token.balance || "0");
          return balance > 0n;
        } catch {
          return false;
        }
      });

      return tokens;
    } catch {
      return [];
    }
  }

  private async getTokenBalancesBatch(
    tokens: TokenInfo[],
    address: string
  ): Promise<Token[]> {
    const results: Token[] = [];

    const batchSize = 5;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (token) => {
          try {
            const balance = await this.getTokenBalance(
              token.address,
              address
            );
            return {
              ...token,
              balance,
            };
          } catch {
            return {
              ...token,
              balance: "0",
            };
          }
        })
      );

      results.push(...batchResults);

      if (i + batchSize < tokens.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }
    }

    return results;
  }

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
