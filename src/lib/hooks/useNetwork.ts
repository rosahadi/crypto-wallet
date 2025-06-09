import React from "react";
import { NETWORKS } from "../utils/constant";
import { useNetworkStore } from "../store/NetworkStore";

export const useNetworkLoading = () => {
  const isLoading = useNetworkStore(
    (state) => state.isLoading
  );
  const isSwitching = useNetworkStore(
    (state) => state.isSwitching
  );

  return React.useMemo(
    () => ({ isLoading, isSwitching }),
    [isLoading, isSwitching]
  );
};

export const useNetworkError = () =>
  useNetworkStore((state) => state.error);

export const usePreferredNetworkId = () =>
  useNetworkStore((state) => state.preferredNetworkId);

export const useNetworkState = () => {
  const currentNetwork = useNetworkStore(
    (state) => state.currentNetwork
  );
  const currentNetworkId = useNetworkStore(
    (state) => state.currentNetworkId
  );
  const networkStatus = useNetworkStore(
    (state) => state.networkStatus
  );
  const connectionStatus = useNetworkStore(
    (state) => state.connectionStatus
  );
  const isLoading = useNetworkStore(
    (state) => state.isLoading
  );
  const isSwitching = useNetworkStore(
    (state) => state.isSwitching
  );
  const error = useNetworkStore((state) => state.error);
  const preferredNetworkId = useNetworkStore(
    (state) => state.preferredNetworkId
  );

  return React.useMemo(
    () => ({
      currentNetwork,
      currentNetworkId,
      networkStatus,
      connectionStatus,
      isLoading,
      isSwitching,
      error,
      preferredNetworkId,
    }),
    [
      currentNetwork,
      currentNetworkId,
      networkStatus,
      connectionStatus,
      isLoading,
      isSwitching,
      error,
      preferredNetworkId,
    ]
  );
};

export const useNetworkLoadingState = () => {
  const isLoading = useNetworkStore(
    (state) => state.isLoading
  );
  const isSwitching = useNetworkStore(
    (state) => state.isSwitching
  );

  return React.useMemo(
    () => ({
      isLoading,
      isSwitching,
      isAnyLoading: isLoading || isSwitching,
    }),
    [isLoading, isSwitching]
  );
};

export const useSwitchNetwork = () =>
  useNetworkStore((state) => state.switchNetwork);

export const useCheckNetworkStatus = () =>
  useNetworkStore((state) => state.checkNetworkStatus);

export const useSetPreferredNetwork = () =>
  useNetworkStore((state) => state.setPreferredNetwork);

export const useGetPreferredNetwork = () =>
  useNetworkStore((state) => state.getPreferredNetwork);

export const useInitializeNetwork = () =>
  useNetworkStore((state) => state.initializeNetwork);

export const useResetNetworkState = () =>
  useNetworkStore((state) => state.resetNetworkState);

export const useUpdateNetworkStatus = () =>
  useNetworkStore((state) => state.updateNetworkStatus);

export const useSetCurrentNetwork = () =>
  useNetworkStore((state) => state.setCurrentNetwork);

export const useSetConnectionStatus = () =>
  useNetworkStore((state) => state.setConnectionStatus);

export const useSetNetworkError = () =>
  useNetworkStore((state) => state.setError);

export const useSetNetworkLoading = () =>
  useNetworkStore((state) => state.setLoading);

export const useSetNetworkSwitching = () =>
  useNetworkStore((state) => state.setSwitching);

export const useNetworkActions = () => {
  const switchNetwork = useNetworkStore(
    (state) => state.switchNetwork
  );
  const checkNetworkStatus = useNetworkStore(
    (state) => state.checkNetworkStatus
  );
  const updateNetworkStatus = useNetworkStore(
    (state) => state.updateNetworkStatus
  );
  const setPreferredNetwork = useNetworkStore(
    (state) => state.setPreferredNetwork
  );
  const getPreferredNetwork = useNetworkStore(
    (state) => state.getPreferredNetwork
  );
  const initializeNetwork = useNetworkStore(
    (state) => state.initializeNetwork
  );
  const resetNetworkState = useNetworkStore(
    (state) => state.resetNetworkState
  );
  const setCurrentNetwork = useNetworkStore(
    (state) => state.setCurrentNetwork
  );
  const setConnectionStatus = useNetworkStore(
    (state) => state.setConnectionStatus
  );
  const setError = useNetworkStore(
    (state) => state.setError
  );
  const setLoading = useNetworkStore(
    (state) => state.setLoading
  );
  const setSwitching = useNetworkStore(
    (state) => state.setSwitching
  );

  return React.useMemo(
    () => ({
      switchNetwork,
      checkNetworkStatus,
      updateNetworkStatus,
      setPreferredNetwork,
      getPreferredNetwork,
      initializeNetwork,
      resetNetworkState,
      setCurrentNetwork,
      setConnectionStatus,
      setError,
      setLoading,
      setSwitching,
    }),
    [
      switchNetwork,
      checkNetworkStatus,
      updateNetworkStatus,
      setPreferredNetwork,
      getPreferredNetwork,
      initializeNetwork,
      resetNetworkState,
      setCurrentNetwork,
      setConnectionStatus,
      setError,
      setLoading,
      setSwitching,
    ]
  );
};

export const useIsNetworkReady = () =>
  useNetworkStore(
    (state) =>
      state.connectionStatus === "connected" &&
      state.currentNetwork !== null &&
      !state.isLoading &&
      !state.isSwitching
  );

export const useIsNetworkConnected = () =>
  useNetworkStore(
    (state) => state.connectionStatus === "connected"
  );

export const useIsNetworkDisconnected = () =>
  useNetworkStore(
    (state) => state.connectionStatus === "disconnected"
  );

export const useNetworkDisplayInfo = () => {
  const currentNetwork = useNetworkStore(
    (state) => state.currentNetwork
  );

  return React.useMemo(() => {
    const network = currentNetwork || NETWORKS[0];
    return {
      network,
      displayName: network.name,
      chainId: network.chainId,
      symbol: network.nativeCurrency?.symbol || "ETH",
      isCurrentNetwork: currentNetwork?.id === network.id,
    };
  }, [currentNetwork]);
};
