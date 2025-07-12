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
        // Mark this as a page load (not a browser close/reopen)
        const isPageReload =
          sessionStorage.getItem(PAGE_LOAD_KEY) === "true";
        sessionStorage.setItem(PAGE_LOAD_KEY, "true");

        // Setup heartbeat system to detect browser closing
        let heartbeatInterval: NodeJS.Timeout;

        const startHeartbeat = () => {
          // Clear any existing interval
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }

          // Update heartbeat every 5 seconds
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

        // Handle page unload (could be refresh or browser close)
        const handleBeforeUnload = () => {
          // Set a flag that we're unloading
          sessionStorage.setItem(
            "wallet-unloading",
            "true"
          );

          // Short delay to see if page reloads
          setTimeout(() => {
            sessionStorage.removeItem("wallet-unloading");
          }, 100);
        };

        // Handle page visibility changes
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

        // Handle focus events
        const handleFocus = () => {
          const state = get();
          if (state.isAuthenticated) {
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

        // Cleanup function
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
        };

        // Store cleanup function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__walletStoreCleanup = cleanup;

        // If this is a page reload, maintain session
        if (isPageReload) {
          // Check if we were in the middle of unloading
          const wasUnloading = sessionStorage.getItem(
            "wallet-unloading"
          );
          if (wasUnloading) {
            // This was a page refresh, clean up the flag
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

            // If no session storage data and no page load flag, browser was closed
            if (!storedSessionId && !pageLoadFlag) {
              set({
                isAuthenticated: false,
                sessionId: null,
                sessionStartTime: null,
              });
              return false;
            }

            // Check heartbeat (allow up to 30 seconds gap for browser sleeping)
            if (lastHeartbeat) {
              const heartbeatAge =
                Date.now() - parseInt(lastHeartbeat);
              if (heartbeatAge > 30000) {
                // 30 seconds
                // Session expired due to inactivity
                set({
                  isAuthenticated: false,
                  sessionId: null,
                  sessionStartTime: null,
                });
                return false;
              }
            }

            // Verify session ID matches
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

          // If we have persisted auth but no session storage and no page load flag
          // it means browser was closed and reopened
          if (
            state.isAuthenticated &&
            !storedSessionId &&
            !pageLoadFlag &&
            !wasUnloading
          ) {
            // Browser was closed, clear auth
            state.isAuthenticated = false;
            state.sessionId = null;
            state.sessionStartTime = null;
          } else if (
            state.isAuthenticated &&
            state.sessionId
          ) {
            // Restore session storage for page refresh case
            if (!storedSessionId) {
              sessionStorage.setItem(
                SESSION_ID_KEY,
                state.sessionId
              );
            }
            if (!pageLoadFlag) {
              sessionStorage.setItem(PAGE_LOAD_KEY, "true");
            }
            // Update heartbeat
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
