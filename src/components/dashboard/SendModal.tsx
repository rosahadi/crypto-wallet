"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { WalletData, Token } from "@/lib/types/wallet";

interface NetworkFee {
  eth: string;
  wei: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

interface TransactionResult {
  success: boolean;
  message?: string;
  txHash?: string;
  address?: string;
}

interface SendFormData {
  toAddress: string;
  amount: string;
}

interface SendModalProps {
  walletData: WalletData;
  selectedToken: Token | null;
  transactionResult: TransactionResult | null;
  sendingTransaction: boolean;
  networkFee: NetworkFee | null;
  loadingFee: boolean;
  sendFormData: SendFormData;
  onFormChange: (field: string, value: string) => void;
  handleSendSubmit: (
    e: React.FormEvent,
    formData: {
      toAddress: string;
      amount: string;
      tokenAddress?: string;
      fromAddress: string;
    }
  ) => Promise<void>;
  closeSendModal: () => void;
}

// Validation functions
const validateEthereumAddress = (
  address: string
): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateAmount = (
  amount: string,
  balance: string
): string | null => {
  if (!amount || amount === "") return "Amount is required";
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0)
    return "Amount must be greater than 0";
  if (numAmount > parseFloat(balance))
    return "Insufficient balance";
  return null;
};

const SendModal: React.FC<SendModalProps> = ({
  walletData,
  selectedToken,
  transactionResult,
  sendingTransaction,
  networkFee,
  loadingFee,
  sendFormData,
  onFormChange,
  handleSendSubmit,
  closeSendModal,
}) => {
  const [addressError, setAddressError] = useState<
    string | null
  >(null);
  const [amountError, setAmountError] = useState<
    string | null
  >(null);
  const [showTxDetails, setShowTxDetails] = useState(false);

  const tokenSymbol = selectedToken
    ? selectedToken.symbol
    : "ETH";
  const balance = selectedToken
    ? selectedToken.balance
    : walletData.ethBalance || "0";

  useEffect(() => {
    if (sendFormData.toAddress) {
      if (
        !validateEthereumAddress(sendFormData.toAddress)
      ) {
        setAddressError("Invalid Ethereum address format");
      } else {
        setAddressError(null);
      }
    } else {
      setAddressError(null);
    }
  }, [sendFormData.toAddress]);

  useEffect(() => {
    if (sendFormData.amount) {
      const error = validateAmount(
        sendFormData.amount,
        balance
      );
      setAmountError(error);
    } else {
      setAmountError(null);
    }
  }, [sendFormData.amount, balance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletData.address) return;
    if (addressError || amountError) return;
    if (!sendFormData.toAddress || !sendFormData.amount)
      return;

    handleSendSubmit(e, {
      toAddress: sendFormData.toAddress,
      amount: sendFormData.amount,
      tokenAddress: selectedToken?.address,
      fromAddress: walletData.address,
    });
  };

  const displayNetworkFee = () => {
    if (loadingFee) return "Calculating...";
    if (!networkFee) return "~0.0001 ETH";
    const ethFee = parseFloat(networkFee.eth).toFixed(6);
    return `${ethFee} ETH`;
  };

  const isFormValid =
    !addressError &&
    !amountError &&
    sendFormData.toAddress &&
    sendFormData.amount &&
    walletData.address;

  if (!walletData.address) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-slate-900/90 to-red-900/20 border border-red-500/30 rounded-2xl p-8 max-w-md w-full backdrop-blur-md shadow-2xl">
          {/* Error Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full animate-pulse"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="relative text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Wallet Error
            </h3>
            <p className="text-red-200 mb-6">
              Wallet address not available. Please reconnect
              your wallet.
            </p>
            <button
              onClick={closeSendModal}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900/95 to-purple-900/20 border border-purple-500/30 rounded-2xl max-w-lg w-full backdrop-blur-md shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Send {tokenSymbol}
                </h2>
                <p className="text-xs text-slate-400">
                  Transfer your crypto assets
                </p>
              </div>
            </div>
            <button
              onClick={closeSendModal}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transaction Result */}
          {transactionResult && (
            <div className="p-6 border-b border-slate-700/50">
              <div
                className={`
                rounded-xl p-4 border backdrop-blur-sm
                ${
                  transactionResult.success
                    ? "bg-emerald-900/20 border-emerald-500/30"
                    : "bg-red-900/20 border-red-500/30"
                }
              `}
              >
                <div className="flex items-start gap-3">
                  {transactionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      {transactionResult.message}
                    </p>
                    {transactionResult.txHash && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-400">
                          TX:
                        </span>
                        <code className="text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                          {transactionResult.txHash.slice(
                            0,
                            12
                          )}
                          ...
                          {transactionResult.txHash.slice(
                            -8
                          )}
                        </code>
                        <button
                          onClick={() =>
                            setShowTxDetails(!showTxDetails)
                          }
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recipient Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0x..."
                  value={sendFormData.toAddress}
                  onChange={(e) =>
                    onFormChange(
                      "toAddress",
                      e.target.value
                    )
                  }
                  disabled={sendingTransaction}
                  className={`
                    w-full bg-slate-800/50 border rounded-xl px-4 py-3 text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                    ${
                      addressError
                        ? "border-red-500/50"
                        : "border-slate-700/50"
                    }
                  `}
                />
              </div>
              {addressError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {addressError}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Amount
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={sendFormData.amount}
                  onChange={(e) =>
                    onFormChange("amount", e.target.value)
                  }
                  disabled={sendingTransaction}
                  className={`
                    w-full bg-slate-800/50 border rounded-xl px-4 py-3 pr-16 text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                    ${
                      amountError
                        ? "border-red-500/50"
                        : "border-slate-700/50"
                    }
                  `}
                />
              </div>
              {amountError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {amountError}
                </p>
              )}
            </div>

            {/* Network Fee */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Network Fee
                  </span>
                </div>
                {loadingFee && (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Estimated cost
                </span>
                <span className="text-sm font-semibold text-white">
                  {displayNetworkFee()}
                </span>
              </div>
            </div>

            {/* Transaction Summary */}
            {sendFormData.amount &&
              sendFormData.toAddress &&
              !addressError &&
              !amountError && (
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">
                      Transaction Summary
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        You're sending
                      </span>
                      <span className="text-white font-medium">
                        {sendFormData.amount} {tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Network fee
                      </span>
                      <span className="text-white font-medium">
                        {displayNetworkFee()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50 flex justify-between">
                      <span className="text-slate-300 font-medium">
                        Total cost
                      </span>
                      <span className="text-white font-bold">
                        {sendFormData.amount} {tokenSymbol}{" "}
                        + {displayNetworkFee()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || sendingTransaction}
              className={`
                w-full py-4 rounded-xl font-medium text-white transition-all duration-200
                ${
                  isFormValid && !sendingTransaction
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]"
                    : "bg-slate-700/50 cursor-not-allowed"
                }
              `}
            >
              {sendingTransaction ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Transaction...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  <span>Send {tokenSymbol}</span>
                </div>
              )}
            </button>

            {/* Security Notice */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>
                  Transaction will be processed securely on
                  the blockchain
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendModal;
