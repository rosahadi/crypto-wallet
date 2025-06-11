"use client";

import {
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { NetworkConfig } from "@/lib/types/wallet";
import { NETWORKS } from "@/lib/utils/constant";
import { toast } from "sonner";
import {
  useCurrentNetwork,
  useConnectionStatus,
} from "@/lib/store/NetworkStore";
import { useWalletAuth } from "@/lib/hooks/useWalletAuth";
import {
  useNetworkActions,
  useNetworkError,
  useNetworkLoading,
} from "@/lib/hooks/useNetwork";

const ENHANCED_NETWORKS: (NetworkConfig & {
  color: string;
  bgColor: string;
  textColor: string;
  icon?: string;
})[] = [
  {
    ...NETWORKS[0],
    color: "#627EEA", // Ethereum blue
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    icon: "⟠",
  },
  {
    ...NETWORKS[1],
    color: "#8247E5", // Polygon purple
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
    icon: "⬟",
  },
];

export function NetworkSelector() {
  const { isFullyAuthenticated, hasValidSession } =
    useWalletAuth();

  const currentNetwork = useCurrentNetwork();
  const connectionStatus = useConnectionStatus();
  const { isLoading, isSwitching } = useNetworkLoading();
  const error = useNetworkError();

  const {
    switchNetwork,
    checkNetworkStatus,
    setPreferredNetwork,
    initializeNetwork,
  } = useNetworkActions();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFullyAuthenticated && hasValidSession) {
      initializeNetwork();

      const timeoutId = setTimeout(() => {
        checkNetworkStatus();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isFullyAuthenticated,
    hasValidSession,
    initializeNetwork,
    checkNetworkStatus,
  ]);

  useEffect(() => {
    if (error) {
      toast.error("Network Error", {
        description: error,
      });
    }
  }, [error]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const handleNetworkChange = async (
    network: NetworkConfig
  ) => {
    if (!isFullyAuthenticated || !hasValidSession) {
      toast.error("Authentication Required", {
        description: "Please log in to switch networks",
      });
      setIsOpen(false);
      return;
    }

    if (network.id === currentNetwork?.id) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    try {
      const result = await switchNetwork(network.id);

      if (result.success) {
        setPreferredNetwork(network.id);
        toast.success("Network Changed", {
          description: `Successfully switched to ${network.name}`,
        });
      } else {
        toast.error("Network Switch Failed", {
          description:
            result.message || "Failed to switch network",
        });
      }
    } catch (error) {
      toast.error("Network Switch Error", {
        description:
          error instanceof Error
            ? error.message
            : "Unknown error occurred",
      });
    }
  };

  const getNetworkConfig = (networkId?: number) => {
    return (
      ENHANCED_NETWORKS.find((n) => n.id === networkId) ||
      ENHANCED_NETWORKS[0]
    );
  };

  const getConnectionIcon = () => {
    if (!isFullyAuthenticated || !hasValidSession) {
      return <WifiOff className="w-4 h-4 text-slate-500" />;
    }

    switch (connectionStatus) {
      case "connected":
        return (
          <Wifi className="w-4 h-4 text-emerald-400" />
        );
      case "disconnected":
        return <WifiOff className="w-4 h-4 text-red-400" />;
      case "connecting":
        return (
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
        );
      default:
        return (
          <WifiOff className="w-4 h-4 text-slate-500" />
        );
    }
  };

  const getStatusColor = () => {
    if (!isFullyAuthenticated || !hasValidSession) {
      return "text-slate-500";
    }

    switch (connectionStatus) {
      case "connected":
        return "text-emerald-400";
      case "disconnected":
        return "text-red-400";
      case "connecting":
        return "text-yellow-400";
      default:
        return "text-slate-500";
    }
  };

  const getStatusText = () => {
    if (!isFullyAuthenticated || !hasValidSession) {
      return "Not authenticated";
    }

    if (isSwitching) return "Switching...";

    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      case "connecting":
        return "Connecting...";
      default:
        return "Unknown";
    }
  };

  const displayNetworkConfig = getNetworkConfig(
    currentNetwork?.id
  );
  const isButtonDisabled =
    isLoading ||
    isSwitching ||
    !isFullyAuthenticated ||
    !hasValidSession;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Network Button */}
      <Button
        variant="ghost"
        className={cn(
          "flex items-center space-x-3 px-4 py-2.5 h-auto",
          "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600",
          "rounded-xl transition-all duration-200",
          "text-white font-medium",
          isButtonDisabled &&
            "opacity-60 cursor-not-allowed",
          isOpen && "bg-slate-800 border-slate-600"
        )}
        onClick={() =>
          !isButtonDisabled && setIsOpen(!isOpen)
        }
        disabled={isButtonDisabled}
      >
        {/* Network Icon/Color Indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0",
              displayNetworkConfig.bgColor
            )}
            style={{
              backgroundColor: displayNetworkConfig.color,
            }}
          >
            {displayNetworkConfig.icon && (
              <span className="text-xs leading-none flex items-center justify-center w-full h-full text-white">
                {displayNetworkConfig.icon}
              </span>
            )}
          </div>

          {/* Network Info */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {displayNetworkConfig.name}
            </span>
            <div className="flex items-center space-x-1">
              {getConnectionIcon()}
              <span
                className={cn("text-xs", getStatusColor())}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl shadow-black/20 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-medium text-white">
              Select Network
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Choose your preferred blockchain network
            </p>
          </div>

          {/* Network List */}
          <div className="py-2 max-h-64 overflow-y-auto">
            {ENHANCED_NETWORKS.map((network) => {
              const isSelected =
                currentNetwork?.id === network.id;
              const isCurrentlySwitching =
                isSwitching && isSelected;

              return (
                <button
                  key={network.id}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between",
                    "hover:bg-slate-800/50 transition-colors text-left",
                    isSelected && "bg-slate-800/30",
                    isSwitching &&
                      !isSelected &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() =>
                    handleNetworkChange(network)
                  }
                  disabled={isSwitching}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Network Color/Icon */}
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${network.color}20`,
                        }}
                      >
                        {network.icon ? (
                          <span
                            className="text-lg"
                            style={{ color: network.color }}
                          >
                            {network.icon}
                          </span>
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                network.color,
                            }}
                          />
                        )}
                      </div>

                      {/* Loading indicator for currently switching network */}
                      {isCurrentlySwitching && (
                        <div className="absolute -top-1 -right-1">
                          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Network Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate">
                          {network.name}
                        </span>
                        {isSelected &&
                          !isCurrentlySwitching && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-400">
                          {network.nativeCurrency?.symbol ||
                            "ETH"}
                        </span>
                        <span className="text-xs text-slate-500">
                          •
                        </span>
                        <span className="text-xs text-slate-400">
                          Chain {network.chainId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isSelected && (
                    <div className="flex items-center space-x-2 ml-2">
                      {isCurrentlySwitching ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-yellow-400">
                            Switching
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {getConnectionIcon()}
                          <span
                            className={cn(
                              "text-xs",
                              getStatusColor()
                            )}
                          >
                            {connectionStatus ===
                            "connected"
                              ? "Active"
                              : getStatusText()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {error && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-400">
                  {error}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
