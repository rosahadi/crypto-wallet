import React from "react";
import {
  Wallet,
  Send,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { parseEther } from "@/lib/utils/index";
import { WalletData, Token } from "@/lib/types/wallet";

interface TokensTabProps {
  walletData: WalletData;
  openSendModal: (token?: Token | null) => void;
}

export default function TokensTab({
  walletData,
  openSendModal,
}: TokensTabProps) {
  const totalValue =
    walletData.tokens?.reduce((sum, token) => {
      return sum + (token.value || 0);
    }, 0) || 0;

  const TokenCard = ({
    token,
    isNative = false,
  }: {
    token: Token | null;
    isNative?: boolean;
  }) => {
    const symbol = isNative
      ? walletData.network?.nativeCurrency?.symbol || "ETH"
      : token?.symbol;
    const name = isNative
      ? walletData.network?.nativeCurrency?.name ||
        "Ethereum"
      : token?.name;
    const balance = isNative
      ? walletData.formattedEthBalance
      : token?.formattedBalance ||
        parseEther(token?.balance || "0");
    const value = token?.value;

    return (
      <div className="p-6 hover:bg-[var(--bg-tertiary)] transition-colors bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center relative border border-[var(--border-secondary)]">
              <span className="text-[var(--text-primary)] font-bold text-lg">
                {symbol?.charAt(0) || "?"}
              </span>
              {isNative && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-crypto-emerald rounded-full border-2 border-[var(--bg-secondary)]"></div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-[var(--text-primary)]">
                  {symbol}
                </h3>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {balance}
              </div>
              {value !== undefined && (
                <div className="flex items-center text-sm text-crypto-cyan">
                  <DollarSign className="h-3 w-3 mr-1" />$
                  {value.toLocaleString()}
                </div>
              )}
            </div>

            <button
              onClick={() =>
                openSendModal(isNative ? null : token)
              }
              className="h-10 w-10 bg-crypto-gradient hover:opacity-80 rounded-full flex items-center justify-center transition-opacity shadow-cyan-glow"
            >
              <Send className="h-4 w-4 text-[var(--text-primary)]" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (
    !walletData.tokens &&
    !walletData.formattedEthBalance
  ) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-crypto-cyan mx-auto mb-4"></div>
        <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
          Loading tokens...
        </h3>
        <p>Fetching your token balances</p>
      </div>
    );
  }

  const hasTokens =
    walletData.tokens && walletData.tokens.length > 0;

  return (
    <div className="space-y-4">
      {hasTokens ? (
        <div className="bg-[var(--bg-secondary)] rounded-lg divide-y divide-[var(--border-primary)] border border-[var(--border-primary)]">
          {walletData.tokens.map((token: Token) => (
            <TokenCard key={token.address} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <Wallet className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2 text-[var(--text-primary)]">
            No ERC-20 tokens found
          </h3>
          <p>Your ERC-20 tokens will appear here</p>
        </div>
      )}
    </div>
  );
}
