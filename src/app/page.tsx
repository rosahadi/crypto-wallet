"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CenterContainer from "@/components/CenterContainer";
import StatusMessage from "@/components/StatusMessage";
import Web3Card from "@/components/Web3Card";
import { Wallet, ArrowRight } from "lucide-react";
import { useWalletComposite } from "@/lib/hooks/useWallet";

export default function Home() {
  const router = useRouter();
  const {
    isAuthenticated,
    isAuthLoading,
    hasValidSession,
  } = useWalletComposite();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const timer = setTimeout(() => {
      if (isAuthenticated && hasValidSession) {
        router.push("/wallet");
      } else {
        router.push("/connect");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    hasValidSession,
    isAuthLoading,
    router,
  ]);

  // Loading state
  if (isAuthLoading) {
    return (
      <CenterContainer
        variant="crypto"
        showBackground={true}
      >
        <Web3Card variant="crypto" glow={true}>
          <div className="flex flex-col items-center space-y-6">
            {/* App Logo/Icon */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse" />
            </div>

            {/* App Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Crypto Wallet
              </h1>
            </div>

            {/* Loading Status */}
            <StatusMessage
              type="loading"
              message="Initializing Wallet"
              submessage="Connecting to blockchain..."
              className="w-full"
            />
          </div>
        </Web3Card>
      </CenterContainer>
    );
  }

  // Redirecting state
  const redirectingTo =
    isAuthenticated && hasValidSession
      ? "wallet"
      : "connect";
  const redirectMessage =
    isAuthenticated && hasValidSession
      ? "Welcome back! Redirecting to your wallet..."
      : "Setting up your wallet experience...";

  return (
    <CenterContainer variant="crypto" showBackground={true}>
      <Web3Card variant="crypto" glow={true}>
        <div className="flex flex-col items-center space-y-6">
          {/* App Logo/Icon */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 animate-pulse" />
          </div>

          {/* App Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Crypot Wallet
            </h1>
          </div>

          {/* Redirecting Status */}
          <div className="w-full space-y-4">
            <StatusMessage
              type="success"
              message="Redirecting..."
              submessage={redirectMessage}
              className="w-full"
            />

            {/* Redirect Indicator */}
            <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
              <span>Taking you to</span>
              <div className="flex items-center space-x-1 px-3 py-1 bg-slate-700/50 rounded-full">
                <span className="text-purple-400 font-medium">
                  /{redirectingTo}
                </span>
                <ArrowRight className="w-3 h-3 text-purple-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </Web3Card>
    </CenterContainer>
  );
}
