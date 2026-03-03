"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { createPaymentIntent } from "@/lib/api/payment/payment";
import { getPaymentErrorMessage } from "@/lib/api/utils/parseErpNextError";
import { PaymentForm } from "./PaymentForm";

type PaymentStatus = "loading" | "form" | "success" | "error";

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentRequestName = params?.paymentRequestName as string | undefined;
  const returnTo = searchParams.get("return_to") || "/pages/dashboard";
  const isSubscriptionReturn = returnTo.includes("subscription");

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  const PLAN_PAYMENT_STORAGE_KEY = "plan_payment";

  useEffect(() => {
    if (!paymentRequestName) {
      setError("Payment request not found.");
      setStatus("error");
      return;
    }

    const requestName: string = paymentRequestName;
    let cancelled = false;

    async function init() {
      try {
        if (typeof window !== "undefined") {
          try {
            const raw = sessionStorage.getItem(PLAN_PAYMENT_STORAGE_KEY);
            if (raw) {
              const stored = JSON.parse(raw) as {
                payment_request?: string;
                client_secret?: string;
                publishable_key?: string;
                amount?: number;
                currency?: string;
              };
              if (
                stored.payment_request === requestName &&
                stored.client_secret &&
                stored.publishable_key
              ) {
                if (cancelled) return;
                setClientSecret(stored.client_secret);
                setPublishableKey(stored.publishable_key);
                setAmount(
                  typeof stored.amount === "number" ? stored.amount : null,
                );
                setCurrency((stored.currency || "usd").toUpperCase());
                setStripePromise(loadStripe(stored.publishable_key));
                setStatus("form");
                return;
              }
            }
          } catch {
            // ignore
          }
        }

        const data = await createPaymentIntent(requestName);
        if (cancelled) return;
        setClientSecret(data.client_secret);
        setPublishableKey(data.publishable_key);
        setAmount(data.amount);
        setCurrency((data.currency || "usd").toUpperCase());
        if (data.publishable_key) {
          setStripePromise(loadStripe(data.publishable_key));
        }
        setStatus("form");
      } catch (e) {
        if (cancelled) return;
        const raw = e instanceof Error ? e.message : "Failed to load payment form.";
        setError(getPaymentErrorMessage(raw));
        setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [paymentRequestName]);

  const handlePaymentSuccess = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(PLAN_PAYMENT_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as { payment_request?: string };
          if (stored.payment_request === paymentRequestName) {
            sessionStorage.removeItem(PLAN_PAYMENT_STORAGE_KEY);
          }
        }
      } catch {
        // ignore
      }
    }
    setStatus("success");
  };

  const formatAmount = (value: number, curr: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr,
    }).format(value);
  };

  if (!paymentRequestName) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Payment" />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Invalid payment link. Missing payment request.</AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Payment" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-md">
            <Card className="border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete payment
                </CardTitle>
                <CardDescription>
                  Payment Request: <span className="font-mono">{paymentRequestName}</span>
                  {amount != null && (
                    <> · {formatAmount(amount, currency)}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {status === "loading" && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Preparing payment form…</p>
                  </div>
                )}

                {status === "error" && (
                  <>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={returnTo}>
                        {isSubscriptionReturn
                          ? "Back to Subscriptions"
                          : "Back to dashboard"}
                      </Link>
                    </Button>
                  </>
                )}

                {status === "success" && (
                  <>
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription>
                        Payment completed. The invoice will be updated shortly. You can close this page.
                      </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full">
                      <Link href={returnTo}>
                        {isSubscriptionReturn
                          ? "Back to Subscriptions"
                          : "Back to dashboard"}
                      </Link>
                    </Button>
                  </>
                )}

                {status === "form" && clientSecret && stripePromise && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#2563eb",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      paymentRequestName={paymentRequestName}
                      returnTo={returnTo}
                      onSuccess={handlePaymentSuccess}
                      onError={setError}
                    />
                  </Elements>
                )}
              </CardContent>
              {status === "form" && (
                <CardFooter className="text-muted-foreground text-xs">
                  Payments are processed securely by Stripe. Your card details are not stored on our servers.
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
