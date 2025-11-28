"use client";

import { useAuth } from "../lib/auth/AuthProvider";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            LoRaWAN Dashboard
          </CardTitle>
          <CardDescription>
            Please log in to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You need to authenticate with Keycloak to access this application.
            </p>
            <Button
              onClick={login}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Logging in..." : "Login with Keycloak"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
