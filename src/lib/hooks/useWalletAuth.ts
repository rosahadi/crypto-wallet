import { useWalletStore } from "../store/WalletAuthStore";

export const useWalletAuth = () => {
  const store = useWalletStore();
  return {
    isAuthenticated: store.isAuthenticated,
    isAuthLoading: store.isAuthLoading,
    hasHydrated: store.hasHydrated,
    isFullyAuthenticated: store.isFullyAuthenticated(),
    hasValidSession: store.hasValidSession(),
    address: store.address,
    setAuthenticated: store.setAuthenticated,
    setAuthLoading: store.setAuthLoading,
    clearSession: store.clearSession,
  };
};

export const useWalletSession = () => {
  const store = useWalletStore();
  return {
    isWalletReady: store.isWalletReady,
    isAuthLoading: store.isAuthLoading,
    hasHydrated: store.hasHydrated,
    setWalletReady: store.setWalletReady,
    createSession: store.createSession,
    hasValidSession: store.hasValidSession(),
  };
};
