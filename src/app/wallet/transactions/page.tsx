"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  ArrowUpRight,
  Search,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatEther,
  formatTimestamp,
} from "@/lib/utils/index";
import { TransactionData } from "@/lib/types/wallet";
import {
  useWallet,
  useWalletTransactions,
  useWalletNetwork,
} from "@/lib/hooks/useWallet";
import { useRouter } from "next/navigation";
import CenterContainer from "@/components/CenterContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TransactionsPage() {
  const router = useRouter();

  const { isFullyAuthenticated, address, hasHydrated } =
    useWallet();

  const { getTransactions, error: transactionError } =
    useWalletTransactions();

  const { currentNetwork, connectionStatus } =
    useWalletNetwork();

  const [transactions, setTransactions] = useState<
    TransactionData[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<
    string | null
  >(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] =
    useState(false);

  const isAuthenticated = isFullyAuthenticated && address;
  const isConnected = connectionStatus === "connected";
  const canFetchData = isAuthenticated && isConnected;

  const fetchTransactions = useCallback(async () => {
    if (!canFetchData || !address) return;

    setIsLoadingTransactions(true);
    setHasAttemptedLoad(true);

    try {
      const txs = await getTransactions(address);
      setTransactions(txs || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Transaction History", {
        description:
          "Unable to load transaction history. Please try refreshing the page.",
      });
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [canFetchData, address, getTransactions]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push("/connect");
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!canFetchData) {
      setHasAttemptedLoad(false);
      setTransactions([]);
    }
  }, [canFetchData, isAuthenticated, isConnected]);

  useEffect(() => {
    if (
      canFetchData &&
      !hasAttemptedLoad &&
      !isLoadingTransactions
    ) {
      fetchTransactions();
    }
  }, [
    canFetchData,
    hasAttemptedLoad,
    isLoadingTransactions,
    fetchTransactions,
  ]);

  const filteredTransactions = (transactions || []).filter(
    (tx) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        tx.hash.toLowerCase().includes(search) ||
        tx.to?.toLowerCase().includes(search) ||
        tx.from?.toLowerCase().includes(search)
      );
    }
  );

  const getTransactionIcon = (tx: TransactionData) => {
    const isIncoming =
      tx.isIncoming ||
      (address &&
        tx.to?.toLowerCase() === address.toLowerCase());
    return isIncoming ? (
      <ArrowUpRight className="text-crypto-emerald rotate-180 h-5 w-5" />
    ) : (
      <ArrowUpRight className="text-crypto-orange h-5 w-5" />
    );
  };

  const getTransactionValue = (
    tx: TransactionData
  ): string => {
    const isIncoming =
      tx.isIncoming ||
      (address &&
        tx.to?.toLowerCase() === address.toLowerCase());
    const prefix = isIncoming ? "+" : "-";
    const formattedValue = formatEther(BigInt(tx.value));
    return `${prefix}${formattedValue}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return (
          <CheckCircle className="h-4 w-4 text-crypto-emerald" />
        );
      case "failed":
        return (
          <AlertCircle className="h-4 w-4 text-crypto-orange" />
        );
      default:
        return (
          <Clock className="h-4 w-4 text-crypto-cyan" />
        );
    }
  };

  const copyToClipboard = async (
    text: string,
    hash: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      toast.success("Copied", {
        description: "Transaction hash copied to clipboard",
      });
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      toast.error("Copy Failed", {
        description:
          "Unable to copy to clipboard. Please try again.",
      });
    }
  };

  const truncateHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const handleRefresh = async () => {
    try {
      await fetchTransactions();
      toast.success("Refreshed", {
        description:
          "Transaction history updated successfully",
      });
    } catch {
      // Silent error handling
    }
  };

  // Show loading while waiting for store hydration
  if (!hasHydrated) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  // Show loading while fetching initial data
  if (isLoadingTransactions && transactions.length === 0) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-[var(--text-primary)] mx-auto sm:px-6 lg:px-8 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Transaction History
          </h1>
          <p className="text-[var(--text-secondary)]">
            View your recent transactions
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by hash or address..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-crypto-cyan focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && isAuthenticated && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-yellow-400">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Network not connected. Please check your
              connection.
            </div>
          </div>
        )}

        {/* Error State */}
        {transactionError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-crypto-orange">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {transactionError}
              </div>
              <button
                onClick={handleRefresh}
                className="text-sm underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Transaction Count */}
        {filteredTransactions.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {filteredTransactions.length} of{" "}
              {transactions?.length || 0} transactions
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoadingTransactions}
              className="text-sm text-crypto-cyan hover:text-crypto-blue disabled:opacity-50"
            >
              {isLoadingTransactions
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>
        )}

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-lg divide-y divide-[var(--border-primary)] border border-[var(--border-primary)]">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-6 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-secondary)]">
                      {getTransactionIcon(tx)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {tx.isIncoming ||
                          (address &&
                            tx.to?.toLowerCase() ===
                              address.toLowerCase())
                            ? "Received"
                            : "Sent"}
                        </h3>
                        {getStatusIcon(tx.status)}
                      </div>

                      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <span>Hash:</span>
                          <span className="font-mono">
                            {truncateHash(tx.hash)}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                tx.hash,
                                tx.hash
                              )
                            }
                            className="text-crypto-cyan hover:text-crypto-blue transition-colors"
                          >
                            {copiedHash === tx.hash ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        <div>
                          {tx.isIncoming ||
                          (address &&
                            tx.to?.toLowerCase() ===
                              address.toLowerCase())
                            ? `From: ${truncateHash(
                                tx.from
                              )}`
                            : `To: ${truncateHash(
                                tx.to || ""
                              )}`}
                        </div>

                        <div>
                          {formatTimestamp(tx.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        tx.isIncoming ||
                        (address &&
                          tx.to?.toLowerCase() ===
                            address.toLowerCase())
                          ? "text-crypto-emerald"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {getTransactionValue(tx)}{" "}
                      {currentNetwork?.nativeCurrency
                        ?.symbol || "ETH"}
                    </div>

                    {currentNetwork?.explorerUrl && (
                      <a
                        href={`${currentNetwork.explorerUrl}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-crypto-cyan hover:text-crypto-blue mt-2 transition-colors"
                      >
                        View on Explorer
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}

                    {tx.gasUsed && (
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Gas:{" "}
                        {parseInt(
                          tx.gasUsed
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <Clock className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
              {!canFetchData
                ? "Connecting..."
                : hasAttemptedLoad
                ? "No transactions found"
                : "Loading transactions..."}
            </h3>
            <p className="mb-4">
              {searchTerm
                ? "Try adjusting your search criteria"
                : !canFetchData
                ? "Please wait while we establish connection"
                : hasAttemptedLoad
                ? "Your transaction history will appear here"
                : "Please wait while we load your transaction history"}
            </p>

            {hasAttemptedLoad && canFetchData && (
              <button
                onClick={handleRefresh}
                disabled={isLoadingTransactions}
                className="px-6 py-2 bg-crypto-gradient hover:opacity-80 disabled:opacity-50 rounded-lg transition-opacity"
              >
                {isLoadingTransactions
                  ? "Loading..."
                  : "Retry Loading"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
