"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import LoginPage from "../components/LoginPage";
import DashboardPage from "./pages/dashboard/page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Redirect to dashboard by default
  return <DashboardPage />;
}
