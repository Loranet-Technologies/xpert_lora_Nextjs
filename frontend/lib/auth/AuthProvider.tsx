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
import { loginWithERPNext } from "../api/api";

// Keycloak configuration - use environment variables with fallbacks
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:9090",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "lorawan",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "lorawan-frontend",
  clientSecret: "t4nA73Y5WziRhqkkKGLO2FDHp9YhIlmv",
  clientUuid: "e55935fd-8e59-4891-bebb-e9a567c3b379",
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
  error: string | null;
  login: () => Promise<void>;
  loginWithERPNext: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
// ERPNext configuration
const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

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
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"erpnext" | "keycloak" | null>(
    null
  );

  // Check ERPNext session
  const checkERPNextSession = async () => {
    try {
      const erpnextUser = localStorage.getItem("erpnext_user");
      const erpnextToken =
        localStorage.getItem("erpnext_token") || Cookies.get("erpnext_token");
      const sessionActive = localStorage.getItem("erpnext_session_active");

      if (sessionActive === "true" && erpnextUser && erpnextToken) {
        // Verify session is still valid by checking user info via proxy using token
        const response = await fetch("/api/erpnext/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${erpnextToken}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.message) {
            const storedUser = JSON.parse(erpnextUser);

            setUser(storedUser);
            setToken(erpnextToken);
            setRoles(storedUser.roles || ["user_role"]);
            setIsAuthenticated(true);
            setAuthMethod("erpnext");
            setIsLoading(false);
            return true;
          }
        } else {
          // Session expired, clear stored data
          localStorage.removeItem("erpnext_user");
          localStorage.removeItem("erpnext_username");
          localStorage.removeItem("erpnext_token");
          localStorage.removeItem("erpnext_session_active");
          Cookies.remove("erpnext_token");
        }
      }
      return false;
    } catch (error) {
      console.error("ERPNext session check failed:", error);
      // Clear potentially invalid session data
      localStorage.removeItem("erpnext_user");
      localStorage.removeItem("erpnext_username");
      localStorage.removeItem("erpnext_token");
      localStorage.removeItem("erpnext_session_active");
      Cookies.remove("erpnext_token");
      return false;
    }
  };

  // Initialize Authentication
  useEffect(() => {
    const initAuth = async () => {
      // Development mode - bypass authentication
      if (DEV_MODE) {
        console.log("🔧 Development mode: Bypassing authentication");
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

      // First check ERPNext session
      const hasERPNextSession = await checkERPNextSession();
      if (hasERPNextSession) {
        return;
      }

      // Fallback to Keycloak initialization
      await initKeycloak();
    };

    const initKeycloak = async () => {
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

    initAuth();
  }, []);

  // Handle ERPNext authentication
  const handleERPNextAuth = async (responseData: any) => {
    try {
      // Extract token from login response
      const token =
        responseData.token ||
        responseData.message?.token ||
        responseData.message;

      if (!token) {
        throw new Error("No token received from login response");
      }

      // Store token
      localStorage.setItem("erpnext_token", token);
      Cookies.set("erpnext_token", token, { expires: 7 }); // Store in cookies as backup

      // After successful login, fetch user info using token
      const userResponse = await fetch("/api/erpnext/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user information");
      }

      const userResult = await userResponse.json();
      const username = userResult.message;

      if (!username) {
        throw new Error("User information not available");
      }

      // Fetch full user details using token
      const userDetailsResponse = await fetch(
        `/api/erpnext/user-details?username=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      let userData: any = { name: username, full_name: username };
      if (userDetailsResponse.ok) {
        const userDetails = await userDetailsResponse.json();
        userData = userDetails.data || userData;
      }

      // Extract user information
      const userInfo = {
        id: userData.email || userData.name || username,
        username: userData.name || username,
        firstName:
          userData.first_name || userData.full_name?.split(" ")[0] || "",
        lastName:
          userData.last_name ||
          userData.full_name?.split(" ").slice(1).join(" ") ||
          "",
        email: userData.email || username,
      };

      // Store user information in localStorage
      localStorage.setItem("erpnext_user", JSON.stringify(userInfo));
      localStorage.setItem("erpnext_username", username);
      localStorage.setItem("erpnext_session_active", "true");

      // Extract roles from user data if available
      const userRoles = userData.roles || userData.user_roles || ["user_role"];

      // Store and use the actual token
      setToken(token);

      setUser(userInfo);
      setRoles(Array.isArray(userRoles) ? userRoles : [userRoles]);
      setAuthMethod("erpnext");
      setIsAuthenticated(true);
      setError(null);
      setIsLoading(false);

      console.log("ERPNext authentication successful:", {
        user: userInfo.username,
        email: userInfo.email,
        roles: userRoles,
        token: token.substring(0, 20) + "...",
      });
    } catch (error) {
      console.error("ERPNext authentication handling failed:", error);
      setError("Failed to process authentication response");
      setIsLoading(false);
      throw error;
    }
  };

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

  // ERPNext login function
  const handleERPNextLogin = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const responseData = await loginWithERPNext({
        usr: username,
        pwd: password,
      });

      await handleERPNextAuth(responseData);
    } catch (error) {
      console.error("ERPNext login failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials."
      );
      setIsLoading(false);
      throw error;
    }
  };

  // Keycloak login function
  const login = async () => {
    if (!keycloak) return;

    try {
      setIsLoading(true);
      setError(null);
      await keycloak.login({
        redirectUri: window.location.origin + "/",
      });
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        error instanceof Error ? error.message : "Keycloak login failed"
      );
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (authMethod === "erpnext") {
        // ERPNext logout via proxy with token
        const erpnextToken =
          localStorage.getItem("erpnext_token") || Cookies.get("erpnext_token");
        if (erpnextToken) {
          try {
            await fetch("/api/erpnext/logout", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${erpnextToken}`,
              },
              credentials: "include",
            });
          } catch (error) {
            console.error("ERPNext logout API call failed:", error);
          }
        }

        // Clear ERPNext stored data
        localStorage.removeItem("erpnext_user");
        localStorage.removeItem("erpnext_username");
        localStorage.removeItem("erpnext_token");
        localStorage.removeItem("erpnext_session_active");
        Cookies.remove("erpnext_token");
      } else if (keycloak) {
        // Keycloak logout
        // Clear stored tokens
        Cookies.remove("keycloak_token");
        Cookies.remove("keycloak_refresh_token");
        localStorage.removeItem("keycloak_token");
        localStorage.removeItem("keycloak_refresh_token");

        // Logout from Keycloak
        await keycloak.logout({
          redirectUri: window.location.origin + "/",
        });
      }

      // Reset state
      setToken(null);
      setRoles([]);
      setUser(null);
      setIsAuthenticated(false);
      setAuthMethod(null);
      setError(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [keycloak, authMethod]);

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
    error,
    login,
    loginWithERPNext: handleERPNextLogin,
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
