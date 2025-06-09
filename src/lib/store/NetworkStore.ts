import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  NetworkConfig,
  NetworkStatus,
} from "../types/wallet";
import { NETWORKS } from "../utils/constant";
import { walletService } from "../wallet/WalletService";

interface NetworkState {
  currentNetworkId: number | null;
  currentNetwork: NetworkConfig | null;
  networkStatus: NetworkStatus | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  connectionStatus:
    | "connected"
    | "disconnected"
    | "connecting"
    | "unauthenticated";
  preferredNetworkId: number | null;
}

interface NetworkActions {
  switchNetwork: (
    networkId: number
  ) => Promise<{ success: boolean; message?: string }>;
  checkNetworkStatus: () => Promise<void>;
  updateNetworkStatus: (status: NetworkStatus) => void;
  setCurrentNetwork: (
    network: NetworkConfig | null
  ) => void;
  setConnectionStatus: (
    status: NetworkState["connectionStatus"]
  ) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSwitching: (switching: boolean) => void;
  setPreferredNetwork: (networkId: number) => void;
  getPreferredNetwork: () => NetworkConfig | null;
  initializeNetwork: () => void;
  resetNetworkState: () => void;
}

type NetworkStore = NetworkState & NetworkActions;

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      currentNetworkId: null,
      currentNetwork: null,
      networkStatus: null,
      isLoading: false,
      isSwitching: false,
      error: null,
      connectionStatus: "unauthenticated",
      preferredNetworkId: null,

      switchNetwork: async (networkId: number) => {
        const {
          setError,
          setSwitching,
          setConnectionStatus,
          setCurrentNetwork,
          checkNetworkStatus,
        } = get();

        setSwitching(true);
        setError(null);
        setConnectionStatus("connecting");

        try {
          const result =
            walletService.switchNetwork(networkId);

          if (result.success) {
            const newNetwork =
              walletService.getCurrentNetwork();
            setCurrentNetwork(newNetwork);
            set({ preferredNetworkId: networkId });

            setTimeout(() => {
              checkNetworkStatus();
            }, 1000);

            return { success: true };
          } else {
            setError(result.message);
            setConnectionStatus("disconnected");
            return {
              success: false,
              message: result.message,
            };
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to switch network";
          setError(message);
          setConnectionStatus("disconnected");
          return { success: false, message };
        } finally {
          setSwitching(false);
        }
      },

      checkNetworkStatus: async () => {
        const {
          setLoading,
          setError,
          setConnectionStatus,
          currentNetwork,
        } = get();

        if (!currentNetwork) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const status =
            await walletService.getNetworkStatus();

          if (status && status.isConnected) {
            setConnectionStatus("connected");
            set({ networkStatus: status });
          } else {
            setConnectionStatus("disconnected");
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Network status check failed";
          setError(message);
          setConnectionStatus("disconnected");
        } finally {
          setLoading(false);
        }
      },

      updateNetworkStatus: (status: NetworkStatus) => {
        set({
          networkStatus: status,
          connectionStatus: status.isConnected
            ? "connected"
            : "disconnected",
        });
      },

      setCurrentNetwork: (
        network: NetworkConfig | null
      ) => {
        set({
          currentNetwork: network,
          currentNetworkId: network?.id || null,
        });
      },

      setConnectionStatus: (
        status: NetworkState["connectionStatus"]
      ) => {
        set({ connectionStatus: status });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setSwitching: (switching: boolean) => {
        set({ isSwitching: switching });
      },

      setPreferredNetwork: (networkId: number) => {
        set({ preferredNetworkId: networkId });
      },

      getPreferredNetwork: () => {
        const { preferredNetworkId } = get();
        if (!preferredNetworkId) return null;

        return (
          NETWORKS.find(
            (network) => network.id === preferredNetworkId
          ) || null
        );
      },

      initializeNetwork: () => {
        const { setCurrentNetwork } = get();

        const currentNetwork =
          walletService.getCurrentNetwork();
        setCurrentNetwork(currentNetwork);
      },

      resetNetworkState: () => {
        set({
          currentNetworkId: null,
          currentNetwork: null,
          networkStatus: null,
          isLoading: false,
          isSwitching: false,
          error: null,
          connectionStatus: "unauthenticated",
        });
      },
    }),
    {
      name: "network-storage",
      partialize: (state) => ({
        preferredNetworkId: state.preferredNetworkId,
      }),
    }
  )
);

export const useCurrentNetwork = () =>
  useNetworkStore((state) => state.currentNetwork);

export const useCurrentNetworkId = () =>
  useNetworkStore((state) => state.currentNetworkId);

export const useNetworkStatus = () =>
  useNetworkStore((state) => state.networkStatus);

export const useConnectionStatus = () =>
  useNetworkStore((state) => state.connectionStatus);

export const useIsNetworkLoading = () =>
  useNetworkStore((state) => state.isLoading);

export const useIsNetworkSwitching = () =>
  useNetworkStore((state) => state.isSwitching);
