"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Copy,
  Check,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { NetworkSelector } from "./NetworkSelector";
import { useWalletComposite } from "@/lib/hooks/useWallet";

interface WalletStatus {
  isConnected: boolean;
  address?: string;
  username?: string;
  networkId?: number;
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [isDropdownOpen, setIsDropdownOpen] =
    useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const {
    isFullyAuthenticated,
    address,
    logout,
    currentNetwork,
  } = useWalletComposite();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const walletStatus: WalletStatus = {
    isConnected: isHydrated ? isFullyAuthenticated : false,
    address: isHydrated ? address || undefined : undefined,
    networkId: currentNetwork?.id,
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );
    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleDisconnect = async () => {
    try {
      const result = logout();
      if (result.success) {
        router.push("/connect");
      } else {
        console.error(
          "Error disconnecting wallet:",
          result.message
        );
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(
      0,
      6
    )}...${address.substring(address.length - 4)}`;
  };

  const copyAddressToClipboard = () => {
    if (walletStatus.address) {
      navigator.clipboard.writeText(walletStatus.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const navLinks = [
    { href: "/wallet", label: "Dashboard" },
    { href: "/wallet/transactions", label: "Transactions" },
  ];

  if (!isHydrated) {
    return (
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-32 h-6 bg-slate-800 rounded animate-pulse" />
            </div>

            {/* Desktop Navigation Skeleton */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="h-10 w-40 bg-slate-800 rounded-lg animate-pulse" />
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <div className="w-10 h-10 bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              CryptoWallet
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {walletStatus.isConnected ? (
                <>
                  {/* Navigation Links */}
                  <div className="flex items-center space-x-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "relative px-3 py-2 text-sm font-medium transition-colors hover:text-purple-400",
                          pathname === link.href
                            ? "text-purple-400"
                            : "text-slate-300 hover:text-white"
                        )}
                      >
                        {link.label}
                        {pathname === link.href && (
                          <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Network Selector */}
                  <div className="flex items-center">
                    <NetworkSelector />
                  </div>

                  {/* User Menu */}
                  <div
                    className="relative"
                    ref={dropdownRef}
                  >
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white">
                          {walletStatus.username ||
                            "Wallet"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatAddress(
                            walletStatus.address
                          )}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform",
                          isDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl shadow-black/20 py-2">
                        {/* Address Section */}
                        {walletStatus.address && (
                          <div className="px-4 py-3 border-b border-slate-700/50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                              Wallet Address
                            </p>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <code className="text-sm text-purple-400 font-mono">
                                {walletStatus.address}
                              </code>
                              <button
                                onClick={
                                  copyAddressToClipboard
                                }
                                className="ml-3 p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                              >
                                {isCopied ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/wallet/settings"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                            onClick={() =>
                              setIsDropdownOpen(false)
                            }
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={() => {
                              handleDisconnect();
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => router.push("/connect")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                >
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            {walletStatus.isConnected ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {walletStatus.username || "Wallet"}
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs text-purple-400 font-mono">
                        {formatAddress(
                          walletStatus.address
                        )}
                      </code>
                      <button
                        onClick={copyAddressToClipboard}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Network Selector */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-1">
                    Network
                  </p>
                  <NetworkSelector />
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "block px-4 py-3 rounded-lg font-medium transition-colors",
                        pathname === link.href
                          ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                      )}
                      onClick={toggleMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/wallet/settings"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                    onClick={toggleMobileMenu}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    handleDisconnect();
                    toggleMobileMenu();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <Button
                onClick={() => {
                  router.push("/connect");
                  toggleMobileMenu();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
