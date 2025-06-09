import { ExtendedCryptoWallet } from "./ExtendedCryptoWallet";
import {
  NetworkConfig,
  WalletOpResult,
  TransactionData,
  NFTData,
  NetworkStatus,
  Token,
} from "../types/wallet";

import { formatEther, parseEther } from "../utils/index";
import { validateMnemonic } from "ethereum-cryptography/bip39";
import { wordlist } from "ethereum-cryptography/bip39/wordlists/english";
import {
  storeWalletData,
  getStoredWalletData,
  hasStoredWallet,
  updateWalletData,
  deleteWalletFromStorage,
  validateWalletIntegrity,
  getWalletInfo,
} from "../auth/wallet-auth";
import { useWalletStore } from "../store/WalletAuthStore";
import { NETWORKS } from "../utils/constant";

export class WalletService {
  private wallet!: ExtendedCryptoWallet;
  private currentNetwork: NetworkConfig;

  /**
   * Creates a new WalletService instance
   * @param {number} [networkId] - Optional network ID to initialize with
   */
  constructor(networkId?: number) {
    this.currentNetwork =
      this.getNetworkById(networkId) || NETWORKS[0];
    this.initializeWallet();
  }

  /**
   * Gets network configuration by ID
   * @param {number} [networkId] - Network ID to search for
   * @returns {NetworkConfig | null} Network configuration or null if not found
   */
  private getNetworkById(
    networkId?: number
  ): NetworkConfig | null {
    return networkId
      ? NETWORKS.find((n) => n.id === networkId) || null
      : null;
  }

  private initializeWallet(): void {
    this.wallet = new ExtendedCryptoWallet(
      this.currentNetwork.rpcUrl,
      this.currentNetwork.explorerApiUrl,
      this.currentNetwork.explorerApiKey,
      this.currentNetwork.chainId
    );
  }

  /**
   * Creates a success result object
   * @param {string} message - Success message
   * @param {Record<string, unknown>} [data] - Optional data payload
   * @returns {WalletOpResult} Success result
   */
  private createSuccessResult(
    message: string,
    data?: Record<string, unknown>
  ): WalletOpResult {
    return { success: true, message, data };
  }

  /**
   * Creates an error result object
   * @param {unknown} error - Error object or message
   * @param {string} defaultMessage - Default error message
   * @returns {WalletOpResult} Error result
   */
  private createErrorResult(
    error: unknown,
    defaultMessage: string
  ): WalletOpResult {
    const message =
      error instanceof Error
        ? error.message
        : defaultMessage;
    return { success: false, message };
  }

  private ensureWalletReady(): void {
    const store = useWalletStore.getState();

    if (!this.isAuthenticated()) {
      throw new Error(
        "Wallet not authenticated - please unlock your wallet first"
      );
    }

    if (!store.hasValidSession()) {
      throw new Error(
        "Wallet not ready - please enter your password first"
      );
    }
  }

  /**
   * Checks if wallet is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated(): boolean {
    const store = useWalletStore.getState();
    return store.isFullyAuthenticated();
  }

  /**
   * Requires authentication and returns result
   * @returns {WalletOpResult} Authentication result
   */
  requireAuth(): WalletOpResult {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
      };
    }
    return this.createSuccessResult("Authenticated");
  }

  private clearSession(): void {
    try {
      if (this.wallet) {
        this.wallet.clearWallet();
      }

      useWalletStore.getState().clearSession();
    } catch (error) {
      console.warn("Error clearing session:", error);
    }
  }

  /**
   * Switches to a different network
   * @param {number} networkId - Target network ID
   * @returns {WalletOpResult} Switch operation result
   */
  switchNetwork(networkId: number): WalletOpResult {
    try {
      const network = this.getNetworkById(networkId);
      if (!network) {
        return this.createErrorResult(
          null,
          `Network with ID ${networkId} not found`
        );
      }

      if (this.wallet) {
        try {
          this.wallet.clearWallet();
        } catch (error) {
          console.warn(
            "Error clearing wallet during network switch:",
            error
          );
        }
      }

      this.currentNetwork = network;
      this.initializeWallet();

      return this.createSuccessResult(
        `Switched to ${network.name}`,
        {
          network,
          previousNetwork: this.currentNetwork,
        }
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to switch network"
      );
    }
  }

  /**
   * Gets the current network configuration
   * @returns {NetworkConfig} Current network
   */
  getCurrentNetwork(): NetworkConfig {
    return this.currentNetwork;
  }

  /**
   * Checks if a wallet is stored locally
   * @returns {boolean} True if wallet exists in storage
   */
  hasStoredWallet(): boolean {
    return hasStoredWallet();
  }

  /**
   * Gets basic wallet information without requiring password
   * @returns {Object} Wallet info object
   */
  getWalletInfo(): {
    hasWallet: boolean;
    address?: string;
    createdAt?: number;
  } {
    return getWalletInfo();
  }

  /**
   * Creates a new wallet with the specified password
   * @param {string} password - Password to encrypt the wallet
   * @returns {Promise<WalletOpResult>} Creation result
   */
  async createWallet(
    password: string
  ): Promise<WalletOpResult> {
    try {
      this.clearSession();

      const mnemonic = this.wallet.generateWallet();
      const address = this.wallet.getAddress();

      await storeWalletData(mnemonic, password, address);

      const store = useWalletStore.getState();
      store.createSession({
        address,
      });

      return this.createSuccessResult(
        "Wallet created successfully",
        {
          address,
          mnemonic,
          networkId: this.currentNetwork.id,
        }
      );
    } catch (error) {
      this.clearSession();
      return this.createErrorResult(
        error,
        "Failed to create wallet"
      );
    }
  }

  /**
   * Unlocks an existing wallet with the provided password
   * @param {string} password - Wallet password
   * @returns {Promise<WalletOpResult>} Unlock result
   */
  async unlockWallet(
    password: string
  ): Promise<WalletOpResult> {
    try {
      this.clearSession();

      const isValid = await validateWalletIntegrity(
        password
      );
      if (!isValid) {
        return this.createErrorResult(
          new Error(
            "Invalid password or corrupted wallet data"
          ),
          "Invalid password or wallet data is corrupted"
        );
      }

      const result = await getStoredWalletData(password);
      if (!result) {
        return this.createErrorResult(
          new Error("Wallet not found or invalid password"),
          "Wallet not found or invalid password"
        );
      }

      const { mnemonic } = result;

      if (
        !mnemonic ||
        !validateMnemonic(mnemonic, wordlist)
      ) {
        return this.createErrorResult(
          new Error("Invalid wallet data"),
          "Wallet data is corrupted or password is incorrect"
        );
      }

      const walletAddress =
        this.wallet.importFromMnemonic(mnemonic);

      const store = useWalletStore.getState();
      store.createSession({
        address: walletAddress,
      });

      return this.createSuccessResult(
        "Wallet unlocked successfully",
        {
          address: walletAddress,
          mnemonic,
        }
      );
    } catch (error) {
      this.clearSession();
      return this.createErrorResult(
        error,
        "Failed to unlock wallet"
      );
    }
  }

  /**
   * Imports a wallet from mnemonic phrase
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {string} password - Password to encrypt the wallet
   * @param {string} [derivationPath="m/44'/60'/0'/0/0"] - HD wallet derivation path
   * @returns {Promise<WalletOpResult>} Import result
   */
  async importWallet(
    mnemonic: string,
    password: string,
    derivationPath: string = "m/44'/60'/0'/0/0"
  ): Promise<WalletOpResult> {
    try {
      this.clearSession();

      if (!validateMnemonic(mnemonic.trim(), wordlist)) {
        return this.createErrorResult(
          new Error("Invalid mnemonic phrase"),
          "The mnemonic phrase is invalid. Please check and try again."
        );
      }

      if (this.hasStoredWallet()) {
        const result = await getStoredWalletData(
          password
        ).catch(() => null);
        if (result) {
          const { mnemonic: existingMnemonic } = result;
          if (
            existingMnemonic &&
            existingMnemonic !== mnemonic.trim()
          ) {
            return this.createErrorResult(
              new Error("Different wallet exists"),
              "A different wallet already exists. Please delete the existing wallet first or use a different password."
            );
          }
        }
      }

      const cleanMnemonic = mnemonic.trim();
      const address =
        this.wallet.importFromMnemonic(cleanMnemonic);

      if (this.hasStoredWallet()) {
        await updateWalletData(
          address,
          cleanMnemonic,
          password
        );
      } else {
        await storeWalletData(
          cleanMnemonic,
          password,
          address
        );
      }

      const store = useWalletStore.getState();
      store.createSession({
        address,
      });

      return this.createSuccessResult(
        "Wallet imported successfully",
        {
          address,
          mnemonic: cleanMnemonic,
          networkId: this.currentNetwork.id,
        }
      );
    } catch (error) {
      this.clearSession();
      return this.createErrorResult(
        error,
        "Failed to import wallet"
      );
    }
  }

  /**
   * Changes the wallet password
   * @param {string} currentPassword - Current wallet password
   * @param {string} newPassword - New password to set
   * @returns {Promise<WalletOpResult>} Password change result
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<WalletOpResult> {
    try {
      const authResult = this.requireAuth();
      if (!authResult.success) return authResult;

      if (
        !(await validateWalletIntegrity(currentPassword))
      ) {
        return this.createErrorResult(
          new Error("Invalid current password"),
          "Current password is incorrect"
        );
      }

      const result = await getStoredWalletData(
        currentPassword
      );
      if (!result) {
        return this.createErrorResult(
          new Error("Invalid current password"),
          "Current password is incorrect"
        );
      }

      const { walletData, mnemonic } = result;

      if (!mnemonic) {
        return this.createErrorResult(
          new Error("Failed to decrypt wallet"),
          "Current password is incorrect"
        );
      }

      await updateWalletData(
        walletData.address,
        mnemonic,
        newPassword
      );

      return this.createSuccessResult(
        "Password changed successfully"
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to change password"
      );
    }
  }

  /**
   * Logs out the current wallet session
   * @returns {WalletOpResult} Logout result
   */
  logout(): WalletOpResult {
    try {
      this.clearSession();
      return this.createSuccessResult(
        "Logged out successfully"
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to logout"
      );
    }
  }

  /**
   * Permanently deletes the wallet from storage
   * @returns {WalletOpResult} Deletion result
   */
  deleteWallet(): WalletOpResult {
    try {
      useWalletStore.getState().clearAll();
      deleteWalletFromStorage();

      if (this.wallet) {
        this.wallet.clearWallet();
      }

      return this.createSuccessResult(
        "Wallet deleted successfully"
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to delete wallet"
      );
    }
  }

  /**
   * Gets the current wallet address
   * @returns {string} Wallet address
   * @throws {Error} If wallet is not authenticated
   */
  getWalletAddress(): string {
    if (!this.isAuthenticated()) {
      throw new Error("Wallet not authenticated");
    }
    const store = useWalletStore.getState();
    if (!store.address) {
      throw new Error("No wallet address available");
    }
    return store.address;
  }

  /**
   * Checks if wallet is initialized and ready
   * @returns {boolean} True if wallet is initialized
   */
  isWalletInitialized(): boolean {
    const store = useWalletStore.getState();
    return store.hasValidSession();
  }

  /**
   * Gets the balance for a wallet address
   * @param {string} [address] - Address to check balance for (defaults to current wallet)
   * @returns {Promise<string>} Balance in wei as string
   */
  async getBalance(address?: string): Promise<string> {
    try {
      this.ensureWalletReady();
      const balance = await this.wallet.getBalance(address);
      return balance.toString();
    } catch {
      return "0";
    }
  }

  /**
   * Sends ETH to a recipient address
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount in ETH
   * @returns {Promise<WalletOpResult>} Transaction result
   */
  async sendEth(
    toAddress: string,
    amount: string
  ): Promise<WalletOpResult> {
    try {
      const authResult = this.requireAuth();
      if (!authResult.success) return authResult;

      this.ensureWalletReady();

      const value = parseEther(amount);
      const balance = await this.wallet.getBalance();

      if (BigInt(balance) === BigInt(0)) {
        const directBalanceCheck =
          await this.wallet.callRPC<string>(
            "eth_getBalance",
            [
              this.wallet.getAddress().toLowerCase(),
              "latest",
            ]
          );

        return this.createErrorResult(
          null,
          `Wallet ${this.wallet.getAddress()} shows zero balance. Direct RPC check: ${directBalanceCheck}. Please verify you have funds on the ${
            this.currentNetwork.name
          } network.`
        );
      }

      await this.wallet.validateFunds(value);

      const txHash = await this.wallet.sendEth(
        toAddress,
        value
      );
      return this.createSuccessResult(
        "Transaction sent successfully",
        {
          txHash,
          network: this.currentNetwork.name,
        }
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to send transaction"
      );
    }
  }

  /**
   * Gets the token balance for a specific token contract
   * @param {string} tokenAddress - Token contract address
   * @param {string} [address] - Address to check balance for (defaults to current wallet)
   * @returns {Promise<string>} Token balance as string
   */
  async getTokenBalance(
    tokenAddress: string,
    address?: string
  ): Promise<string> {
    try {
      this.ensureWalletReady();
      return await this.wallet.getTokenBalance(
        tokenAddress,
        address
      );
    } catch {
      return "0";
    }
  }

  /**
   * Gets metadata for a token contract
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<Token | null>} Token metadata or null if failed
   */
  async getTokenMetadata(
    tokenAddress: string
  ): Promise<Token | null> {
    try {
      this.ensureWalletReady();
      const metadata = await this.wallet.getTokenMetadata(
        tokenAddress
      );
      return {
        address: tokenAddress,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        balance: "0",
      };
    } catch {
      return null;
    }
  }

  /**
   * Gets all tokens for a wallet address
   * @param {string} [address] - Address to get tokens for (defaults to current wallet)
   * @returns {Promise<Token[]>} Array of tokens
   */
  async getTokens(address?: string): Promise<Token[]> {
    try {
      this.ensureWalletReady();
      const tokens = await this.wallet.getTokens(address);
      return tokens.map((token) => ({
        ...token,
        formattedBalance: this.formatTokenBalance(
          token.balance || "0",
          token.decimals || 18
        ),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Formats token balance with proper decimals
   * @param {string} balance - Raw token balance
   * @param {number} decimals - Token decimals
   * @returns {string} Formatted balance
   */
  private formatTokenBalance(
    balance: string,
    decimals: number
  ): string {
    try {
      return formatEther(BigInt(balance), decimals);
    } catch {
      return "0";
    }
  }

  /**
   * Sends tokens to a recipient address
   * @param {string} tokenAddress - Token contract address
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount to send
   * @returns {Promise<WalletOpResult>} Transaction result
   */
  async sendToken(
    tokenAddress: string,
    toAddress: string,
    amount: string
  ): Promise<WalletOpResult> {
    try {
      const authResult = this.requireAuth();
      if (!authResult.success) return authResult;

      this.ensureWalletReady();

      const txHash = await this.wallet.sendToken(
        tokenAddress,
        toAddress,
        BigInt(amount)
      );

      return this.createSuccessResult(
        "Token transaction sent successfully",
        {
          txHash,
          network: this.currentNetwork.name,
        }
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to send token"
      );
    }
  }

  /**
   * Gets NFTs owned by a wallet address
   * @param {string} [address] - Address to get NFTs for (defaults to current wallet)
   * @returns {Promise<NFTData[]>} Array of NFTs
   */
  async getNFTs(address?: string): Promise<NFTData[]> {
    try {
      this.ensureWalletReady();
      return await this.wallet.getNFTs(address);
    } catch {
      return [];
    }
  }

  /**
   * Gets transaction history for a wallet address
   * @param {string} [address] - Address to get transactions for (defaults to current wallet)
   * @returns {Promise<TransactionData[]>} Array of transactions
   */
  async getTransactions(
    address?: string
  ): Promise<TransactionData[]> {
    try {
      this.ensureWalletReady();
      return await this.wallet.getTransactions(address);
    } catch {
      return [];
    }
  }

  /**
   * Waits for a transaction to be confirmed
   * @param {string} txHash - Transaction hash
   * @param {number} [confirmations=1] - Number of confirmations to wait for
   * @returns {Promise<boolean>} True if transaction was confirmed
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<boolean> {
    try {
      this.ensureWalletReady();
      await this.wallet.waitForTransaction(
        txHash,
        confirmations
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets current network status information
   * @returns {Promise<NetworkStatus>} Network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(new Error("Network request timeout")),
          15000
        );
      });

      const [blockNumber, gasPrice] = await Promise.race([
        Promise.all([
          this.wallet.callRPC<string>("eth_blockNumber"),
          this.wallet.getGasPrice(),
        ]),
        timeout,
      ]);

      const blockNum = parseInt(blockNumber, 16);
      const gasPriceStr = gasPrice.toString();

      return {
        blockNumber: blockNum,
        gasPrice: gasPriceStr,
        isConnected: true,
        name: this.currentNetwork.name,
        explorerUrl: this.currentNetwork.explorerUrl,
      };
    } catch {
      return {
        blockNumber: 0,
        gasPrice: "0",
        isConnected: false,
        name: this.currentNetwork.name,
        explorerUrl: this.currentNetwork.explorerUrl,
      };
    }
  }

  /**
   * Gets current fee data for transactions
   * @returns {Promise<Object>} Fee data object
   */
  async getFeeData(): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }> {
    try {
      const feeData = await this.wallet.getFeeData();
      return {
        maxFeePerGas: feeData.maxFeePerGas.toString(),
        maxPriorityFeePerGas:
          feeData.maxPriorityFeePerGas.toString(),
      };
    } catch {
      return {
        maxFeePerGas: "0",
        maxPriorityFeePerGas: "0",
      };
    }
  }

  /**
   * Estimates gas cost for a transaction
   * @param {string} to - Recipient address
   * @param {string} value - Transaction value in ETH
   * @param {string} [data="0x"] - Transaction data
   * @returns {Promise<string>} Estimated gas limit
   */
  async estimateGas(
    to: string,
    value: string,
    data: string = "0x"
  ): Promise<string> {
    try {
      const gasLimit = await this.wallet.estimateGas(
        to,
        parseEther(value),
        data
      );
      return gasLimit.toString();
    } catch {
      return "21000";
    }
  }

  /**
   * Gets detailed wallet information including private keys
   * @param {string} password - Wallet password for authentication
   * @returns {Promise<WalletOpResult>} Wallet details result
   */
  async getWalletDetails(
    password: string
  ): Promise<WalletOpResult> {
    try {
      const authResult = this.requireAuth();
      if (!authResult.success) return authResult;

      if (!(await validateWalletIntegrity(password))) {
        return this.createErrorResult(
          new Error("Invalid password"),
          "Password is incorrect"
        );
      }

      const result = await getStoredWalletData(password);
      if (!result) {
        return this.createErrorResult(
          new Error("Invalid password"),
          "Password is incorrect"
        );
      }

      const { mnemonic } = result;

      if (!mnemonic) {
        return this.createErrorResult(
          new Error("Failed to decrypt wallet"),
          "Password is incorrect"
        );
      }

      const tempWallet = new ExtendedCryptoWallet(
        this.currentNetwork.rpcUrl,
        this.currentNetwork.explorerApiUrl,
        this.currentNetwork.explorerApiKey,
        this.currentNetwork.chainId
      );

      const address =
        tempWallet.importFromMnemonic(mnemonic);
      const privateKey = tempWallet.getPrivateKeyHex();
      const publicKey = tempWallet.getPublicKeyHex();

      tempWallet.clearWallet();

      return this.createSuccessResult(
        "Wallet details retrieved successfully",
        {
          address,
          privateKey,
          publicKey,
          mnemonic,
        }
      );
    } catch (error) {
      return this.createErrorResult(
        error,
        "Failed to get wallet details"
      );
    }
  }

  /**
   * Clears the current wallet session and data
   */
  clearWallet(): void {
    this.clearSession();
    if (this.wallet) {
      this.wallet.clearWallet();
    }
  }
}

export const walletService = new WalletService();
