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
import { useWalletComposite } from "@/lib/hooks/useWallet";
import { useWalletStore } from "@/lib/store/WalletAuthStore";
import { useRouter } from "next/navigation";
import CenterContainer from "@/components/CenterContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TransactionsPage() {
  const router = useRouter();

  const { isFullyAuthenticated, address, hasHydrated } =
    useWalletStore();

  const {
    currentNetwork,
    isReady,
    isAnyLoading,
    getTransactions,
    refetchAll,
    errors,
  } = useWalletComposite();

  const [transactions, setTransactions] = useState<
    TransactionData[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<
    string | null
  >(null);

  const isAuthenticated = useCallback(() => {
    return isFullyAuthenticated() && address;
  }, [isFullyAuthenticated, address]);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated() || !address) return;

    setIsLoadingTransactions(true);
    try {
      const txs = await getTransactions(address);
      setTransactions(txs);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch transactions";

      toast.error("Transaction History", {
        description:
          "Unable to load transaction history. Please try refreshing the page.",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isAuthenticated, address, getTransactions]);

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
    if (
      isAuthenticated() &&
      address &&
      hasHydrated &&
      isReady
    ) {
      fetchTransactions();
    }
  }, [
    isAuthenticated,
    address,
    hasHydrated,
    isReady,
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
    } catch (err) {
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
      await Promise.all([
        refetchAll(),
        fetchTransactions(),
      ]);
      toast.success("Refreshed", {
        description:
          "Transaction history updated successfully",
      });
    } catch (error) {
      // Silent error handling for refresh - the individual functions will handle their own errors
    }
  };

  // Get current error
  const hasError = Object.values(errors).some(
    (error) => error !== null
  );
  const errorMessage = Object.values(errors).find(
    (error) => error !== null
  );

  if (!hasHydrated) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  const isLoading = isAnyLoading || isLoadingTransactions;

  if (isLoading && transactions.length === 0) {
    return (
      <CenterContainer>
        <LoadingSpinner />
      </CenterContainer>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-[var(--text-primary)]  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 p-6">
      <div className="max-w-4xl mx-auto">
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

        {/* Error State */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-crypto-orange">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {errorMessage}
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
          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            Showing {filteredTransactions.length} of{" "}
            {transactions?.length || 0} transactions
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
              No transactions found
            </h3>
            <p>
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Your transaction history will appear here"}
            </p>
            {!address && isAuthenticated() && (
              <button
                onClick={handleRefresh}
                className="mt-4 px-6 py-2 bg-crypto-gradient hover:opacity-80 rounded-lg transition-opacity"
              >
                Load Wallet Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
