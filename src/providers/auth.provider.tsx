import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useCurrentUser } from "@/hooks/useAuth";

// The AuthProvider handles initialization and token refresh
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { initialize, setAuthData, clearAuth } = useAuthStore();
  
  // useCurrentUser will only run if token exists (enabled: !!token)
  // This should be safe as long as QueryClientProvider wraps this component
  const { data: currentUser, error } = useCurrentUser();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    // Initialize auth state from persisted storage
    const handleInitialization = async () => {
      try {
        await initialize();
      } catch (e) {
        console.warn("Auth initialization failed:", e);
      }
    };

    void handleInitialization();
  }, [initialize]);

  // Sync current user from React Query with auth store
  useEffect(() => {
    if (currentUser) {
      const { accessToken, refreshToken } = useAuthStore.getState();
      if (accessToken && refreshToken) {
        setAuthData({
          accessToken,
          refreshToken,
          user: currentUser,
        });
      }
    } else if (error) {
      // If fetching current user fails, try to refresh token
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        const refreshAuth = async () => {
          try {
            const { unauthorizedAPI } = await import("@/lib/api");
            const handleApiRequest = (await import("@/lib/handleApiRequest"))
              .default;

            const response = await handleApiRequest(() =>
              unauthorizedAPI.post("/auth/refresh", {
                refreshToken,
              })
            );

            setAuthData({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              user: response.user,
            });
          } catch (refreshError) {
            // Refresh failed, clear auth
            clearAuth();
          }
        };
        void refreshAuth();
      } else {
        // No refresh token, clear auth
        clearAuth();
      }
    }
  }, [currentUser, error, setAuthData, clearAuth]);

  // Set up automatic token refresh
  useEffect(() => {
    const { refreshToken } = useAuthStore.getState();

    if (refreshToken) {
      // Clear any existing interval to prevent memory leaks
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Refresh token every 14 minutes (access tokens expire in 15 minutes)
      refreshIntervalRef.current = setInterval(
        async () => {
          try {
            const { refreshToken: currentRefreshToken } =
              useAuthStore.getState();
            if (!currentRefreshToken) {
              clearAuth();
              return;
            }

            const { unauthorizedAPI } = await import("@/lib/api");
            const handleApiRequest = (await import("@/lib/handleApiRequest"))
              .default;

            const response = await handleApiRequest(() =>
              unauthorizedAPI.post("/auth/refresh", {
                refreshToken: currentRefreshToken,
              })
            );

            setAuthData({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              user: response.user,
            });
          } catch (error) {
            console.error("Token refresh failed:", error);
            clearAuth();
          }
        },
        14 * 60 * 1000
      ); // 14 minutes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [setAuthData, clearAuth, useAuthStore.getState().refreshToken]);

  return <>{children}</>;
};
