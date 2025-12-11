"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { loginWithERPNext } from "../api/api";

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
  const { data: session, status } = useSession();
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

  // Handle NextAuth session (Keycloak)
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

      // Handle NextAuth session
      if (status === "loading") {
        setIsLoading(true);
        return;
      }

      if (status === "authenticated" && session) {
        await handleNextAuthSession(session);
      } else {
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    };

    initAuth();
  }, [session, status]);

  // Handle NextAuth session
  const handleNextAuthSession = async (session: any) => {
    try {
      const accessToken = session.accessToken as string;
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Decode token to get user info and roles
      const decoded = jwtDecode<JWTPayload>(accessToken);

      // Extract roles from token
      const realmRoles = decoded.realm_access?.roles || [];
      const resourceRoles = Object.values(
        decoded.resource_access || {}
      ).flatMap((r) => r.roles || []);
      const allRoles = [...realmRoles, ...resourceRoles];

      setToken(accessToken);
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
        email: (decoded as any).email || session.user?.email || undefined,
      });
      setIsAuthenticated(true);
      setAuthMethod("keycloak");
      setIsLoading(false);

      console.log("NextAuth authentication successful:", {
        user: decoded.sub,
        username:
          (decoded as any).preferred_username ||
          (decoded as any).name ||
          (decoded as any).username,
        email: (decoded as any).email || session.user?.email,
        roles: allRoles,
      });

      // Automatically attempt to authenticate with ERPNext after Keycloak login
      try {
        await authenticateERPNextWithKeycloak(accessToken);
      } catch (erpnextError) {
        console.warn(
          "Failed to automatically authenticate with ERPNext:",
          erpnextError
        );
        // Don't fail the Keycloak authentication if ERPNext auth fails
        // The user can still use the app, but ERPNext features won't work
      }
    } catch (error) {
      console.error("NextAuth session handling failed:", error);
      setIsLoading(false);
    }
  };

  // Authenticate with ERPNext using Keycloak token
  const authenticateERPNextWithKeycloak = async (keycloakToken: string) => {
    try {
      // Try to login to ERPNext using Keycloak token via SSO endpoint
      const response = await fetch("/api/erpnext/login-with-keycloak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keycloakToken }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Store ERPNext token (format: "Token api_key:api_secret" or session ID)
          localStorage.setItem("erpnext_token", data.token);
          Cookies.set("erpnext_token", data.token, { expires: 7 });

          // Also store API key and secret if available (for future use)
          if (data.api_key) {
            localStorage.setItem("erpnext_api_key", data.api_key);
          }
          if (data.api_secret) {
            localStorage.setItem("erpnext_api_secret", data.api_secret);
          }

          console.log(
            "✅ ERPNext authentication successful with Keycloak token"
          );

          // Store session as active
          localStorage.setItem("erpnext_session_active", "true");
        } else {
          console.warn("⚠️ ERPNext SSO login succeeded but no token returned");
        }
      } else {
        // SSO login failed - the auth hook should still handle Keycloak tokens
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          "⚠️ ERPNext SSO login failed:",
          errorData.message || `Status ${response.status}`
        );
        console.log(
          "ℹ️ ERPNext auth hook should still validate Keycloak tokens for API calls"
        );
        // Don't throw - let the auth hook handle Keycloak tokens directly
      }
    } catch (error) {
      console.error("ERPNext authentication with Keycloak failed:", error);
      // Don't throw - let the auth hook handle Keycloak tokens directly
      console.log(
        "ℹ️ ERPNext auth hook should still validate Keycloak tokens for API calls"
      );
    }
  };

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

  // Keycloak login function (using NextAuth)
  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn("keycloak", {
        callbackUrl: window.location.origin + "/",
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
      } else if (authMethod === "keycloak") {
        // NextAuth logout
        await signOut({
          callbackUrl: window.location.origin + "/",
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
  }, [authMethod]);

  // Refresh token function (NextAuth handles this automatically)
  const refreshToken = useCallback(async () => {
    // NextAuth automatically refreshes tokens, but we can trigger a session update
    if (authMethod === "keycloak" && session) {
      // Force a session update by refetching
      await fetch("/api/auth/session", { method: "GET" });
    }
  }, [authMethod, session]);

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some((role) => roles.includes(role));
  };

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
