"use client";
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TabsContainer from "@/components/dashboard/TabsContainer";
import SendModal from "@/components/dashboard/SendModal";
import Web3Card from "@/components/Web3Card";
import {
  formatGasPrice,
  formatEther,
} from "@/lib/utils/index";
import {
  Token,
  TransactionData,
  WalletOpResult,
} from "@/lib/types/wallet";
import {
  useWallet,
  useWalletBalance,
  useWalletTransactions,
  useWalletTokens,
  useWalletNFTs,
  useWalletNetwork,
} from "@/lib/hooks/useWallet";
import LoadingSpinner from "@/components/LoadingSpinner";
import CenterContainer from "@/components/CenterContainer";

export default function WalletPage() {
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const lastFetchTimestamp = useRef<Record<string, number>>(
    {}
  );

  // Use individual hooks for better control
  const {
    isFullyAuthenticated,
    hasValidSession,
    address,
    hasHydrated,
  } = useWallet();

  const {
    balance,
    refetch: refetchBalance,
    hasInitialLoad: hasInitialBalance,
  } = useWalletBalance();

  const { tokens, refetch: refetchTokens } =
    useWalletTokens();

  const { nfts, refetch: refetchNfts } = useWalletNFTs({
    autoFetch: false,
  });

  const {
    sendEth,
    sendToken,
    estimateGas,
    getTransactions,
  } = useWalletTransactions();

  const {
    currentNetwork,
    connectionStatus,
    networkStatus,
    getFeeData,
    isLoading: isNetworkLoading,
  } = useWalletNetwork();

  const [activeTab, setActiveTab] = useState("tokens");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] =
    useState<Token | null>(null);
  const [transactions, setTransactions] = useState<
    TransactionData[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState(false);
  const [sendingTransaction, setSendingTransaction] =
    useState(false);
  const [transactionResult, setTransactionResult] =
    useState<{
      success: boolean;
      message?: string;
      txHash?: string;
    } | null>(null);
  const [networkFee, setNetworkFee] = useState<{
    eth: string;
    wei: string;
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  } | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [sendFormData, setSendFormData] = useState({
    toAddress: "",
    amount: "",
  });
  const [
    hasAttemptedConnection,
    setHasAttemptedConnection,
  ] = useState(false);

  const [tabLoadStates, setTabLoadStates] = useState<{
    tokens: { loaded: boolean; loading: boolean };
    nfts: { loaded: boolean; loading: boolean };
    transactions: { loaded: boolean; loading: boolean };
  }>({
    tokens: { loaded: false, loading: false },
    nfts: { loaded: false, loading: false },
    transactions: { loaded: false, loading: false },
  });

  // Stable memoized values to prevent re-renders
  const authState = useMemo(
    () => ({
      isAuthenticated:
        isFullyAuthenticated &&
        hasValidSession &&
        !!address,
      address,
      hasHydrated,
    }),
    [
      isFullyAuthenticated,
      hasValidSession,
      address,
      hasHydrated,
    ]
  );

  const connectionState = useMemo(
    () => ({
      isConnected: connectionStatus === "connected",
      connectionStatus,
      networkStatus,
      isLoading: isNetworkLoading,
    }),
    [connectionStatus, networkStatus, isNetworkLoading]
  );

  const canFetchData = useMemo(() => {
    return (
      authState.isAuthenticated &&
      connectionState.isConnected
    );
  }, [
    authState.isAuthenticated,
    connectionState.isConnected,
  ]);

  // Check if we're still initializing (network connecting, etc.)
  const isInitializing = useMemo(() => {
    return (
      !authState.hasHydrated ||
      connectionState.isLoading ||
      (authState.isAuthenticated &&
        connectionState.connectionStatus ===
          "connecting") ||
      (authState.isAuthenticated && !hasAttemptedConnection)
    );
  }, [
    authState.hasHydrated,
    authState.isAuthenticated,
    connectionState.isLoading,
    connectionState.connectionStatus,
    hasAttemptedConnection,
  ]);

  const formatBalance = useCallback(
    (bal: string): string => {
      try {
        const formatted = formatEther(bal);
        return parseFloat(formatted).toFixed(6);
      } catch {
        return "0.000000";
      }
    },
    []
  );

  const walletData = useMemo(
    () => ({
      address: authState.address || "",
      ethBalance: balance || "0",
      formattedEthBalance: formatBalance(balance || "0"),
      tokens: tokens || [],
      nfts: nfts || [],
      transactions: transactions || [],
      network: currentNetwork,
    }),
    [
      authState.address,
      balance,
      tokens,
      nfts,
      transactions,
      currentNetwork,
      formatBalance,
    ]
  );

  // Cache helper to prevent duplicate requests
  const shouldFetch = useCallback(
    (tabName: string, cacheTime = 30000) => {
      const lastFetch = lastFetchTimestamp.current[tabName];
      const now = Date.now();
      return !lastFetch || now - lastFetch > cacheTime;
    },
    []
  );

  const fetchTransactions = useCallback(async () => {
    if (
      !canFetchData ||
      !authState.address ||
      isLoadingTransactions ||
      !shouldFetch("transactions")
    ) {
      return;
    }

    console.log("Fetching transactions...");
    setIsLoadingTransactions(true);
    setTabLoadStates((prev) => ({
      ...prev,
      transactions: { ...prev.transactions, loading: true },
    }));

    try {
      const txs = await getTransactions(authState.address);
      setTransactions(txs || []);
      lastFetchTimestamp.current.transactions = Date.now();
      setTabLoadStates((prev) => ({
        ...prev,
        transactions: { loaded: true, loading: false },
      }));
    } catch {
      toast.error("Transaction History", {
        description:
          "Unable to load transaction history. Please try refreshing.",
      });
      setTransactions([]);
      setTabLoadStates((prev) => ({
        ...prev,
        transactions: { loaded: false, loading: false },
      }));
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [
    canFetchData,
    authState.address,
    getTransactions,
    isLoadingTransactions,
    shouldFetch,
  ]);

  const fetchNFTs = useCallback(async () => {
    if (
      !canFetchData ||
      tabLoadStates.nfts.loading ||
      !shouldFetch("nfts")
    ) {
      return;
    }

    console.log("Fetching NFTs...");
    setTabLoadStates((prev) => ({
      ...prev,
      nfts: { ...prev.nfts, loading: true },
    }));

    try {
      await refetchNfts();
      lastFetchTimestamp.current.nfts = Date.now();
      setTabLoadStates((prev) => ({
        ...prev,
        nfts: { loaded: true, loading: false },
      }));
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
      toast.error("NFTs", {
        description:
          "Unable to load NFTs. Please try again.",
      });
      setTabLoadStates((prev) => ({
        ...prev,
        nfts: { loaded: false, loading: false },
      }));
    }
  }, [
    canFetchData,
    tabLoadStates.nfts.loading,
    shouldFetch,
    refetchNfts,
  ]);

  // Optimized tab change handler with lazy loading
  const handleTabChange = useCallback(
    async (newTab: string) => {
      setActiveTab(newTab);

      // Only fetch data if not already loaded or loading
      if (!canFetchData) return;

      switch (newTab) {
        case "tokens":
          // Tokens are always loaded on mount, but refresh if stale
          if (shouldFetch("tokens", 60000)) {
            // 1 minute cache for tokens
            lastFetchTimestamp.current.tokens = Date.now();
            refetchTokens();
          }
          break;
        case "nfts":
          if (
            !tabLoadStates.nfts.loaded &&
            !tabLoadStates.nfts.loading
          ) {
            await fetchNFTs();
          }
          break;
        case "transactions":
          if (
            !tabLoadStates.transactions.loaded &&
            !tabLoadStates.transactions.loading
          ) {
            await fetchTransactions();
          }
          break;
      }
    },
    [
      canFetchData,
      shouldFetch,
      tabLoadStates,
      fetchNFTs,
      fetchTransactions,
      refetchTokens,
    ]
  );

  // Optimized refresh function
  const handleRefresh = useCallback(async () => {
    if (!canFetchData || isRefreshingRef.current) return;

    console.log("Manual refresh triggered");
    isRefreshingRef.current = true;

    try {
      // Always refresh balance
      await refetchBalance();

      // Clear cache timestamps to force fresh data
      lastFetchTimestamp.current = {};

      // Refresh current tab data
      switch (activeTab) {
        case "tokens":
          await refetchTokens();
          break;
        case "nfts":
          if (tabLoadStates.nfts.loaded) {
            await fetchNFTs();
          }
          break;
        case "transactions":
          if (tabLoadStates.transactions.loaded) {
            await fetchTransactions();
          }
          break;
      }

      toast.success("Refreshed", {
        description: "Wallet data updated successfully",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Refresh Failed", {
        description:
          "Unable to refresh wallet data. Please try again.",
      });
    } finally {
      isRefreshingRef.current = false;
    }
  }, [
    canFetchData,
    refetchBalance,
    refetchTokens,
    fetchNFTs,
    fetchTransactions,
    activeTab,
    tabLoadStates,
  ]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authState.hasHydrated) return;

    if (!authState.isAuthenticated) {
      console.log(
        "Not authenticated, redirecting to connect"
      );
      router.push("/connect");
    }
  }, [
    authState.hasHydrated,
    authState.isAuthenticated,
    router,
  ]);

  // Handle connection attempt timing
  useEffect(() => {
    if (
      authState.isAuthenticated &&
      authState.hasHydrated
    ) {
      const timer = setTimeout(() => {
        setHasAttemptedConnection(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setHasAttemptedConnection(false);
    }
  }, [authState.isAuthenticated, authState.hasHydrated]);

  // Initialize tokens (default tab) when ready
  useEffect(() => {
    if (
      canFetchData &&
      !hasInitializedRef.current &&
      !tabLoadStates.tokens.loaded &&
      !tabLoadStates.tokens.loading
    ) {
      console.log("Initializing tokens (default tab)");
      hasInitializedRef.current = true;
      lastFetchTimestamp.current.tokens = Date.now();
      setTabLoadStates((prev) => ({
        ...prev,
        tokens: { loaded: true, loading: false },
      }));
    }
  }, [canFetchData, tabLoadStates.tokens]);

  // Handle visibility changes for refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        canFetchData &&
        hasInitialBalance &&
        shouldFetch("visibility", 60000)
      ) {
        console.log("Page visible, scheduling refresh...");
        lastFetchTimestamp.current.visibility = Date.now();
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleRefresh();
        }, 2000);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      clearTimeout(timeoutId);
    };
  }, [
    canFetchData,
    hasInitialBalance,
    handleRefresh,
    shouldFetch,
  ]);

  // Modal functions
  const openSendModal = useCallback(
    (token: Token | null = null) => {
      setSelectedToken(token);
      setSendModalOpen(true);
      setSendFormData({ toAddress: "", amount: "" });
      setTransactionResult(null);
      setNetworkFee(null);
    },
    []
  );

  const closeSendModal = useCallback(() => {
    setSendModalOpen(false);
    setSelectedToken(null);
    setSendFormData({ toAddress: "", amount: "" });
    setTransactionResult(null);
    setNetworkFee(null);
  }, []);

  const handleFormChange = useCallback(
    (field: string, value: string) => {
      setSendFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const navigateToTransactions = useCallback(() => {
    router.push("/wallet/transactions");
  }, [router]);

  // Fee estimation effect
  useEffect(() => {
    if (
      !sendModalOpen ||
      !sendFormData.toAddress ||
      !sendFormData.amount
    ) {
      setNetworkFee(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingFee(true);
      try {
        const feeData = await getFeeData();
        const gasEstimate = await estimateGas(
          sendFormData.toAddress,
          sendFormData.amount
        );

        const gasLimitBigInt = BigInt(gasEstimate);
        const maxFeePerGasBigInt = BigInt(
          feeData.maxFeePerGas || "0"
        );
        const totalFeeBigInt =
          gasLimitBigInt * maxFeePerGasBigInt;

        setNetworkFee({
          eth: formatEther(totalFeeBigInt.toString()),
          wei: totalFeeBigInt.toString(),
          gasLimit: gasEstimate,
          maxFeePerGas: feeData.maxFeePerGas || "0",
          maxPriorityFeePerGas:
            feeData.maxPriorityFeePerGas || "0",
        });
      } catch (error) {
        console.error("Fee estimation failed:", error);
        setNetworkFee(null);
      } finally {
        setLoadingFee(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    sendModalOpen,
    sendFormData.toAddress,
    sendFormData.amount,
    getFeeData,
    estimateGas,
  ]);

  // Send transaction function
  const handleSendSubmit = useCallback(
    async (
      e: React.FormEvent,
      formData: {
        toAddress: string;
        amount: string;
        tokenAddress?: string;
        fromAddress: string;
      }
    ) => {
      e.preventDefault();

      if (!authState.address) {
        toast.error("Wallet Error", {
          description:
            "Wallet address not available. Please reconnect your wallet.",
        });
        return;
      }

      if (!formData.toAddress || !formData.amount) {
        toast.error("Invalid Input", {
          description:
            "Please fill in all required fields.",
        });
        return;
      }

      if (
        authState.address.toLowerCase() ===
        formData.toAddress.toLowerCase()
      ) {
        toast.error("Invalid Recipient", {
          description: "Cannot send to the same address.",
        });
        return;
      }

      setSendingTransaction(true);
      setTransactionResult(null);

      try {
        let result: WalletOpResult;

        if (formData.tokenAddress) {
          result = await sendToken(
            formData.tokenAddress,
            formData.toAddress,
            formData.amount,
            authState.address
          );
        } else {
          result = await sendEth(
            formData.toAddress,
            formData.amount,
            authState.address
          );
        }

        setTransactionResult(result);

        if (result.success) {
          toast.success("Transaction Sent", {
            description: `Transaction submitted successfully${
              result?.data?.txHash
                ? `. Hash: ${result?.data?.txHash.slice(
                    0,
                    10
                  )}...`
                : ""
            }`,
          });

          setSendFormData({ toAddress: "", amount: "" });

          // Clear cache and refresh data after successful transaction
          lastFetchTimestamp.current = {};
          setTimeout(() => {
            handleRefresh();
          }, 3000);
        } else {
          toast.error("Transaction Failed", {
            description:
              result.message ||
              "Transaction failed. Please try again.",
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again.";
        toast.error("Transaction Error", {
          description: errorMessage,
        });
        setTransactionResult({
          success: false,
          message: errorMessage,
        });
      } finally {
        setSendingTransaction(false);
      }
    },
    [authState.address, sendEth, sendToken, handleRefresh]
  );

  if (isInitializing || !authState.isAuthenticated) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  if (!authState.address) {
    return (
      <CenterContainer>
        <Web3Card
          variant="crypto"
          className="text-center max-w-md"
        >
          <h2 className="text-xl mb-4 text-white">
            Wallet Error
          </h2>
          <p className="mb-6 text-slate-300">
            No wallet address found. Please reconnect your
            wallet.
          </p>
          <button
            onClick={() => router.push("/connect")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-6 rounded-xl transition-all duration-200 font-medium"
          >
            Reconnect Wallet
          </button>
        </Web3Card>
      </CenterContainer>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Connection Status */}
        {!connectionState.isConnected &&
          !connectionState.isLoading &&
          authState.isAuthenticated &&
          !isInitializing &&
          hasAttemptedConnection &&
          connectionState.connectionStatus !==
            "connecting" && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-yellow-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>
                    Network not connected. Please check your
                    connection.
                  </span>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshingRef.current}
                  className="text-sm underline hover:no-underline disabled:opacity-50"
                >
                  {isRefreshingRef.current
                    ? "Retrying..."
                    : "Retry"}
                </button>
              </div>
            </div>
          )}

        <BalanceCard
          walletData={walletData}
          networkStatus={connectionState.networkStatus}
          openSendModal={openSendModal}
          formatGasPrice={formatGasPrice}
        />

        <TabsContainer
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          walletData={walletData}
          openSendModal={openSendModal}
          navigateToTransactions={navigateToTransactions}
        />
      </div>

      {sendModalOpen && (
        <SendModal
          walletData={walletData}
          selectedToken={selectedToken}
          transactionResult={transactionResult}
          sendingTransaction={sendingTransaction}
          networkFee={networkFee}
          loadingFee={loadingFee}
          sendFormData={sendFormData}
          onFormChange={handleFormChange}
          handleSendSubmit={handleSendSubmit}
          closeSendModal={closeSendModal}
        />
      )}
    </div>
  );
}
