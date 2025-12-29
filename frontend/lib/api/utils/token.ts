import Cookies from "js-cookie";

// Helper function to get ERPNext token, with fallback to Keycloak token
export async function getERPNextToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // First, try to get ERPNext token from localStorage
  let token = localStorage.getItem("erpnext_token");
  if (token) {
    return token;
  }

  // Try to get from cookies
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "erpnext_token") {
      token = value;
      if (token) {
        // Also store in localStorage for consistency
        localStorage.setItem("erpnext_token", token);
        return token;
      }
    }
  }

  // Fallback: Try to get Keycloak token and authenticate with ERPNext
  // Get Keycloak token from NextAuth session
  try {
    const sessionResponse = await fetch("/api/auth/session");
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      if (session?.accessToken) {
        // Try to authenticate with ERPNext using Keycloak token via SSO
        try {
          const erpnextLoginResponse = await fetch(
            "/api/erpnext/login-with-keycloak",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ keycloakToken: session.accessToken }),
              credentials: "include",
            }
          );

          if (erpnextLoginResponse.ok) {
            const data = await erpnextLoginResponse.json();
            if (data.token) {
              // Store the ERPNext token for future use
              localStorage.setItem("erpnext_token", data.token);
              Cookies.set("erpnext_token", data.token, { expires: 7 });
              localStorage.setItem("erpnext_session_active", "true");

              // Also store API credentials if available
              if (data.api_key) {
                localStorage.setItem("erpnext_api_key", data.api_key);
              }
              if (data.api_secret) {
                localStorage.setItem("erpnext_api_secret", data.api_secret);
              }

              return data.token;
            }
          } else {
            // SSO login failed, but we can still use Keycloak token
            // The ERPNext auth hook should validate it
            console.warn(
              "ERPNext SSO login failed, using Keycloak token directly"
            );
            return session.accessToken;
          }
        } catch (error) {
          console.warn("Failed to get ERPNext token with Keycloak:", error);
          // Fallback to Keycloak token - auth hook should handle it
          return session.accessToken;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to get session:", error);
  }

  return null;
}
