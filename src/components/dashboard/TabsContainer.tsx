import React from "react";
import { Coins, Grid, Activity } from "lucide-react";
import TokensTab from "@/components/dashboard/TokensTab";
import NFTsTab from "@/components/dashboard/NFTsTab";
import TransactionsTab from "@/components/dashboard/TransactionsTab";
import { Token, WalletData } from "@/lib/types/wallet";

interface TabsContainerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletData: WalletData;
  openSendModal: (token?: Token | null) => void;
  navigateToTransactions: () => void;
}

type TabType = "tokens" | "nfts" | "transactions";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  {
    id: "tokens",
    label: "Tokens",
    icon: <Coins className="w-4 h-4" />,
  },
  {
    id: "nfts",
    label: "NFTs",
    icon: <Grid className="w-4 h-4" />,
  },
  {
    id: "transactions",
    label: "Recent Activity",
    icon: <Activity className="w-4 h-4" />,
  },
];

export default function TabsContainer({
  activeTab,
  setActiveTab,
  walletData,
  openSendModal,
  navigateToTransactions,
}: TabsContainerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-900/20 border border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/10">
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

      <div className="relative p-6">
        {/* Tabs Header */}
        <div className="flex rounded-xl bg-slate-800/30 backdrop-blur-md border border-slate-700/50 p-1 mb-6">
          {tabs.map((tab: TabConfig) => (
            <button
              key={tab.id}
              className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex-1 justify-center
                ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 transform scale-105"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="relative flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">
                  {tab.label}
                </span>
                <span className="sm:hidden">
                  {tab.id === "tokens" && "Tokens"}
                  {tab.id === "nfts" && "NFTs"}
                  {tab.id === "transactions" && "Activity"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
          {activeTab === "tokens" && (
            <TokensTab
              walletData={walletData}
              openSendModal={openSendModal}
            />
          )}

          {activeTab === "nfts" && (
            <NFTsTab walletData={walletData} />
          )}

          {activeTab === "transactions" && (
            <TransactionsTab
              walletData={walletData}
              navigateToTransactions={
                navigateToTransactions
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
