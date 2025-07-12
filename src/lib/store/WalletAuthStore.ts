import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  address: string | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  sessionStartTime: number | null;
  _hasHydrated: boolean;

  createSession: (info: { address: string }) => void;
  clearSession: () => void;
  clearAll: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;

  isFullyAuthenticated: () => boolean;
  hasValidSession: () => boolean;
}

const isBrowser = typeof window !== "undefined";

const generateSessionId = (): string => {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substr(2)
  );
};

const SESSION_HEARTBEAT_KEY = "wallet-session-heartbeat";
const SESSION_ID_KEY = "wallet-session-id";
const PAGE_LOAD_KEY = "wallet-page-load";

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => {
      if (isBrowser) {
        const isPageReload =
          sessionStorage.getItem(PAGE_LOAD_KEY) === "true";
        sessionStorage.setItem(PAGE_LOAD_KEY, "true");

        let heartbeatInterval: NodeJS.Timeout;

        const startHeartbeat = () => {
          if (heartbeatInterval)
            clearInterval(heartbeatInterval);

          heartbeatInterval = setInterval(() => {
            const state = get();
            if (state.isAuthenticated && state.sessionId) {
              sessionStorage.setItem(
                SESSION_HEARTBEAT_KEY,
                Date.now().toString()
              );
            }
          }, 5000);
        };

        const stopHeartbeat = () => {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        };

        const handleBeforeUnload = () => {
          sessionStorage.setItem(
            "wallet-unloading",
            "true"
          );
          setTimeout(() => {
            sessionStorage.removeItem("wallet-unloading");
          }, 100);
        };

        const handleVisibilityChange = () => {
          if (document.hidden) {
            stopHeartbeat();
          } else {
            const state = get();
            if (state.isAuthenticated) {
              startHeartbeat();
            }
          }
        };

        const handleFocus = () => {
          const state = get();
          if (state.isAuthenticated) {
            // Extend session and restart heartbeat
            sessionStorage.setItem(
              SESSION_HEARTBEAT_KEY,
              Date.now().toString()
            );
            startHeartbeat();
          }
        };

        // Add event listeners
        window.addEventListener(
          "beforeunload",
          handleBeforeUnload
        );
        window.addEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.addEventListener("focus", handleFocus);
        window.addEventListener("mousemove", handleFocus);
        window.addEventListener("mousedown", handleFocus);

        // Cleanup
        const cleanup = () => {
          stopHeartbeat();
          window.removeEventListener(
            "beforeunload",
            handleBeforeUnload
          );
          window.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
          window.removeEventListener("focus", handleFocus);
          window.removeEventListener(
            "mousemove",
            handleFocus
          );
          window.removeEventListener(
            "mousedown",
            handleFocus
          );
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__walletStoreCleanup = cleanup;

        if (isPageReload) {
          const wasUnloading = sessionStorage.getItem(
            "wallet-unloading"
          );
          if (wasUnloading) {
            sessionStorage.removeItem("wallet-unloading");
          }
        }
      }

      return {
        address: null,
        isAuthenticated: false,
        sessionId: null,
        sessionStartTime: null,
        _hasHydrated: false,

        createSession: (info) => {
          const sessionId = generateSessionId();
          const sessionStartTime = Date.now();

          if (isBrowser) {
            sessionStorage.setItem(
              SESSION_ID_KEY,
              sessionId
            );
            sessionStorage.setItem(
              SESSION_HEARTBEAT_KEY,
              Date.now().toString()
            );
            sessionStorage.setItem(PAGE_LOAD_KEY, "true");
          }

          set({
            address: info.address,
            isAuthenticated: true,
            sessionId,
            sessionStartTime,
          });
        },

        clearSession: () => {
          if (isBrowser) {
            sessionStorage.removeItem(SESSION_ID_KEY);
            sessionStorage.removeItem(
              SESSION_HEARTBEAT_KEY
            );
            sessionStorage.removeItem(PAGE_LOAD_KEY);
          }

          set({
            isAuthenticated: false,
            sessionId: null,
            sessionStartTime: null,
          });
        },

        clearAll: () => {
          if (isBrowser) {
            sessionStorage.clear();
          }

          set({
            address: null,
            isAuthenticated: false,
            sessionId: null,
            sessionStartTime: null,
          });
        },

        setHasHydrated: (hasHydrated: boolean) => {
          set({ _hasHydrated: hasHydrated });
        },

        isFullyAuthenticated: () => {
          const state = get();
          return (
            state.isAuthenticated &&
            !!state.address &&
            !!state.sessionId &&
            !!state.sessionStartTime
          );
        },

        hasValidSession: () => {
          const state = get();

          if (
            !state.isAuthenticated ||
            !state.address ||
            !state.sessionId ||
            !state.sessionStartTime
          ) {
            return false;
          }

          if (isBrowser) {
            const storedSessionId =
              sessionStorage.getItem(SESSION_ID_KEY);
            const lastHeartbeat = sessionStorage.getItem(
              SESSION_HEARTBEAT_KEY
            );
            const pageLoadFlag =
              sessionStorage.getItem(PAGE_LOAD_KEY);

            if (!storedSessionId && !pageLoadFlag) {
              set({
                isAuthenticated: false,
                sessionId: null,
                sessionStartTime: null,
              });
              return false;
            }

            //  Expire session after 2 hours of inactivity
            if (lastHeartbeat) {
              const heartbeatAge =
                Date.now() - parseInt(lastHeartbeat);
              if (heartbeatAge > 2 * 60 * 60 * 1000) {
                set({
                  isAuthenticated: false,
                  sessionId: null,
                  sessionStartTime: null,
                });
                return false;
              }
            }

            if (
              storedSessionId &&
              storedSessionId !== state.sessionId
            ) {
              set({
                isAuthenticated: false,
                sessionId: null,
                sessionStartTime: null,
              });
              return false;
            }
          }

          return true;
        },
      };
    },
    {
      name: "crypto-wallet-auth-store",
      partialize: (state) => ({
        address: state.address,
        isAuthenticated: state.isAuthenticated,
        sessionId: state.sessionId,
        sessionStartTime: state.sessionStartTime,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }

        if (state && isBrowser) {
          const storedSessionId =
            sessionStorage.getItem(SESSION_ID_KEY);
          const pageLoadFlag =
            sessionStorage.getItem(PAGE_LOAD_KEY);
          const wasUnloading = sessionStorage.getItem(
            "wallet-unloading"
          );

          if (
            state.isAuthenticated &&
            !storedSessionId &&
            !pageLoadFlag &&
            !wasUnloading
          ) {
            state.isAuthenticated = false;
            state.sessionId = null;
            state.sessionStartTime = null;
          } else if (
            state.isAuthenticated &&
            state.sessionId
          ) {
            if (!storedSessionId) {
              sessionStorage.setItem(
                SESSION_ID_KEY,
                state.sessionId
              );
            }
            if (!pageLoadFlag) {
              sessionStorage.setItem(PAGE_LOAD_KEY, "true");
            }
            sessionStorage.setItem(
              SESSION_HEARTBEAT_KEY,
              Date.now().toString()
            );
          }
        }
      },
    }
  )
);
