import { CryptoWallet } from "./CryptoWallet";
import { TransactionService } from "./TransactionApiService";
import { NFTApiService } from "./NFTApiService";
import { TokenApiService } from "./TokenApiService";
import {
  NFTData,
  Token,
  TransactionParams,
  TransactionReceipt,
} from "../types/wallet";

export class ExtendedCryptoWallet extends CryptoWallet {
  private nftService: NFTApiService;
  private tokenService: TokenApiService;
  private transactionService: TransactionService;

  constructor(
    rpcUrl: string,
    explorerApiUrl: string = "",
    explorerApiKey: string = "",
    chainId: number = 11155111
  ) {
    super(rpcUrl, explorerApiUrl, explorerApiKey, chainId);
    this.nftService = new NFTApiService(
      explorerApiUrl,
      rpcUrl,
      explorerApiKey
    );
    this.tokenService = new TokenApiService(
      explorerApiUrl,
      rpcUrl,
      explorerApiKey
    );
    this.transactionService = new TransactionService(
      rpcUrl,
      chainId
    );
  }

  // Transaction Service methods
  async getGasPrice(): Promise<bigint> {
    return this.transactionService.getGasPrice();
  }

  async getFeeData(): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    return this.transactionService.getFeeData();
  }

  async getNextNonce(address?: string): Promise<number> {
    const targetAddress = address || this.getAddress();
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }
    return this.transactionService.getNextNonce(
      targetAddress
    );
  }

  async estimateGas(
    to: string,
    value: bigint,
    data: string = "0x"
  ): Promise<bigint> {
    if (!this.getAddress()) {
      throw new Error("Wallet not initialized");
    }
    return this.transactionService.estimateGas(
      this.getAddress(),
      to,
      value,
      data
    );
  }

  async createEIP1559Transaction(
    to: string,
    value: bigint,
    data: string = "0x",
    gasLimit?: bigint,
    nonce?: number,
    maxFeePerGas?: bigint,
    maxPriorityFeePerGas?: bigint
  ): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Wallet not initialized");
    }

    const params: TransactionParams = {
      to,
      value,
      data,
      gasLimit,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    return this.transactionService.createEIP1559Transaction(
      this.getPrivateKey(),
      this.getAddress(),
      params
    );
  }

  async validateFunds(
    value: bigint,
    gasLimit?: bigint,
    maxFeePerGas?: bigint
  ): Promise<void> {
    if (!this.getAddress()) {
      throw new Error("Wallet not initialized");
    }
    return this.transactionService.validateFunds(
      this.getAddress(),
      value,
      gasLimit,
      maxFeePerGas
    );
  }

  async sendRawTransaction(
    signedTx: string
  ): Promise<string> {
    return this.transactionService.sendRawTransaction(
      signedTx
    );
  }

  async sendEth(
    to: string,
    value: bigint
  ): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Wallet not initialized");
    }

    // Validate funds before sending
    await this.validateFunds(value);

    const signedTx = await this.createEIP1559Transaction(
      to.toLowerCase(),
      value
    );

    return this.sendRawTransaction(signedTx);
  }

  async getTransactionReceipt(
    txHash: string
  ): Promise<TransactionReceipt | null> {
    return this.callRPC<TransactionReceipt | null>(
      "eth_getTransactionReceipt",
      [txHash]
    );
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 120000
  ): Promise<TransactionReceipt> {
    const startTime = Date.now();
    let receipt: TransactionReceipt | null = null;

    while (Date.now() - startTime < timeout) {
      receipt = await this.getTransactionReceipt(txHash);

      if (receipt) {
        if (confirmations <= 1) {
          return receipt;
        }

        const currentBlock = parseInt(
          await this.callRPC<string>("eth_blockNumber"),
          16
        );

        const txBlock = parseInt(receipt.blockNumber, 16);
        if (currentBlock - txBlock >= confirmations - 1) {
          return receipt;
        }
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );
    }

    throw new Error(
      `Transaction not mined within ${timeout}ms`
    );
  }

  // NFT Service methods
  /**
   * Gets NFT holdings for the wallet's address or a specified address
   * @param address - Optional address to query (uses wallet address if not specified)
   * @returns Array of NFT data with images and metadata
   */
  async getNFTs(address?: string): Promise<NFTData[]> {
    const targetAddress = address || this.getAddress();
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }
    return this.nftService.getNFTs(targetAddress);
  }

  // Token Service methods
  /**
   * Gets token balance for a specific token contract
   * @param tokenAddress - The token contract address
   * @param address - Optional address to query (uses wallet address if not specified)
   * @returns Token balance as string
   */
  async getTokenBalance(
    tokenAddress: string,
    address?: string
  ): Promise<string> {
    const targetAddress = address || this.getAddress();
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }
    return this.tokenService.getTokenBalance(
      tokenAddress,
      targetAddress
    );
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
    return this.tokenService.getTokenMetadata(tokenAddress);
  }

  /**
   * Gets all tokens held by the wallet's address or a specified address
   * @param address - Optional address to query (uses wallet address if not specified)
   * @returns Array of Token objects with balances
   */
  async getTokens(address?: string): Promise<Token[]> {
    const targetAddress = address || this.getAddress();
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }
    return this.tokenService.getTokens(targetAddress);
  }

  /**
   * Sends tokens to another address
   * @param tokenAddress - The token contract address
   * @param to - Recipient address
   * @param amount - Amount to send (in token's smallest unit)
   * @returns Transaction hash
   */
  async sendToken(
    tokenAddress: string,
    to: string,
    amount: bigint
  ): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Wallet not initialized");
    }

    // Check token balance
    const tokenBalance = BigInt(
      await this.getTokenBalance(tokenAddress)
    );
    if (tokenBalance < amount) {
      const metadata = await this.getTokenMetadata(
        tokenAddress
      );
      throw new Error(
        `Insufficient token balance:\n` +
          ` Available: ${tokenBalance} ${metadata.symbol}\n` +
          ` Required: ${amount} ${metadata.symbol}`
      );
    }

    // Create transaction data using TokenApiService
    const data = this.tokenService.createTokenTransferData(
      to,
      amount
    );

    // Create and send the transaction
    const signedTx = await this.createEIP1559Transaction(
      tokenAddress,
      BigInt(0),
      data
    );

    return this.sendRawTransaction(signedTx);
  }
}
