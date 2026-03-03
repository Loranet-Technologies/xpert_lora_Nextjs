"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getPaymentRequestStatus } from "@/lib/api/payment/payment";

type SyncStatus = "idle" | "polling" | "paid" | "timeout" | "error";

export default function PaySuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paymentRequestName = params?.paymentRequestName as string | undefined;
  const returnTo = searchParams.get("return_to") || "/pages/dashboard";
  const isSubscriptionReturn = returnTo.includes("subscription");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    if (!paymentRequestName) return;

    let cancelled = false;
    const maxAttempts = 15;
    const intervalMs = 2000;

    const poll = async () => {
      setSyncStatus("polling");
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        try {
          const res = await getPaymentRequestStatus(paymentRequestName);
          if (cancelled) return;
          if (res.status === "Paid") {
            setSyncStatus("paid");
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      if (!cancelled) setSyncStatus("timeout");
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentRequestName]);

  const showPolling = syncStatus === "polling";
  const successMessage =
    syncStatus === "paid"
      ? "Thank you. Your payment has been recorded and the invoice has been updated."
      : syncStatus === "timeout"
        ? "Thank you. Your payment has been received. If the invoice does not update shortly, it will be updated by our system; you can close this page or go back to the dashboard."
        : "Thank you. Your payment has been received. You can close this page or go back to the dashboard.";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Payment successful" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-md">
            <Card className="border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                  Payment completed
                </CardTitle>
                <CardDescription>
                  {paymentRequestName && (
                    <>
                      Payment Request:{" "}
                      <span className="font-mono">{paymentRequestName}</span>
                    </>
                  )}
                  {!paymentRequestName && "Your payment was successful."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showPolling && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <AlertDescription>
                      Confirming with the server… Your invoice will be updated
                      shortly.
                    </AlertDescription>
                  </Alert>
                )}
                {!showPolling && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}
                <Button asChild className="w-full">
                  <Link
                    href={
                      isSubscriptionReturn && paymentRequestName
                        ? `${returnTo}?payment_request=${encodeURIComponent(paymentRequestName)}`
                        : returnTo
                    }
                  >
                    {isSubscriptionReturn
                      ? "Back to Subscriptions"
                      : "Back to dashboard"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
