"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { loginWithERPNext } from "../api/auth/auth";

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
    role?: string;
  } | null;
  error: string | null;
  login: () => Promise<void>;
  loginWithERPNext: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
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
    role?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"erpnext" | "keycloak" | null>(
    null
  );

  // Session-long cache: call /api/erpnext/user-details once per user, then reuse until logout
  const userDetailsCacheRef = useRef<{
    username: string;
    data: Record<string, unknown>;
  } | null>(null);
  const userDetailsFetchInProgressRef = useRef(false);

  // Single centralized fetcher: returns cached data if we already have it for this user; otherwise fetches once
  const fetchUserDetailsCached = useCallback(
    async (
      username: string,
      token: string
    ): Promise<Record<string, unknown> | null> => {
      const cached = userDetailsCacheRef.current;
      if (cached && cached.username === username) {
        return cached.data;
      }
      if (userDetailsFetchInProgressRef.current) {
        return cached?.username === username ? cached.data : null;
      }
      userDetailsFetchInProgressRef.current = true;
      try {
        const res = await fetch(
          `/api/erpnext/user-details?username=${encodeURIComponent(username)}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const data = (json.data || {}) as Record<string, unknown>;
        userDetailsCacheRef.current = { username, data };
        return data;
      } finally {
        userDetailsFetchInProgressRef.current = false;
      }
    },
    []
  );

  // Check ERPNext session
  const checkERPNextSession = useCallback(async () => {
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
            const username = userData.message || storedUser.username;

            // Fetch latest user details to get current role (cached, single call)
            try {
              const latestUserData = await fetchUserDetailsCached(
                username,
                erpnextToken
              );
              if (latestUserData && Object.keys(latestUserData).length > 0) {
                const details = latestUserData as {
                  first_name?: string;
                  last_name?: string;
                  full_name?: string;
                  email?: string;
                  role?: string;
                };
                // Extract and normalize role from latest user data (User, Admin, SuperAdmin)
                const userRoleField = details.role;
                let currentRole = "user";
                if (userRoleField) {
                  const r = userRoleField.toLowerCase();
                  if (r === "superadmin") currentRole = "SuperAdmin";
                  else if (r === "admin") currentRole = "admin";
                }

                // Update user with latest data including role
                const userWithRole = {
                  ...storedUser,
                  role: currentRole,
                  firstName:
                    details.first_name ||
                    storedUser.firstName ||
                    (typeof details.full_name === "string"
                      ? details.full_name.split(" ")[0]
                      : "") ||
                    "",
                  lastName:
                    details.last_name ||
                    storedUser.lastName ||
                    (typeof details.full_name === "string"
                      ? details.full_name.split(" ").slice(1).join(" ")
                      : "") ||
                    "",
                  email: (details.email as string | undefined) || storedUser.email,
                };

                // Update roles array based on current role
                const currentRoles =
                  currentRole === "SuperAdmin"
                    ? ["SuperAdmin", "superadmin", "admin", "admin_role"]
                    : currentRole === "admin"
                    ? ["admin", "admin_role"]
                    : ["user", "user_role"];

                // Update localStorage with latest data
                localStorage.setItem(
                  "erpnext_user",
                  JSON.stringify(userWithRole)
                );

                setUser(userWithRole);
                setToken(erpnextToken);
                setRoles(currentRoles);
                setIsAuthenticated(true);
                setAuthMethod("erpnext");
                setIsLoading(false);
                return true;
              }
            } catch (error) {
              console.warn(
                "Failed to fetch latest user role, using stored data:",
                error
              );
            }

            // Fallback to stored user data if fetch fails
            const userWithRole = {
              ...storedUser,
              role: storedUser.role || "user",
            };

            setUser(userWithRole);
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
  }, [fetchUserDetailsCached]);

  // Stable session key so init effect doesn't re-run on every session object reference change
  const sessionKey = session?.user
    ? (session.user as { email?: string; name?: string }).email ??
      (session.user as { email?: string; name?: string }).name ??
      null
    : null;

  // Authenticate with ERPNext using Keycloak token
  const authenticateERPNextWithKeycloak = async (keycloakToken: string) => {
    try {
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
          localStorage.setItem("erpnext_token", data.token);
          Cookies.set("erpnext_token", data.token, { expires: 7 });

          if (data.api_key) {
            localStorage.setItem("erpnext_api_key", data.api_key);
          }
          if (data.api_secret) {
            localStorage.setItem("erpnext_api_secret", data.api_secret);
          }

          console.log(
            "✅ ERPNext authentication successful with Keycloak token"
          );

          localStorage.setItem("erpnext_session_active", "true");
        } else {
          console.warn("⚠️ ERPNext SSO login succeeded but no token returned");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          "⚠️ ERPNext SSO login failed:",
          errorData.message || `Status ${response.status}`
        );
        console.log(
          "ℹ️ ERPNext auth hook should still validate Keycloak tokens for API calls"
        );
      }
    } catch (error) {
      console.error("ERPNext authentication with Keycloak failed:", error);
      console.log(
        "ℹ️ ERPNext auth hook should still validate Keycloak tokens for API calls"
      );
    }
  };

  // Handle NextAuth session (Keycloak)
  const handleNextAuthSession = useCallback(
    async (currentSession: any) => {
      try {
        const accessToken = currentSession.accessToken as string;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const decoded = jwtDecode<JWTPayload>(accessToken);

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
          email: (decoded as any).email || currentSession.user?.email || undefined,
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
          email: (decoded as any).email || currentSession.user?.email,
          roles: allRoles,
        });

        try {
          await authenticateERPNextWithKeycloak(accessToken);
        } catch (erpnextError) {
          console.warn(
            "Failed to automatically authenticate with ERPNext:",
            erpnextError
          );
        }
      } catch (error) {
        console.error("NextAuth session handling failed:", error);
        setIsLoading(false);
      }
    },
    [authenticateERPNextWithKeycloak]
  );

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
  }, [sessionKey, status, checkERPNextSession, session, handleNextAuthSession]);

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

      // Fetch full user details using token (cached, single call)
      const cachedDetails = await fetchUserDetailsCached(username, token);
      const userData = (cachedDetails
        ? { name: username, full_name: username, ...cachedDetails }
        : { name: username, full_name: username }) as Record<string, unknown> & {
        first_name?: string;
        last_name?: string;
        full_name?: string;
        email?: string;
      };

      // Prefer role from user-details API (same source as on reload); fallback to login response
      const detailsRole = (userData as { role?: string }).role;
      const loginRole =
        responseData.message?.role || responseData.role || "user";
      const rawRole = detailsRole || loginRole;

      // Normalize role - preserve SuperAdmin, normalize others to lowercase
      let normalizedRole =
        typeof rawRole === "string" ? rawRole.toLowerCase() : "user";
      if (rawRole && String(rawRole).toLowerCase() === "superadmin") {
        normalizedRole = "SuperAdmin";
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
        role: normalizedRole,
      };

      // Store user information in localStorage (including role)
      localStorage.setItem("erpnext_user", JSON.stringify(userInfo));
      localStorage.setItem("erpnext_username", username);
      localStorage.setItem("erpnext_session_active", "true");

      // Convert role to roles array format for compatibility
      // Backend now only returns role (string), not roles (array)
      const userRoles =
        normalizedRole === "admin"
          ? ["admin", "admin_role"]
          : normalizedRole === "SuperAdmin"
          ? ["SuperAdmin", "superadmin", "admin", "admin_role"]
          : ["user", "user_role"];

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
        role: userInfo.role,
        roles: userRoles,
        token: token.substring(0, 20) + "...",
        roleSource: "ERPNext User.role field",
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

        // Clear ERPNext stored data and user-details cache
        localStorage.removeItem("erpnext_user");
        localStorage.removeItem("erpnext_username");
        localStorage.removeItem("erpnext_token");
        localStorage.removeItem("erpnext_session_active");
        Cookies.remove("erpnext_token");
        userDetailsCacheRef.current = null;

        // Reset state
        setToken(null);
        setRoles([]);
        setUser(null);
        setIsAuthenticated(false);
        setAuthMethod(null);
        setError(null);

        // Redirect to login page
        router.push("/");
      } else if (authMethod === "keycloak") {
        // NextAuth logout
        await signOut({
          callbackUrl: window.location.origin + "/",
        });
      } else {
        // Fallback: clear state and redirect if no auth method is set
        setToken(null);
        setRoles([]);
        setUser(null);
        setIsAuthenticated(false);
        setAuthMethod(null);
        setError(null);
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, redirect to login page
      router.push("/");
    }
  }, [authMethod, router]);

  // Refresh token function (NextAuth handles this automatically)
  const refreshToken = useCallback(async () => {
    // NextAuth automatically refreshes tokens, but we can trigger a session update
    if (authMethod === "keycloak" && session) {
      // Force a session update by refetching
      await fetch("/api/auth/session", { method: "GET" });
    }
  }, [authMethod, session]);

  // Refresh user role from ERPNext (real-time role update)
  const refreshUserRole = useCallback(async () => {
    if (authMethod !== "erpnext" || !isAuthenticated || !token) {
      return;
    }

    try {
      // Get username from localStorage (most reliable source)
      const storedUserStr = localStorage.getItem("erpnext_user");
      if (!storedUserStr) {
        return;
      }

      const storedUser = JSON.parse(storedUserStr);
      const username = storedUser.username || storedUser.id;

      if (!username) {
        console.warn("Cannot refresh role: username not available");
        return;
      }

      // Fetch latest user details from ERPNext (cached, single call)
      const raw = await fetchUserDetailsCached(username, token) || {};
      const userData = raw as {
        role?: string;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        email?: string;
      };

      // Extract role from user data
      const userRoleField = userData.role;
      let newRole = "user";

      // Determine role (same logic as backend)
      if (userRoleField) {
        const roleLower = userRoleField.toLowerCase();
        if (roleLower === "admin") {
          newRole = "admin";
        } else if (roleLower === "superadmin") {
          newRole = "SuperAdmin";
        }
      }

      // Get current role from state (use functional update to get latest)
      setUser((currentUser) => {
        const currentRole = currentUser?.role || storedUser.role || "user";

        // Only update if role has changed
        if (currentRole !== newRole) {
          console.log(`Role updated: ${currentRole} -> ${newRole}`);

          // Update user object with new role and latest data
          const updatedUser = {
            ...(currentUser || storedUser),
            role: newRole,
            firstName:
              userData.first_name ||
              currentUser?.firstName ||
              storedUser.firstName ||
              userData.full_name?.split(" ")[0] ||
              "",
            lastName:
              userData.last_name ||
              currentUser?.lastName ||
              storedUser.lastName ||
              userData.full_name?.split(" ").slice(1).join(" ") ||
              "",
            email: userData.email || currentUser?.email || storedUser.email,
          };

          // Update roles array
          const newRoles =
            newRole === "admin"
              ? ["admin", "admin_role"]
              : newRole === "SuperAdmin"
              ? ["SuperAdmin", "superadmin", "admin", "admin_role"]
              : ["user", "user_role"];

          setRoles(newRoles);

          // Update localStorage
          localStorage.setItem("erpnext_user", JSON.stringify(updatedUser));

          return updatedUser;
        }

        return currentUser;
      });
    } catch (error) {
      console.error("Failed to refresh user role:", error);
      // Don't throw - this is a background update, shouldn't break the app
    }
  }, [authMethod, isAuthenticated, token, fetchUserDetailsCached]);

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
    refreshUserRole,
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
