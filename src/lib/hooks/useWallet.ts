import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { walletService } from "../wallet/WalletService";
import {
  useCurrentNetwork,
  useNetworkStatus,
  useConnectionStatus,
} from "../store/NetworkStore";
import {
  WalletOpResult,
  TransactionData,
  NFTData,
  Token,
} from "../types/wallet";
import {
  useNetworkLoading,
  useNetworkError,
  useSwitchNetwork,
  useCheckNetworkStatus,
  useSetPreferredNetwork,
  useGetPreferredNetwork,
  useInitializeNetwork,
  useResetNetworkState,
} from "./useNetwork";
import { useWalletAuth } from "./useWalletAuth";

export const useWallet = () => {
  const auth = useWalletAuth();
  const initializeNetwork = useInitializeNetwork();
  const resetNetworkState = useResetNetworkState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createWallet = useCallback(
    async (password: string): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.createWallet(
          password
        );
        if (!result.success) {
          setError(result.message);
        } else {
          initializeNetwork();
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create wallet";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [initializeNetwork]
  );

  const unlockWallet = useCallback(
    async (password: string): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.unlockWallet(
          password
        );
        if (!result.success) {
          setError(result.message);
        } else {
          initializeNetwork();
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to unlock wallet";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [initializeNetwork]
  );

  const importWallet = useCallback(
    async (
      mnemonic: string,
      password: string,
      derivationPath?: string
    ): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.importWallet(
          mnemonic,
          password,
          derivationPath
        );
        if (!result.success) {
          setError(result.message);
        } else {
          initializeNetwork();
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to import wallet";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [initializeNetwork]
  );

  const logout = useCallback((): WalletOpResult => {
    setError(null);
    const result = walletService.logout();
    resetNetworkState();
    return result;
  }, [resetNetworkState]);

  const deleteWallet = useCallback((): WalletOpResult => {
    setError(null);
    const result = walletService.deleteWallet();
    resetNetworkState();
    return result;
  }, [resetNetworkState]);

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.changePassword(
          currentPassword,
          newPassword
        );
        if (!result.success) {
          setError(result.message);
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to change password";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getWalletDetails = useCallback(
    async (password: string): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.getWalletDetails(
          password
        );
        if (!result.success) {
          setError(result.message);
        }
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to get wallet details";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const walletInfo = useMemo(
    () => walletService.getWalletInfo(),
    []
  );

  return {
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isAuthLoading || isLoading,
    hasHydrated: auth.hasHydrated,
    isFullyAuthenticated: auth.isFullyAuthenticated,
    hasValidSession: auth.hasValidSession,
    address: auth.address,
    error,
    hasStoredWallet: walletService.hasStoredWallet(),
    walletInfo,
    createWallet,
    unlockWallet,
    importWallet,
    logout,
    deleteWallet,
    changePassword,
    getWalletDetails,
    clearError,
  };
};

export const useWalletBalance = () => {
  const { isFullyAuthenticated, hasValidSession, address } =
    useWalletAuth();
  const currentNetwork = useCurrentNetwork();
  const connectionStatus = useConnectionStatus();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);

  const fetchBalance = useCallback(
    async (targetAddress?: string) => {
      if (
        !isFullyAuthenticated ||
        !hasValidSession ||
        connectionStatus !== "connected"
      ) {
        return;
      }

      const addressToUse = targetAddress || address;
      if (!addressToUse) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balanceResult =
          await walletService.getBalance(addressToUse);

        setBalance(balanceResult);
        setHasInitialLoad(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch balance";

        setError(errorMessage);

        if (!hasInitialLoad) {
          setBalance("0");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isFullyAuthenticated,
      hasValidSession,
      address,
      hasInitialLoad,
      connectionStatus,
      currentNetwork,
    ]
  );

  useEffect(() => {
    if (
      isFullyAuthenticated &&
      hasValidSession &&
      address &&
      connectionStatus === "connected"
    ) {
      fetchBalance();
    }
  }, [
    isFullyAuthenticated,
    hasValidSession,
    address,
    connectionStatus,
    fetchBalance,
  ]);

  useEffect(() => {
    if (
      !isFullyAuthenticated ||
      !hasValidSession ||
      connectionStatus === "disconnected"
    ) {
      setBalance("0");
      setError(null);
      setHasInitialLoad(false);
    }
  }, [
    isFullyAuthenticated,
    hasValidSession,
    connectionStatus,
  ]);

  return {
    balance,
    isLoading,
    error,
    hasInitialLoad,
    refetch: fetchBalance,
  };
};

export const useWalletTransactions = () => {
  const { isFullyAuthenticated, hasValidSession, address } =
    useWalletAuth();
  const connectionStatus = useConnectionStatus();
  const currentNetwork = useCurrentNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEth = useCallback(
    async (
      toAddress: string,
      amount: string,
      fromAddress?: string
    ): Promise<WalletOpResult> => {
      if (connectionStatus !== "connected") {
        const result = {
          success: false,
          message:
            "Network not connected. Please check your connection.",
        };
        setError(result.message);
        return result;
      }

      if (!isFullyAuthenticated || !hasValidSession) {
        const result = {
          success: false,
          message:
            "Wallet not authenticated. Please unlock your wallet.",
        };
        setError(result.message);
        return result;
      }

      const senderAddress = fromAddress || address;
      if (!senderAddress) {
        const result = {
          success: false,
          message:
            "No wallet address available. Please reconnect your wallet.",
        };
        setError(result.message);
        return result;
      }

      if (!toAddress || !amount) {
        const result = {
          success: false,
          message: "Invalid transaction parameters.",
        };
        setError(result.message);
        return result;
      }

      if (parseFloat(amount) <= 0) {
        const result = {
          success: false,
          message: "Amount must be greater than 0.",
        };
        setError(result.message);
        return result;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await walletService.sendEth(
          toAddress,
          amount
        );

        if (!result.success) {
          setError(result.message);
        }

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "ETH transaction failed. Please try again.";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [
      connectionStatus,
      currentNetwork,
      isFullyAuthenticated,
      hasValidSession,
      address,
    ]
  );

  const sendToken = useCallback(
    async (
      tokenAddress: string,
      toAddress: string,
      amount: string,
      fromAddress?: string
    ): Promise<WalletOpResult> => {
      if (connectionStatus !== "connected") {
        const result = {
          success: false,
          message:
            "Network not connected. Please check your connection.",
        };
        setError(result.message);
        return result;
      }

      if (!isFullyAuthenticated || !hasValidSession) {
        const result = {
          success: false,
          message:
            "Wallet not authenticated. Please unlock your wallet.",
        };
        setError(result.message);
        return result;
      }

      const senderAddress = fromAddress || address;
      if (!senderAddress) {
        const result = {
          success: false,
          message:
            "No wallet address available. Please reconnect your wallet.",
        };
        setError(result.message);
        return result;
      }

      if (!tokenAddress || !toAddress || !amount) {
        const result = {
          success: false,
          message: "Invalid transaction parameters.",
        };
        setError(result.message);
        return result;
      }

      if (parseFloat(amount) <= 0) {
        const result = {
          success: false,
          message: "Amount must be greater than 0.",
        };
        return result;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await walletService.sendToken(
          tokenAddress,
          toAddress,
          amount
        );

        if (!result.success) {
          setError(result.message);
        }

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Token transaction failed. Please try again.";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [
      connectionStatus,
      currentNetwork,
      isFullyAuthenticated,
      hasValidSession,
      address,
    ]
  );

  const getTransactions = useCallback(
    async (
      targetAddress?: string
    ): Promise<TransactionData[]> => {
      if (
        !isFullyAuthenticated ||
        !hasValidSession ||
        connectionStatus !== "connected"
      ) {
        return [];
      }

      const addressToUse = targetAddress || address;
      if (!addressToUse) {
        return [];
      }

      try {
        return await walletService.getTransactions(
          addressToUse
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch transactions";
        setError(errorMessage);
        return [];
      }
    },
    [
      isFullyAuthenticated,
      hasValidSession,
      connectionStatus,
      address,
    ]
  );

  const waitForTransaction = useCallback(
    async (
      txHash: string,
      confirmations?: number
    ): Promise<boolean> => {
      if (!txHash) {
        setError("Invalid transaction hash");
        return false;
      }

      try {
        const result =
          await walletService.waitForTransaction(
            txHash,
            confirmations
          );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to wait for transaction";
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  const estimateGas = useCallback(
    async (
      to: string,
      value: string,
      data?: string,
      fromAddress?: string
    ): Promise<string> => {
      if (!to || !value) {
        setError("Invalid gas estimation parameters");
        return "21000";
      }

      const senderAddress = fromAddress || address;
      if (!senderAddress) {
        // Still try the estimation but with a warning
      }

      try {
        return await walletService.estimateGas(
          to,
          value,
          data
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to estimate gas";
        setError(errorMessage);
        return "21000";
      }
    },
    [address]
  );

  const hasValidAddress = useCallback(() => {
    return Boolean(
      address && isFullyAuthenticated && hasValidSession
    );
  }, [address, isFullyAuthenticated, hasValidSession]);

  return {
    isLoading,
    error,
    address,
    hasValidAddress,
    sendEth,
    sendToken,
    getTransactions,
    waitForTransaction,
    estimateGas,
  };
};

export const useWalletTokens = () => {
  const { isFullyAuthenticated, hasValidSession } =
    useWalletAuth();
  const connectionStatus = useConnectionStatus();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(
    async (address?: string) => {
      if (
        !isFullyAuthenticated ||
        !hasValidSession ||
        connectionStatus !== "connected"
      )
        return;

      setIsLoading(true);
      setError(null);
      try {
        const tokensResult = await walletService.getTokens(
          address
        );
        setTokens(tokensResult);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch tokens"
        );
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isFullyAuthenticated,
      hasValidSession,
      connectionStatus,
    ]
  );

  const getTokenBalance = useCallback(
    async (
      tokenAddress: string,
      address?: string
    ): Promise<string> => {
      try {
        return await walletService.getTokenBalance(
          tokenAddress,
          address
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch token balance"
        );
        return "0";
      }
    },
    []
  );

  const getTokenMetadata = useCallback(
    async (tokenAddress: string): Promise<Token | null> => {
      try {
        return await walletService.getTokenMetadata(
          tokenAddress
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch token metadata"
        );
        return null;
      }
    },
    []
  );

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    isLoading,
    error,
    refetch: fetchTokens,
    getTokenBalance,
    getTokenMetadata,
  };
};

export const useWalletNFTs = () => {
  const { isFullyAuthenticated, hasValidSession, address } =
    useWalletAuth();
  const connectionStatus = useConnectionStatus();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);

  const fetchNFTs = useCallback(
    async (targetAddress?: string) => {
      if (
        !isFullyAuthenticated ||
        !hasValidSession ||
        connectionStatus !== "connected"
      ) {
        return;
      }

      const addressToUse = targetAddress || address;
      if (!addressToUse) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nftsResult = await walletService.getNFTs(
          addressToUse
        );

        setNfts(nftsResult);
        setHasInitialLoad(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch NFTs";

        setError(errorMessage);

        if (!hasInitialLoad) {
          setNfts([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isFullyAuthenticated,
      hasValidSession,
      address,
      hasInitialLoad,
      connectionStatus,
    ]
  );

  useEffect(() => {
    if (
      isFullyAuthenticated &&
      hasValidSession &&
      address &&
      connectionStatus === "connected"
    ) {
      fetchNFTs();
    }
  }, [
    isFullyAuthenticated,
    hasValidSession,
    address,
    connectionStatus,
    fetchNFTs,
  ]);

  useEffect(() => {
    if (
      !isFullyAuthenticated ||
      !hasValidSession ||
      connectionStatus === "disconnected"
    ) {
      setNfts([]);
      setError(null);
      setHasInitialLoad(false);
    }
  }, [
    isFullyAuthenticated,
    hasValidSession,
    connectionStatus,
  ]);

  return {
    nfts,
    isLoading,
    error,
    hasInitialLoad,
    refetch: fetchNFTs,
  };
};

export const useWalletNetwork = () => {
  const currentNetwork = useCurrentNetwork();
  const networkStatus = useNetworkStatus();
  const connectionStatus = useConnectionStatus();
  const { isLoading, isSwitching } = useNetworkLoading();
  const error = useNetworkError();
  const switchNetwork = useSwitchNetwork();
  const checkNetworkStatus = useCheckNetworkStatus();
  const setPreferredNetwork = useSetPreferredNetwork();
  const getPreferredNetwork = useGetPreferredNetwork();

  const getFeeData = useCallback(async () => {
    if (connectionStatus !== "connected") {
      return {
        maxFeePerGas: "0",
        maxPriorityFeePerGas: "0",
      };
    }

    try {
      return await walletService.getFeeData();
    } catch {
      return {
        maxFeePerGas: "0",
        maxPriorityFeePerGas: "0",
      };
    }
  }, [connectionStatus]);

  return {
    networkStatus,
    currentNetwork,
    connectionStatus,
    isLoading,
    isSwitching,
    error,
    switchNetwork: async (networkId: number) => {
      const result = await switchNetwork(networkId);
      if (result.success) {
        setPreferredNetwork(networkId);
      }
      return result;
    },
    getNetworkStatus: checkNetworkStatus,
    getFeeData,
    getPreferredNetwork,
    setPreferredNetwork,
  };
};

export const useWalletComposite = () => {
  const wallet = useWallet();
  const balance = useWalletBalance();
  const transactions = useWalletTransactions();
  const tokens = useWalletTokens();
  const nfts = useWalletNFTs();
  const network = useWalletNetwork();

  const isReady =
    wallet.isFullyAuthenticated &&
    wallet.hasValidSession &&
    network.connectionStatus === "connected";

  const isAnyLoading =
    wallet.isAuthLoading ||
    balance.isLoading ||
    transactions.isLoading ||
    tokens.isLoading ||
    nfts.isLoading ||
    network.isLoading ||
    network.isSwitching;

  const refetchAll = useCallback(async () => {
    if (!isReady) {
      return;
    }

    try {
      await network.getNetworkStatus();

      if (network.connectionStatus === "connected") {
        await balance.refetch();

        await Promise.all([
          tokens.refetch(),
          nfts.refetch(),
        ]);
      }
    } catch {
      // Silent error handling
    }
  }, [
    isReady,
    network.getNetworkStatus,
    network.connectionStatus,
    balance.refetch,
    tokens.refetch,
    nfts.refetch,
  ]);

  const refetchBalance = useCallback(async () => {
    if (!isReady) {
      return;
    }

    await balance.refetch();
  }, [isReady, balance.refetch]);

  return {
    wallet,
    balance: balance.balance,
    tokens: tokens.tokens,
    nfts: nfts.nfts,
    networkStatus: network.networkStatus,
    currentNetwork: network.currentNetwork,
    connectionStatus: network.connectionStatus,
    isReady,
    isAnyLoading,
    isBalanceLoading: balance.isLoading,
    isTokensLoading: tokens.isLoading,
    isNftsLoading: nfts.isLoading,
    isNetworkLoading: network.isLoading,
    isNetworkSwitching: network.isSwitching,
    hasInitialBalance: balance.hasInitialLoad,
    hasInitialNFTs: nfts.hasInitialLoad,
    ...wallet,
    ...transactions,
    switchNetwork: network.switchNetwork,
    getFeeData: network.getFeeData,
    getTokenBalance: tokens.getTokenBalance,
    getTokenMetadata: tokens.getTokenMetadata,
    setPreferredNetwork: network.setPreferredNetwork,
    getPreferredNetwork: network.getPreferredNetwork,
    refetchAll,
    refetchBalance,
    errors: {
      wallet: wallet.error,
      balance: balance.error,
      transactions: transactions.error,
      tokens: tokens.error,
      nfts: nfts.error,
      network: network.error,
    },
  };
};
