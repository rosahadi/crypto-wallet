import { create } from "zustand";
import {
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

interface WalletState {
  address: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isWalletReady: boolean;
  lastActivity: number | null;

  isAuthLoading: boolean;
  hasHydrated: boolean;

  /**
   * Sets wallet information
   * @param {Object} info - Wallet information object
   * @param {string} info.address - The wallet address
   */
  setWalletInfo: (info: { address: string }) => void;

  /**
   * Sets the authentication status
   * @param {boolean} authenticated - Authentication status
   */
  setAuthenticated: (authenticated: boolean) => void;

  /**
   * Sets the wallet ready status
   * @param {boolean} ready - Wallet ready status
   */
  setWalletReady: (ready: boolean) => void;

  /**
   * Sets the initialization status
   * @param {boolean} initialized - Initialization status
   */
  setInitialized: (initialized: boolean) => void;

  /**
   * Sets the authentication loading status
   * @param {boolean} loading - Loading status
   */
  setAuthLoading: (loading: boolean) => void;

  /**
   * Creates a new session with wallet information
   * @param {Object} info - Session information object
   * @param {string} info.address - The wallet address
   */
  createSession: (info: { address: string }) => void;

  clearSession: () => void;
  clearAll: () => void;

  isFullyAuthenticated: () => boolean;
  hasValidSession: () => boolean;
}

const isBrowser = typeof window !== "undefined";

const SESSION_ACTIVITY_KEY = "wallet-session-activity";

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector(
    persist(
      (set, get) => {
        if (isBrowser) {
          const updateActivity = () => {
            const now = Date.now();
            set({ lastActivity: now });
            localStorage.setItem(
              SESSION_ACTIVITY_KEY,
              now.toString()
            );
          };

          const isSessionActive = (): boolean => {
            const lastActivityStr = localStorage.getItem(
              SESSION_ACTIVITY_KEY
            );
            if (!lastActivityStr) return false;

            const lastActivity = parseInt(lastActivityStr);
            const now = Date.now();

            return now - lastActivity < 30000;
          };

          const handleUserActivity = () => {
            const state = get();
            if (state.isAuthenticated) {
              updateActivity();
            }
          };

          const activityEvents = [
            "focus",
            "click",
            "keydown",
            "mousemove",
            "scroll",
          ];
          activityEvents.forEach((event) => {
            window.addEventListener(
              event,
              handleUserActivity,
              { passive: true }
            );
          });

          const handleVisibilityChange = () => {
            if (!document.hidden) {
              const state = get();
              if (state.isAuthenticated) {
                if (isSessionActive()) {
                  updateActivity();
                } else {
                  set({
                    isAuthenticated: false,
                    isWalletReady: false,
                    lastActivity: null,
                  });
                }
              }
            }
          };

          document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
          );

          const cleanup = () => {
            activityEvents.forEach((event) => {
              window.removeEventListener(
                event,
                handleUserActivity
              );
            });
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__walletStoreCleanup = cleanup;

          setTimeout(() => {
            const state = get();
            set({ isAuthLoading: true });

            if (state.isAuthenticated) {
              if (isSessionActive()) {
                updateActivity();
                set({ isAuthLoading: false });
              } else {
                set({
                  isAuthenticated: false,
                  isWalletReady: false,
                  lastActivity: null,
                  isAuthLoading: false,
                });
              }
            } else {
              set({ isAuthLoading: false });
            }
          }, 100);
        }

        return {
          address: null,
          isInitialized: false,
          isAuthenticated: false,
          isWalletReady: false,
          lastActivity: null,
          isAuthLoading: true,
          hasHydrated: false,

          setWalletInfo: (info) => {
            set({
              address: info.address,
            });
          },

          setAuthenticated: (authenticated) => {
            if (authenticated) {
              const now = Date.now();
              set({
                isAuthenticated: authenticated,
                lastActivity: now,
                isAuthLoading: false,
              });
              localStorage.setItem(
                SESSION_ACTIVITY_KEY,
                now.toString()
              );
            } else {
              set({
                isAuthenticated: false,
                isWalletReady: false,
                lastActivity: null,
                isAuthLoading: false,
              });
              localStorage.removeItem(SESSION_ACTIVITY_KEY);
            }
          },

          setWalletReady: (ready) => {
            set({ isWalletReady: ready });
          },

          setInitialized: (initialized) => {
            set({ isInitialized: initialized });
          },

          setAuthLoading: (loading) => {
            set({ isAuthLoading: loading });
          },

          createSession: (info) => {
            const now = Date.now();
            set({
              address: info.address,
              isInitialized: true,
              isAuthenticated: true,
              isWalletReady: true,
              lastActivity: now,
              isAuthLoading: false,
            });
            localStorage.setItem(
              SESSION_ACTIVITY_KEY,
              now.toString()
            );
          },

          clearSession: () => {
            set({
              isAuthenticated: false,
              isWalletReady: false,
              lastActivity: null,
              isAuthLoading: false,
            });
            localStorage.removeItem(SESSION_ACTIVITY_KEY);
          },

          clearAll: () => {
            set({
              address: null,
              isInitialized: false,
              isAuthenticated: false,
              isWalletReady: false,
              lastActivity: null,
              isAuthLoading: false,
            });
            localStorage.removeItem(SESSION_ACTIVITY_KEY);
          },

          isFullyAuthenticated: () => {
            const state = get();
            return (
              state.isAuthenticated &&
              !!state.address &&
              state.isInitialized
            );
          },

          hasValidSession: () => {
            const state = get();
            if (
              !state.isAuthenticated ||
              !state.address ||
              !state.isInitialized
            ) {
              return false;
            }

            if (isBrowser) {
              const lastActivityStr = localStorage.getItem(
                SESSION_ACTIVITY_KEY
              );
              if (!lastActivityStr) {
                return false;
              }

              const lastActivity =
                parseInt(lastActivityStr);
              const now = Date.now();

              return now - lastActivity < 30000;
            }

            return state.isWalletReady;
          },
        };
      },
      {
        name: "crypto-wallet-auth-store",
        partialize: (state) => ({
          address: state.address,
          isInitialized: state.isInitialized,
          isAuthenticated: state.isAuthenticated,
          isWalletReady: state.isWalletReady,
          lastActivity: state.lastActivity,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.hasHydrated = true;
          }
        },
      }
    )
  )
);
