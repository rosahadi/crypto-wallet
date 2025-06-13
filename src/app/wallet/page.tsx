"use client";
import React, {
  useState,
  useCallback,
  useEffect,
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
import { useWalletStore } from "@/lib/store/WalletAuthStore";
import { useWalletComposite } from "@/lib/hooks/useWallet";
import LoadingSpinner from "@/components/LoadingSpinner";
import CenterContainer from "@/components/CenterContainer";

export default function WalletPage() {
  const router = useRouter();

  const { isFullyAuthenticated, address, hasHydrated } =
    useWalletStore();

  const {
    balance,
    tokens,
    nfts,
    networkStatus,
    currentNetwork,
    isReady,
    isAnyLoading,
    hasInitialBalance,
    sendEth,
    sendToken,
    estimateGas,
    getFeeData,
    getTransactions,
    refetchAll,
    refetchBalance,
    errors,
  } = useWalletComposite();

  const [activeTab, setActiveTab] = useState("tokens");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] =
    useState<Token | null>(null);
  const [transactions, setTransactions] = useState<
    TransactionData[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState(false);
  const [transactionError, setTransactionError] = useState<
    string | null
  >(null);

  const [dataLoadStatus, setDataLoadStatus] = useState({
    balance: false,
    tokens: false,
    nfts: false,
    transactions: false,
    initialLoadComplete: false,
  });

  const fetchingRef = useRef({
    transactions: false,
    initialLoad: false,
  });

  const [sendFormData, setSendFormData] = useState({
    toAddress: "",
    amount: "",
  });
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

  const isAuthenticated = useCallback(() => {
    return isFullyAuthenticated() && address && hasHydrated;
  }, [isFullyAuthenticated, address, hasHydrated]);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated() || !address || !isReady) {
      return;
    }

    if (fetchingRef.current.transactions) {
      return;
    }

    fetchingRef.current.transactions = true;
    setIsLoadingTransactions(true);
    setTransactionError(null);

    try {
      const txs = await getTransactions(address);

      setTransactions(txs);
      setDataLoadStatus((prev) => ({
        ...prev,
        transactions: true,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch transactions";

      setTransactionError(errorMessage);
      toast.error("Transaction History", {
        description:
          "Unable to load transaction history. Please try refreshing.",
      });
    } finally {
      setIsLoadingTransactions(false);
      fetchingRef.current.transactions = false;
    }
  }, [isAuthenticated, getTransactions, address, isReady]);

  const handleRefresh = useCallback(async () => {
    if (!isAuthenticated() || !isReady) {
      return;
    }

    try {
      setDataLoadStatus((prev) => ({
        ...prev,
        balance: false,
        tokens: false,
        nfts: false,
        transactions: false,
      }));

      await refetchBalance();
      setDataLoadStatus((prev) => ({
        ...prev,
        balance: true,
      }));

      await refetchAll();
      setDataLoadStatus((prev) => ({
        ...prev,
        tokens: true,
        nfts: true,
      }));

      await fetchTransactions();
    } catch (error) {
      // Silent error handling for refresh operations
      // User doesn't need to be notified of background refresh failures
    }
  }, [
    isAuthenticated,
    isReady,
    refetchAll,
    refetchBalance,
    fetchTransactions,
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (
        !isAuthenticated() ||
        !isReady ||
        dataLoadStatus.initialLoadComplete ||
        fetchingRef.current.initialLoad
      ) {
        return;
      }

      fetchingRef.current.initialLoad = true;

      try {
        if (!dataLoadStatus.balance && !hasInitialBalance) {
          await refetchBalance();
          setDataLoadStatus((prev) => ({
            ...prev,
            balance: true,
          }));
        }

        if (
          !dataLoadStatus.tokens ||
          !dataLoadStatus.nfts
        ) {
          await refetchAll();
          setDataLoadStatus((prev) => ({
            ...prev,
            tokens: true,
            nfts: true,
          }));
        }

        if (!dataLoadStatus.transactions) {
          await fetchTransactions();
        }

        setDataLoadStatus((prev) => ({
          ...prev,
          initialLoadComplete: true,
        }));
      } catch (error) {
        // Silent error handling for initial data load
        // Component will still render with available data
      } finally {
        fetchingRef.current.initialLoad = false;
      }
    };

    loadInitialData();
  }, [
    isAuthenticated,
    isReady,
    dataLoadStatus.initialLoadComplete,
    dataLoadStatus.balance,
    dataLoadStatus.tokens,
    dataLoadStatus.nfts,
    dataLoadStatus.transactions,
    hasInitialBalance,
    refetchBalance,
    refetchAll,
    fetchTransactions,
  ]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated()) {
      router.push("/connect");
      return;
    }
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    if (!isAuthenticated()) return;

    let hasHandledReload = false;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (
        hasHandledReload ||
        !isAuthenticated() ||
        !isReady
      ) {
        return;
      }

      if (
        event.persisted ||
        (window.performance &&
          window.performance.getEntriesByType &&
          window.performance.getEntriesByType("navigation")
            .length > 0 &&
          (
            window.performance.getEntriesByType(
              "navigation"
            )[0] as PerformanceNavigationTiming
          ).type === "reload")
      ) {
        hasHandledReload = true;

        setTimeout(async () => {
          setDataLoadStatus({
            balance: false,
            tokens: false,
            nfts: false,
            transactions: false,
            initialLoadComplete: false,
          });

          await handleRefresh();
        }, 200);
      }
    };

    const handlePopState = () => {
      if (!isAuthenticated() || !isReady) return;
      setTimeout(() => handleRefresh(), 200);
    };

    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        isAuthenticated() &&
        isReady &&
        dataLoadStatus.initialLoadComplete
      ) {
        const hasStaleData =
          !balance ||
          balance === "0" ||
          !tokens ||
          tokens.length === 0 ||
          !nfts ||
          transactions.length === 0;

        if (hasStaleData) {
          handleRefresh();
        } else {
          refetchBalance();
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        handlePageShow
      );
      window.removeEventListener(
        "popstate",
        handlePopState
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    isAuthenticated,
    isReady,
    handleRefresh,
    refetchBalance,
    balance,
    tokens,
    nfts,
    transactions,
    dataLoadStatus.initialLoadComplete,
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

  const openSendModal = useCallback(
    (token: Token | null = null) => {
      setSelectedToken(token);
      setSendModalOpen(true);
      setSendFormData({ toAddress: "", amount: "" });
      setTransactionResult(null);
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

  useEffect(() => {
    if (
      sendModalOpen &&
      sendFormData.toAddress &&
      sendFormData.amount
    ) {
      const loadFee = async () => {
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
          // Silent error handling for fee estimation
          // Network fee will remain null and UI will handle gracefully
          setNetworkFee(null);
        } finally {
          setLoadingFee(false);
        }
      };

      const timeoutId = setTimeout(loadFee, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    sendModalOpen,
    sendFormData.toAddress,
    sendFormData.amount,
    getFeeData,
    estimateGas,
  ]);

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

      const walletAddress = address;

      if (!walletAddress) {
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
        walletAddress.toLowerCase() ===
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
          // Pass the wallet address explicitly as fromAddress
          result = await sendToken(
            formData.tokenAddress,
            formData.toAddress,
            formData.amount,
            walletAddress
          );
        } else {
          result = await sendEth(
            formData.toAddress,
            formData.amount,
            walletAddress
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

          setTimeout(async () => {
            await refetchBalance();
            await refetchAll();
            await fetchTransactions();
          }, 2000);
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
    [
      address,
      sendEth,
      sendToken,
      refetchBalance,
      refetchAll,
      fetchTransactions,
    ]
  );

  const navigateToTransactions = useCallback(() => {
    router.push("/wallet/transactions");
  }, [router]);

  const getCurrentNetwork = useCallback(() => {
    return currentNetwork;
  }, [currentNetwork]);

  if (!hasHydrated) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  if (!isAuthenticated()) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  if (!address) {
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

  const isLoading = isAnyLoading || isLoadingTransactions;
  const shouldShowLoading =
    !isReady ||
    (!dataLoadStatus.initialLoadComplete &&
      !hasInitialBalance &&
      !dataLoadStatus.balance &&
      isLoading);

  if (shouldShowLoading) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  const walletData = {
    address,
    ethBalance: balance || "0",
    formattedEthBalance: formatBalance(balance || "0"),
    tokens: tokens || [],
    nfts: nfts || [],
    transactions: transactions || [],
    network: getCurrentNetwork(),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BalanceCard
          walletData={walletData}
          networkStatus={networkStatus}
          openSendModal={openSendModal}
          formatGasPrice={formatGasPrice}
        />

        <TabsContainer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
