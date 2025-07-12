import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { walletService } from "../wallet/WalletService";
import { useWalletStore } from "../store/WalletAuthStore";
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

export const useWallet = () => {
  const store = useWalletStore();
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
      password: string
    ): Promise<WalletOpResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletService.importWallet(
          mnemonic,
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
    store.clearSession();
    resetNetworkState();
    return result;
  }, [store, resetNetworkState]);

  const deleteWallet = useCallback((): WalletOpResult => {
    setError(null);
    const result = walletService.deleteWallet();
    store.clearAll();
    resetNetworkState();
    return result;
  }, [store, resetNetworkState]);

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

  const isAuthenticated = store.isAuthenticated;
  const address = store.address;
  const sessionId = store.sessionId;
  const hasHydrated = store._hasHydrated;

  const authState = useMemo(
    () => ({
      isAuthenticated,
      isFullyAuthenticated: store.isFullyAuthenticated(),
      hasValidSession: store.hasValidSession(),
      address,
      sessionId,
      hasHydrated,
    }),
    [isAuthenticated, address, sessionId, hasHydrated]
  );

  return {
    ...authState,
    isAuthLoading: isLoading,
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
    createSession: store.createSession,
    clearSession: store.clearSession,
    clearAll: store.clearAll,
  };
};

export const useWalletBalance = () => {
  const store = useWalletStore();
  const connectionStatus = useConnectionStatus();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);
  const fetchingRef = useRef(false);

  const address = store.address;
  const isAuthenticated = store.isAuthenticated;

  const authState = useMemo(
    () => ({
      isFullyAuthenticated: store.isFullyAuthenticated(),
      hasValidSession: store.hasValidSession(),
      address,
    }),
    [address, isAuthenticated]
  );

  const canFetch = useMemo(() => {
    return (
      authState.isFullyAuthenticated &&
      authState.hasValidSession &&
      connectionStatus === "connected" &&
      !!authState.address
    );
  }, [
    authState.isFullyAuthenticated,
    authState.hasValidSession,
    connectionStatus,
    authState.address,
  ]);

  const fetchBalance = useCallback(
    async (targetAddress?: string) => {
      if (!canFetch || fetchingRef.current) {
        return;
      }

      const addressToUse =
        targetAddress || authState.address;
      if (!addressToUse) {
        return;
      }

      fetchingRef.current = true;
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
        fetchingRef.current = false;
      }
    },
    [canFetch, authState.address, hasInitialLoad]
  );

  useEffect(() => {
    if (!canFetch) {
      setBalance("0");
      setError(null);
      setHasInitialLoad(false);
      fetchingRef.current = false;
    }
  }, [canFetch]);

  useEffect(() => {
    if (
      canFetch &&
      !hasInitialLoad &&
      !isLoading &&
      !fetchingRef.current
    ) {
      fetchBalance();
    }
  }, [canFetch, hasInitialLoad, isLoading, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    hasInitialLoad,
    refetch: fetchBalance,
  };
};

export const useWalletTokens = () => {
  const store = useWalletStore();
  const connectionStatus = useConnectionStatus();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);
  const fetchingRef = useRef(false);

  const address = store.address;
  const isAuthenticated = store.isAuthenticated;

  const authState = useMemo(
    () => ({
      isFullyAuthenticated: store.isFullyAuthenticated(),
      hasValidSession: store.hasValidSession(),
      address,
    }),
    [address, isAuthenticated]
  );

  const canFetch = useMemo(() => {
    return (
      authState.isFullyAuthenticated &&
      authState.hasValidSession &&
      connectionStatus === "connected" &&
      !!authState.address
    );
  }, [
    authState.isFullyAuthenticated,
    authState.hasValidSession,
    connectionStatus,
    authState.address,
  ]);

  const fetchTokens = useCallback(
    async (targetAddress?: string) => {
      if (!canFetch || fetchingRef.current) {
        return;
      }

      const addressToUse =
        targetAddress || authState.address;
      if (!addressToUse) {
        return;
      }

      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const tokensResult = await walletService.getTokens(
          addressToUse
        );
        setTokens(tokensResult || []);
        setHasInitialLoad(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch tokens";

        setError(errorMessage);

        if (!hasInitialLoad) {
          setTokens([]);
        }
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    },
    [
      canFetch,
      authState.address,
      hasInitialLoad,
      connectionStatus,
    ]
  );

  const getTokenBalance = useCallback(
    async (
      tokenAddress: string,
      address?: string
    ): Promise<string> => {
      try {
        const balance = await walletService.getTokenBalance(
          tokenAddress,
          address
        );
        return balance;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch token balance";
        setError(errorMessage);
        return "0";
      }
    },
    []
  );

  const getTokenMetadata = useCallback(
    async (tokenAddress: string): Promise<Token | null> => {
      try {
        const metadata =
          await walletService.getTokenMetadata(
            tokenAddress
          );
        return metadata;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch token metadata";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (!canFetch) {
      setTokens([]);
      setError(null);
      setHasInitialLoad(false);
      fetchingRef.current = false;
    }
  }, [canFetch]);

  useEffect(() => {
    if (
      canFetch &&
      !hasInitialLoad &&
      !isLoading &&
      !fetchingRef.current
    ) {
      fetchTokens();
    }
  }, [canFetch, hasInitialLoad, isLoading, fetchTokens]);

  return {
    tokens,
    isLoading,
    error,
    hasInitialLoad,
    refetch: fetchTokens,
    getTokenBalance,
    getTokenMetadata,
  };
};

export const useWalletNFTs = (
  options: { autoFetch?: boolean } = {}
) => {
  const { autoFetch = true } = options;
  const store = useWalletStore();
  const connectionStatus = useConnectionStatus();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);
  const fetchingRef = useRef(false);

  const address = store.address;
  const isAuthenticated = store.isAuthenticated;

  const authState = useMemo(
    () => ({
      isFullyAuthenticated: store.isFullyAuthenticated(),
      hasValidSession: store.hasValidSession(),
      address,
    }),
    [address, isAuthenticated]
  );

  const canFetch = useMemo(() => {
    return (
      authState.isFullyAuthenticated &&
      authState.hasValidSession &&
      connectionStatus === "connected" &&
      !!authState.address
    );
  }, [
    authState.isFullyAuthenticated,
    authState.hasValidSession,
    connectionStatus,
    authState.address,
  ]);

  const fetchNFTs = useCallback(
    async (targetAddress?: string) => {
      if (!canFetch || fetchingRef.current) {
        return;
      }

      const addressToUse =
        targetAddress || authState.address;
      if (!addressToUse) {
        return;
      }

      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const nftsResult = await walletService.getNFTs(
          addressToUse
        );
        setNfts(nftsResult || []);
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
        fetchingRef.current = false;
      }
    },
    [
      canFetch,
      authState.address,
      hasInitialLoad,
      connectionStatus,
    ]
  );

  useEffect(() => {
    if (!canFetch) {
      setNfts([]);
      setError(null);
      setHasInitialLoad(false);
      fetchingRef.current = false;
    }
  }, [canFetch]);

  useEffect(() => {
    if (
      autoFetch &&
      canFetch &&
      !hasInitialLoad &&
      !isLoading &&
      !fetchingRef.current
    ) {
      fetchNFTs();
    }
  }, [
    autoFetch,
    canFetch,
    hasInitialLoad,
    isLoading,
    fetchNFTs,
  ]);

  return {
    nfts,
    isLoading,
    error,
    hasInitialLoad,
    refetch: fetchNFTs,
  };
};

export const useWalletTransactions = (
  options: { autoFetch?: boolean } = {}
) => {
  const { autoFetch = false } = options;
  const store = useWalletStore();
  const connectionStatus = useConnectionStatus();
  const currentNetwork = useCurrentNetwork();
  const [transactions, setTransactions] = useState<
    TransactionData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] =
    useState(false);
  const fetchingRef = useRef(false);

  const address = store.address;
  const isAuthenticated = store.isAuthenticated;

  const authState = useMemo(
    () => ({
      isFullyAuthenticated: store.isFullyAuthenticated(),
      hasValidSession: store.hasValidSession(),
      address,
    }),
    [address, isAuthenticated]
  );

  const canFetch = useMemo(() => {
    return (
      authState.isFullyAuthenticated &&
      authState.hasValidSession &&
      connectionStatus === "connected" &&
      !!authState.address
    );
  }, [
    authState.isFullyAuthenticated,
    authState.hasValidSession,
    connectionStatus,
    authState.address,
  ]);

  const fetchTransactions = useCallback(
    async (targetAddress?: string) => {
      if (!canFetch || fetchingRef.current) {
        return [];
      }

      const addressToUse =
        targetAddress || authState.address;
      if (!addressToUse) {
        return [];
      }

      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const transactionsResult =
          await walletService.getTransactions(addressToUse);
        setTransactions(transactionsResult || []);
        setHasInitialLoad(true);
        return transactionsResult || [];
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch transactions";

        setError(errorMessage);

        if (!hasInitialLoad) {
          setTransactions([]);
        }
        return [];
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    },
    [
      canFetch,
      authState.address,
      hasInitialLoad,
      connectionStatus,
    ]
  );

  useEffect(() => {
    if (!canFetch) {
      setTransactions([]);
      setError(null);
      setHasInitialLoad(false);
      fetchingRef.current = false;
    }
  }, [canFetch]);

  useEffect(() => {
    if (
      autoFetch &&
      canFetch &&
      !hasInitialLoad &&
      !isLoading &&
      !fetchingRef.current
    ) {
      fetchTransactions();
    }
  }, [
    autoFetch,
    canFetch,
    hasInitialLoad,
    isLoading,
    fetchTransactions,
  ]);

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

      if (
        !authState.isFullyAuthenticated ||
        !authState.hasValidSession
      ) {
        const result = {
          success: false,
          message:
            "Wallet not authenticated. Please unlock your wallet.",
        };
        setError(result.message);
        return result;
      }

      const senderAddress =
        fromAddress || authState.address;

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
      authState.isFullyAuthenticated,
      authState.hasValidSession,
      authState.address,
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

      if (
        !authState.isFullyAuthenticated ||
        !authState.hasValidSession
      ) {
        const result = {
          success: false,
          message:
            "Wallet not authenticated. Please unlock your wallet.",
        };
        setError(result.message);
        return result;
      }

      const senderAddress =
        fromAddress || authState.address;

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
      authState.isFullyAuthenticated,
      authState.hasValidSession,
      authState.address,
    ]
  );

  const getTransactions = useCallback(
    async (
      targetAddress?: string
    ): Promise<TransactionData[]> => {
      return await fetchTransactions(targetAddress);
    },
    [fetchTransactions]
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
      data?: string
    ): Promise<string> => {
      if (!to || !value) {
        setError("Invalid gas estimation parameters");
        return "21000";
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
    []
  );

  const hasValidAddress = useCallback(() => {
    return Boolean(
      authState.address &&
        authState.isFullyAuthenticated &&
        authState.hasValidSession
    );
  }, [
    authState.address,
    authState.isFullyAuthenticated,
    authState.hasValidSession,
  ]);

  return {
    transactions,
    isLoading,
    error,
    hasInitialLoad,
    address: authState.address,
    hasValidAddress,
    sendEth,
    sendToken,
    getTransactions,
    refetch: fetchTransactions,
    waitForTransaction,
    estimateGas,
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
  const transactions = useWalletTransactions({
    autoFetch: false,
  });
  const tokens = useWalletTokens();
  const nfts = useWalletNFTs({ autoFetch: false });
  const network = useWalletNetwork();

  const isReady = useMemo(
    () =>
      wallet.isFullyAuthenticated &&
      wallet.hasValidSession &&
      network.connectionStatus === "connected",
    [
      wallet.isFullyAuthenticated,
      wallet.hasValidSession,
      network.connectionStatus,
    ]
  );

  const isAnyLoading = useMemo(
    () =>
      wallet.isAuthLoading ||
      balance.isLoading ||
      transactions.isLoading ||
      tokens.isLoading ||
      nfts.isLoading ||
      network.isLoading ||
      network.isSwitching,
    [
      wallet.isAuthLoading,
      balance.isLoading,
      transactions.isLoading,
      tokens.isLoading,
      nfts.isLoading,
      network.isLoading,
      network.isSwitching,
    ]
  );

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
      // Error handled silently
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
    hasInitialTokens: tokens.hasInitialLoad,
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
