"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth/AuthProvider";
import LandingPage from "../components/LandingPage";
import DashboardPage from "./pages/dashboard/page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to stored URL after login (e.g. from Subscribe on landing)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirect = sessionStorage.getItem("post_login_redirect");
      if (redirect) {
        sessionStorage.removeItem("post_login_redirect");
        router.push(redirect);
        return;
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage />;
}
