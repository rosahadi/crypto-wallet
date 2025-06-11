"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Wallet,
  Key,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Alert } from "@/components/Alert";
import WalletCreatedView from "@/components/connectPage/WalletCreatedView";
import CreateWalletForm from "@/components/connectPage/CreateWalletForm";
import UnlockWalletForm from "@/components/connectPage/UnlockWalletForm";
import RecoverWalletForm from "@/components/connectPage/RecoverWalletForm";
import ImportWalletForm from "@/components/connectPage/ImportWalletForm";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/store/WalletAuthStore";
import CenterContainer from "@/components/CenterContainer";
import Web3Card from "@/components/Web3Card";

interface TabData {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function ConnectWalletPage() {
  const [activeTab, setActiveTab] = useState("create");
  const [error, setError] = useState("");
  const [generatedMnemonic, setGeneratedMnemonic] =
    useState<string>("");
  const [showRestore, setShowRestore] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);

  const router = useRouter();
  const { isAuthenticated } = useWalletStore();

  const tabs: TabData[] = [
    {
      id: "create",
      label: "Create",
      icon: <Wallet className="w-4 h-4" />,
      description: "Generate a new wallet",
    },
    {
      id: "unlock",
      label: "Unlock",
      icon: <Key className="w-4 h-4" />,
      description: "Access existing wallet",
    },
    {
      id: "import",
      label: "Import",
      icon: <Download className="w-4 h-4" />,
      description: "Restore from seed phrase",
    },
  ];

  // Only redirect if authenticated AND not showing mnemonic AND not in creation flow
  useEffect(() => {
    if (
      isAuthenticated &&
      !generatedMnemonic &&
      activeTab !== "create"
    ) {
      router.push("/wallet");
    }
  }, [
    isAuthenticated,
    router,
    generatedMnemonic,
    activeTab,
  ]);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;

    setIsTabChanging(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setShowRestore(false);
      setError("");
      setIsTabChanging(false);
    }, 150);
  };

  const handleForgotPassword = () => {
    setShowRestore(true);
    setError("");
  };

  const handleBackToUnlock = () => {
    setShowRestore(false);
    setError("");
  };

  const handleMnemonicComplete = () => {
    setGeneratedMnemonic("");
    router.push("/wallet");
  };

  const renderTabContent = () => {
    const contentClass = `transition-all duration-300 ${
      isTabChanging
        ? "opacity-0 transform translate-y-2"
        : "opacity-100 transform translate-y-0"
    }`;

    switch (activeTab) {
      case "create":
        return (
          <div className={contentClass}>
            <CreateWalletForm
              onSetError={setError}
              onSetGeneratedMnemonic={setGeneratedMnemonic}
            />
          </div>
        );
      case "unlock":
        return (
          <div className={contentClass}>
            {showRestore ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-crypto-purple to-crypto-blue bg-clip-text text-transparent">
                    Recover Wallet
                  </h3>
                  <button
                    onClick={handleBackToUnlock}
                    className="flex items-center gap-2 text-crypto-cyan hover:text-cyan-300 transition-colors duration-200 group text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                    <span className="hidden sm:inline">
                      Back to Unlock
                    </span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
                <RecoverWalletForm onSetError={setError} />
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <UnlockWalletForm onSetError={setError} />
                <div className="text-center">
                  <button
                    onClick={handleForgotPassword}
                    className="text-crypto-cyan hover:text-cyan-300 transition-colors duration-200 font-medium underline decoration-transparent hover:decoration-cyan-300 underline-offset-4 text-sm sm:text-base"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case "import":
        return (
          <div className={contentClass}>
            <ImportWalletForm onSetError={setError} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <CenterContainer className="min-h-screen px-4 py-6 sm:py-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
        <Web3Card
          variant="crypto"
          glow={true}
          className="overflow-hidden"
        >
          {/* Content */}
          {error && (
            <div className="mb-4 sm:mb-6">
              <Alert message={error} />
            </div>
          )}

          {generatedMnemonic ? (
            <div>
              <WalletCreatedView
                mnemonic={generatedMnemonic}
                onComplete={handleMnemonicComplete}
              />
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Custom Tab Navigation */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2 bg-slate-800/50 rounded-xl backdrop-blur-sm">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      relative p-2 sm:p-4 rounded-lg transition-all duration-300 group
                      ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-crypto-purple to-crypto-blue shadow-crypto-glow text-white"
                          : "hover:bg-slate-700/50 text-slate-400 hover:text-white"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div
                        className={`
                        transition-all duration-300
                        ${
                          activeTab === tab.id
                            ? "scale-110"
                            : "group-hover:scale-105"
                        }
                      `}
                      >
                        {tab.icon}
                      </div>
                      <span className="text-xs sm:text-sm font-medium">
                        {tab.label}
                      </span>
                    </div>

                    {/* Active indicator */}
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-crypto-purple/20 to-crypto-blue/20" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Description */}
              <div className="text-center">
                <p className="text-slate-400 text-xs sm:text-sm">
                  {
                    tabs.find((tab) => tab.id === activeTab)
                      ?.description
                  }
                </p>
              </div>

              {/* Tab Content */}
              <div className="w-full">
                {renderTabContent()}
              </div>
            </div>
          )}
        </Web3Card>
      </div>
    </CenterContainer>
  );
}
