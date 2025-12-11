import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId:
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||
        process.env.KEYCLOAK_CLIENT_ID ||
        "loranet_xperts",
      clientSecret:
        process.env.KEYCLOAK_CLIENT_SECRET ||
        "V13zkcvflWeAn6cNrwBioIUSFEnSq9Fa",
      issuer: process.env.NEXT_PUBLIC_KEYCLOAK_URL
        ? `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${
            process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "loranet_xperts"
          }`
        : process.env.KEYCLOAK_ISSUER ||
          "https://keycloak.loranet.my/realms/loranet_xperts",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in - store account info in token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub || "";
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

async function refreshAccessToken(token: any) {
  try {
    const keycloakUrl =
      process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
      process.env.KEYCLOAK_URL ||
      "https://keycloak.loranet.my";
    const realm =
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM ||
      process.env.KEYCLOAK_REALM ||
      "loranet_xperts";
    const clientId =
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ||
      process.env.KEYCLOAK_CLIENT_ID ||
      "loranet_xperts";
    const clientSecret =
      process.env.KEYCLOAK_CLIENT_SECRET || "V13zkcvflWeAn6cNrwBioIUSFEnSq9Fa";

    const response = await fetch(
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
