import React from "react";
import {
  Send,
  Clock,
  CreditCard,
  TrendingUp,
  Zap,
  Activity,
} from "lucide-react";
import {
  NetworkConfig,
  NetworkStatus,
} from "@/lib/types/wallet";

interface BalanceCardProps {
  walletData: {
    formattedEthBalance: string;
    usdBalance?: number;
    network: NetworkConfig | null;
  };
  networkStatus: NetworkStatus | null;
  openSendModal: () => void;
  formatGasPrice: (
    gasPriceInWei: string | number | undefined,
    unit?: string,
    decimals?: number
  ) => string;
}

export default function BalanceCard({
  walletData,
  networkStatus,
  openSendModal,
  formatGasPrice,
}: BalanceCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-900/20 border border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/10 p-8 mb-8">
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Total Portfolio Value
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {walletData.network?.name || "Ethereum"}
              </p>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={openSendModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>

        {/* Balance Display */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {walletData.formattedEthBalance}
            </span>
            <span className="text-2xl font-semibold text-purple-400">
              {walletData.network?.nativeCurrency?.symbol ||
                "ETH"}
            </span>
          </div>

          {walletData.usdBalance !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xl text-slate-400">
                $
                {walletData.usdBalance.toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
              <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                USD
              </span>
            </div>
          )}
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Block Info */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/60 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Latest Block
                </p>
                <p className="text-xs text-slate-500">
                  Network activity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-semibold text-white">
                #
                {networkStatus?.blockNumber?.toLocaleString() ||
                  "Loading..."}
              </span>
            </div>
          </div>

          {/* Gas Price */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/60 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Gas Price
                </p>
                <p className="text-xs text-slate-500">
                  Current network fee
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-semibold text-white">
                {formatGasPrice(
                  networkStatus?.gasPrice?.toString()
                ) || "Loading..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
