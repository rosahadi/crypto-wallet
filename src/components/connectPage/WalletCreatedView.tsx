"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  EyeOffIcon,
  ArrowRight,
  CheckCircle,
  Copy,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface WalletCreatedViewProps {
  mnemonic: string;
  onComplete: () => void;
}

export default function WalletCreatedView({
  mnemonic,
  onComplete,
}: WalletCreatedViewProps) {
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleGoToDashboard = () => {
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm shadow-cyan-glow">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              Wallet Created Successfully! 🎉
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your crypto wallet has been generated with a
              secure recovery phrase. Please store this
              phrase safely - it's the only way to recover
              your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Phrase Section */}
      <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm shadow-crypto-glow">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span className="text-lg font-semibold text-purple-400">
              Recovery Phrase
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMnemonic(!showMnemonic)}
            type="button"
            className="hover:bg-slate-700/50 transition-colors duration-200"
          >
            {showMnemonic ? (
              <EyeOffIcon
                size={18}
                className="text-slate-400 hover:text-purple-400 transition-colors"
              />
            ) : (
              <EyeIcon
                size={18}
                className="text-slate-400 hover:text-purple-400 transition-colors"
              />
            )}
          </Button>
        </div>

        <div
          className={`text-sm break-all font-mono p-4 bg-slate-950/80 border border-slate-700/50 rounded-lg transition-all duration-300 ${
            showMnemonic
              ? "opacity-100"
              : "blur-sm opacity-75"
          }`}
        >
          <div className="text-slate-200 leading-relaxed">
            {mnemonic}
          </div>
        </div>

        <Button
          className="w-full mt-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300"
          variant="outline"
          onClick={handleCopyToClipboard}
          disabled={!showMnemonic}
        >
          {copied ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Recovery Phrase
            </>
          )}
        </Button>
      </div>

      {/* Security Warning */}
      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <span className="font-medium text-orange-400">
              Important:
            </span>{" "}
            Store your recovery phrase securely and never
            share it with anyone. We cannot recover your
            wallet without this phrase.
          </div>
        </div>
      </div>

      {/* Dashboard Button */}
      <Button
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-crypto-glow hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 font-medium py-3"
        onClick={handleGoToDashboard}
      >
        <span className="text-white font-medium">
          Go to Dashboard
        </span>
        <ArrowRight className="ml-2 h-4 w-4 text-white" />
      </Button>
    </div>
  );
}
