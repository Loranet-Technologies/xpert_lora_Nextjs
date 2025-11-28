"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import Keycloak from "keycloak-js";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

// Keycloak configuration - use environment variables with fallbacks
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:9090",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "lorawan",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "lorawan-frontend",
  clientSecret: "abj9b1dUHolJs5EXkwhLLxH1CvkCXMNn",
  clientUuid: "19e19ca1-b812-4480-ad5d-b1b18df32cc2",
};

// Development mode - set to true to bypass Keycloak for testing
const DEV_MODE =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

// JWT token interface
interface JWTPayload {
  sub: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  exp: number;
  iat: number;
  iss: string;
  aud: string | string[];
  [key: string]: unknown;
}

// Auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  roles: string[];
  user: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [user, setUser] = useState<{
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      // Development mode - bypass Keycloak
      if (DEV_MODE) {
        console.log("🔧 Development mode: Bypassing Keycloak authentication");
        setToken("dev-token");
        setRoles(["admin_role", "user_role"]);
        setUser({
          id: "dev-user",
          username: "dev-user",
          firstName: "John",
          lastName: "Doe",
          email: "dev@example.com",
        });
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const kc = new Keycloak({
          url: keycloakConfig.url,
          realm: keycloakConfig.realm,
          clientId: keycloakConfig.clientId,
        });

        setKeycloak(kc);

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.warn(
            "Keycloak initialization timeout - Keycloak may not be running"
          );
          setIsLoading(false);
        }, 10000); // 10 second timeout

        // Try to authenticate with stored token first
        const storedToken = Cookies.get("keycloak_token");
        if (storedToken) {
          try {
            // Verify token is still valid
            const decoded = jwtDecode<JWTPayload>(storedToken);
            const now = Math.floor(Date.now() / 1000);

            if (decoded.exp > now) {
              // Token is still valid
              await kc.init({
                onLoad: "check-sso",
                silentCheckSsoRedirectUri:
                  window.location.origin + "/silent-check-sso.html",
                token: storedToken,
                refreshToken:
                  Cookies.get("keycloak_refresh_token") || undefined,
              });
            } else {
              // Token expired, try to refresh
              await kc.init({
                onLoad: "check-sso",
                silentCheckSsoRedirectUri:
                  window.location.origin + "/silent-check-sso.html",
              });
            }
          } catch (error) {
            console.warn("Invalid stored token, re-authenticating:", error);
            await kc.init({
              onLoad: "check-sso",
              silentCheckSsoRedirectUri:
                window.location.origin + "/silent-check-sso.html",
            });
          }
        } else {
          await kc.init({
            onLoad: "check-sso",
            silentCheckSsoRedirectUri:
              window.location.origin + "/silent-check-sso.html",
          });
        }

        clearTimeout(timeout);

        if (kc.authenticated) {
          await handleAuthentication(kc);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
        console.log("Make sure Keycloak is running on http://localhost:9090");
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  // Handle successful authentication
  const handleAuthentication = async (kc: Keycloak) => {
    try {
      const token = kc.token || "";
      const refreshToken = kc.refreshToken || "";

      // Store tokens in cookies and localStorage
      Cookies.set("keycloak_token", token, { expires: 1 }); // 1 day
      Cookies.set("keycloak_refresh_token", refreshToken, { expires: 7 }); // 7 days
      localStorage.setItem("keycloak_token", token);
      localStorage.setItem("keycloak_refresh_token", refreshToken);

      // Decode token to get user info and roles
      const decoded = jwtDecode<JWTPayload>(token);

      // Extract roles from token
      const realmRoles = decoded.realm_access?.roles || [];
      const resourceRoles = Object.values(
        decoded.resource_access || {}
      ).flatMap((r) => r.roles || []);
      const allRoles = [...realmRoles, ...resourceRoles];

      setToken(token);
      setRoles(allRoles);
      setUser({
        id: decoded.sub,
        username:
          (decoded as any).preferred_username ||
          (decoded as any).name ||
          (decoded as any).username ||
          decoded.sub,
        firstName:
          (decoded as any).given_name ||
          (decoded as any).first_name ||
          (decoded as any).firstName,
        lastName:
          (decoded as any).family_name ||
          (decoded as any).last_name ||
          (decoded as any).lastName,
        email: (decoded as any).email,
      });
      setIsAuthenticated(true);
      setIsLoading(false);

      console.log("Authentication successful:", {
        user: decoded.sub,
        username:
          (decoded as any).preferred_username ||
          (decoded as any).name ||
          (decoded as any).username,
        email: (decoded as any).email,
        roles: allRoles,
        token: token.substring(0, 20) + "...",
        fullDecoded: decoded, // Debug: log the full decoded token
      });
    } catch (error) {
      console.error("Authentication handling failed:", error);
      setIsLoading(false);
    }
  };

  // Login function
  const login = async () => {
    if (!keycloak) return;

    try {
      setIsLoading(true);
      await keycloak.login({
        redirectUri: window.location.origin + "/",
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    if (!keycloak) return;

    try {
      // Clear stored tokens
      Cookies.remove("keycloak_token");
      Cookies.remove("keycloak_refresh_token");
      localStorage.removeItem("keycloak_token");
      localStorage.removeItem("keycloak_refresh_token");

      // Reset state
      setToken(null);
      setRoles([]);
      setUser(null);
      setIsAuthenticated(false);

      // Logout from Keycloak
      await keycloak.logout({
        redirectUri: window.location.origin + "/",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [keycloak]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!keycloak || !keycloak.authenticated) return;

    try {
      const refreshed = await keycloak.updateToken(30); // Refresh if expires within 30 seconds
      if (refreshed) {
        const newToken = keycloak.token || "";
        Cookies.set("keycloak_token", newToken, { expires: 1 });
        localStorage.setItem("keycloak_token", newToken);
        setToken(newToken);

        // Update roles in case they changed
        const decoded = jwtDecode<JWTPayload>(newToken);
        const realmRoles = decoded.realm_access?.roles || [];
        const resourceRoles = Object.values(
          decoded.resource_access || {}
        ).flatMap((r) => r.roles || []);
        const allRoles = [...realmRoles, ...resourceRoles];
        setRoles(allRoles);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      await logout();
    }
  }, [keycloak, logout]);

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some((role) => roles.includes(role));
  };

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated && keycloak) {
      const interval = setInterval(() => {
        refreshToken();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, keycloak, refreshToken]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    token,
    roles,
    user,
    login,
    logout,
    refreshToken,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
