"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import LoginPage from "@/components/LoginPage";

export default function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirect = sessionStorage.getItem("post_login_redirect");
      router.replace(redirect || "/");
      sessionStorage.removeItem("post_login_redirect");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isAuthenticated && !isLoading) {
    return null; // Redirecting
  }

  return <LoginPage />;
}
