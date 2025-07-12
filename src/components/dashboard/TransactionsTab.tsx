import React, { JSX, useState } from "react";
import {
  ArrowUpRight,
  Clock,
  ChevronRight,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  TransactionData,
  WalletData,
} from "@/lib/types/wallet";
import {
  formatEther,
  formatTimestamp,
} from "@/lib/utils/index";

interface TransactionsTabProps {
  walletData: WalletData;
  navigateToTransactions: () => void;
}

export default function TransactionsTab({
  walletData,
  navigateToTransactions,
}: TransactionsTabProps) {
  const [copiedHash, setCopiedHash] = useState<
    string | null
  >(null);

  const getTransactionIcon = (
    tx: TransactionData
  ): JSX.Element => {
    const isIncoming = isReceiveTransaction(tx);
    return isIncoming ? (
      <ArrowUpRight className="text-crypto-emerald rotate-180 h-5 w-5" />
    ) : (
      <ArrowUpRight className="text-crypto-orange h-5 w-5" />
    );
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

  const isReceiveTransaction = (
    tx: TransactionData
  ): boolean => {
    if (tx.isIncoming) return true;
    if (tx.type === "receive") return true;

    if (walletData.address && tx.to) {
      return (
        tx.to.toLowerCase() ===
        walletData.address.toLowerCase()
      );
    }

    return false;
  };

  const getTransactionValue = (
    tx: TransactionData
  ): string => {
    const isIncoming = isReceiveTransaction(tx);
    const prefix = isIncoming ? "+" : "-";

    let formattedValue;
    try {
      if (
        tx.value &&
        (typeof tx.value === "string" ||
          typeof tx.value === "number")
      ) {
        formattedValue = formatEther(BigInt(tx.value));
      } else {
        formattedValue = tx.value || "0";
      }
    } catch {
      formattedValue = tx.value || "0";
    }

    return `${prefix}${formattedValue}`;
  };

  const getTokenSymbol = (tx: TransactionData): string => {
    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      const firstTransfer = tx.tokenTransfers[0];
      if (firstTransfer.symbol) {
        return firstTransfer.symbol;
      }
    }
    return (
      walletData.network?.nativeCurrency?.symbol || "ETH"
    );
  };

  const truncateHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const copyToClipboard = async (
    text: string,
    hash: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-4">
      {walletData.transactions &&
      walletData.transactions.length > 0 ? (
        <div>
          <div className="bg-[var(--bg-secondary)] rounded-lg divide-y divide-[var(--border-primary)] border border-[var(--border-primary)]">
            {walletData.transactions
              .slice(0, 4)
              .map((tx) => (
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
                            {isReceiveTransaction(tx)
                              ? "Received"
                              : "Sent"}
                          </h3>
                          {getStatusIcon(
                            tx.status || "success"
                          )}
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
                            {isReceiveTransaction(tx)
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
                          isReceiveTransaction(tx)
                            ? "text-crypto-emerald"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {getTransactionValue(tx)}{" "}
                        {getTokenSymbol(tx)}
                      </div>

                      {walletData.network?.explorerUrl && (
                        <a
                          href={`${walletData.network.explorerUrl}/tx/${tx.hash}`}
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

          <div className="mt-4 text-center">
            <button
              onClick={navigateToTransactions}
              className="inline-flex items-center px-4 py-2 text-sm bg-crypto-gradient hover:opacity-80 rounded-lg transition-opacity text-[var(--text-primary)]"
            >
              View All Transactions
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <Clock className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
            No transactions found
          </h3>
          <p>Your transaction history will appear here</p>
        </div>
      )}
    </div>
  );
}
