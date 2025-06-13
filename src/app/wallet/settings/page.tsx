"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Copy,
  Shield,
  Key,
  AlertTriangle,
  Check,
  RefreshCw,
  Clipboard,
  Lock,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  changePasswordSchema,
  passwordSchema,
} from "@/lib/schemas";
import { PasswordModal } from "@/components/settings/PasswordModal";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { useWallet } from "@/lib/hooks/useWallet";
import LoadingSpinner from "@/components/LoadingSpinner";
import CenterContainer from "@/components/CenterContainer";
import Web3Card from "@/components/Web3Card";
import StatusMessage from "@/components/StatusMessage";
import Alert from "@/components/Alert";

interface WalletDetailsData {
  privateKey: string;
  publicKey: string;
}

export default function WalletSettings() {
  const router = useRouter();

  const {
    isAuthenticated,
    address,
    isAuthLoading,
    hasHydrated,
    getWalletDetails,
    changePassword,
    error: walletError,
  } = useWallet();

  const [showPrivateKey, setShowPrivateKey] =
    useState<boolean>(false);
  const [showPublicKey, setShowPublicKey] =
    useState<boolean>(false);
  const [walletDetails, setWalletDetails] =
    useState<WalletDetailsData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] =
    useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] =
    useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] =
    useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] =
    useState<boolean>(false);
  const [modalError, setModalError] = useState<
    string | null
  >(null);
  const [changePasswordError, setChangePasswordError] =
    useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    null
  );
  const [isCopied, setIsCopied] = useState<{
    privateKey?: boolean;
    publicKey?: boolean;
  }>({});

  useEffect(() => {
    if (isAuthLoading || !hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/connect");
      return;
    }
  }, [isAuthenticated, isAuthLoading, hasHydrated, router]);

  const copyToClipboard = async (
    text: string,
    type: string
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied({
        ...isCopied,
        [type === "Private Key"
          ? "privateKey"
          : "publicKey"]: true,
      });
      setSuccess(`${type} copied to clipboard`);
      setTimeout(() => {
        setSuccess(null);
        setIsCopied({
          ...isCopied,
          [type === "Private Key"
            ? "privateKey"
            : "publicKey"]: false,
        });
      }, 3000);
    } catch {
      setSuccess(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleGetWalletDetails = async (
    data: z.infer<typeof passwordSchema>
  ): Promise<void> => {
    setIsLoadingDetails(true);
    setModalError(null);
    try {
      const result = await getWalletDetails(data.password);
      if (!result) {
        setModalError(
          "No response from wallet service. Please try again."
        );
        return;
      }

      if (result.success && result.data) {
        setWalletDetails({
          privateKey: String(result.data.privateKey),
          publicKey: String(result.data.publicKey),
        });
        setShowPasswordModal(false);
        setSuccess("Wallet details loaded successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setModalError(
          result.message ||
            "Failed to get wallet details. Please check your password."
        );
      }
    } catch {
      setModalError(
        "An unexpected error occurred. Please check your connection and try again."
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleChangePassword = async (
    data: z.infer<typeof changePasswordSchema>
  ): Promise<void> => {
    setIsChangingPassword(true);
    setChangePasswordError(null);
    try {
      const result = await changePassword(
        data.currentPassword,
        data.newPassword
      );
      if (!result) {
        setChangePasswordError(
          "No response from wallet service. Please try again."
        );
        return;
      }

      if (result.success) {
        setShowChangePassword(false);
        setSuccess("Password changed successfully");
        setTimeout(() => setSuccess(null), 3000);
        setWalletDetails(null);
      } else {
        setChangePasswordError(
          result.message ||
            "Failed to change password. Please check your current password."
        );
      }
    } catch {
      setChangePasswordError(
        "An unexpected error occurred. Please check your connection and try again."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Loading State
  if (isAuthLoading || !hasHydrated) {
    return (
      <CenterContainer
        variant="crypto"
        showBackground={true}
      >
        <LoadingSpinner
          size="lg"
          message="Loading wallet settings..."
          variant="crypto"
        />
      </CenterContainer>
    );
  }

  // Unauthenticated State
  if (!isAuthenticated || !address) {
    return (
      <CenterContainer
        variant="crypto"
        showBackground={true}
      >
        <Web3Card
          variant="crypto"
          glow={true}
          className="text-center"
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200 mb-2">
                Authentication Required
              </h2>
              <p className="text-slate-400 mb-6">
                You need to connect your wallet to access
                settings. Please authenticate to continue.
              </p>
              <Button
                onClick={() => router.push("/connect")}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Go to Connect
              </Button>
            </div>
          </div>
        </Web3Card>
      </CenterContainer>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float" />
        <div
          className="absolute bottom-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-10 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-6">
            <StatusMessage
              type="success"
              message={success}
              submessage="Operation completed successfully"
            />
          </div>
        )}

        {/* Wallet Error Display */}
        {walletError && (
          <div className="mb-6">
            <Alert
              message={walletError}
              variant="error"
              dismissible={true}
              onDismiss={() => {}}
            />
          </div>
        )}

        {/* Password Management Card */}
        <Web3Card
          variant="crypto"
          glow={true}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-200">
                Password Management
              </h2>
              <p className="text-slate-400 text-sm">
                Update your wallet password securely
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowChangePassword(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            disabled={isAuthLoading}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </Web3Card>

        {/* Wallet Details Card */}
        <Web3Card variant="crypto" glow={true}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-200">
                Wallet Details
              </h2>
              <p className="text-slate-400 text-sm">
                View your private and public keys
              </p>
            </div>
          </div>

          {/* Security Warning */}
          <div className="mb-6">
            <Alert
              message="Your private key provides full access to your wallet. Never share it with anyone and store it securely."
              variant="warning"
              dismissible={false}
            />
          </div>

          {!walletDetails ? (
            <div className="bg-slate-800/30 rounded-xl p-12 text-center backdrop-blur-sm border border-slate-700/50">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Key className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-slate-300 mb-8 max-w-md mx-auto text-lg">
                Enter your password to view sensitive wallet
                details including your private key
              </p>
              <Button
                onClick={() => {
                  setModalError(null);
                  setShowPasswordModal(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                disabled={isAuthLoading}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Wallet Details
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Private Key */}
              <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm border border-slate-700/50">
                <label className="text-sm font-medium text-slate-300 block mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  Private Key
                </label>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-slate-900/50 px-4 py-4 border border-slate-700 rounded-lg text-sm font-mono break-all text-red-400 backdrop-blur-sm">
                    {showPrivateKey
                      ? walletDetails.privateKey
                      : "•".repeat(64)}
                  </code>
                  <Button
                    onClick={() =>
                      setShowPrivateKey(!showPrivateKey)
                    }
                    className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all duration-300"
                    title={
                      showPrivateKey
                        ? "Hide private key"
                        : "Show private key"
                    }
                  >
                    {showPrivateKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        walletDetails.privateKey,
                        "Private Key"
                      )
                    }
                    className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all duration-300"
                    title="Copy private key"
                  >
                    {isCopied.privateKey ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Public Key */}
              <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm border border-slate-700/50">
                <label className="text-sm font-medium text-slate-300 block mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  Public Key
                </label>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-slate-900/50 px-4 py-4 border border-slate-700 rounded-lg text-sm font-mono break-all text-green-400 backdrop-blur-sm">
                    {showPublicKey
                      ? walletDetails.publicKey
                      : "•".repeat(64)}
                  </code>
                  <Button
                    onClick={() =>
                      setShowPublicKey(!showPublicKey)
                    }
                    className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all duration-300"
                    title={
                      showPublicKey
                        ? "Hide public key"
                        : "Show public key"
                    }
                  >
                    {showPublicKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        walletDetails.publicKey,
                        "Public Key"
                      )
                    }
                    className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg backdrop-blur-sm transition-all duration-300"
                    title="Copy public key"
                  >
                    {isCopied.publicKey ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Clear Details Button */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => setWalletDetails(null)}
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border border-slate-600/50 px-6 py-3 rounded-lg backdrop-blur-sm transition-all duration-300"
                >
                  Clear Details
                </Button>
              </div>
            </div>
          )}
        </Web3Card>
      </div>

      {/* Password Modal */}
      <PasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onConfirm={handleGetWalletDetails}
        isLoading={isLoadingDetails}
        error={modalError}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        onConfirm={handleChangePassword}
        isLoading={isChangingPassword}
        error={changePasswordError}
      />
    </div>
  );
}
