"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/api/subscription/subscription";
import { createOrganization } from "@/lib/api/organization/organization";
import {
  createPaymentIntentForPlan,
  createRazorpayOrderForPlan,
  completeRazorpayPaymentForPlan,
} from "@/lib/api/payment/payment";

const CHECKOUT_CONTEXT_KEY = "checkout_context";
const PLAN_PAYMENT_STORAGE_KEY = "plan_payment";

interface CheckoutContext {
  plan: SubscriptionPlan;
  orgName: string;
  orgEmail?: string;
  orgPhone?: string;
  orgAddress?: string;
  selectedOrgType: string;
}

function formatPrice(amount: number | undefined): string {
  if (amount == null || amount <= 0) return "—";
  return `RM ${Number(amount).toFixed(2)}`;
}

function planFeatures(plan: SubscriptionPlan) {
  return [
    {
      title: "Devices",
      description: `${plan.max_devices} device${plan.max_devices !== 1 ? "s" : ""}`,
    },
    {
      title: "Messages",
      description: `${plan.included_messages.toLocaleString()} messages / ${plan.billing_interval.toLowerCase()}`,
    },
    {
      title: "Data",
      description: `${plan.included_data_mb} MB included`,
    },
    {
      title: "Billing",
      description:
        plan.billing_interval === "Month"
          ? "Monthly billing"
          : "Yearly billing",
    },
  ];
}

export default function CheckoutPage() {
  const router = useRouter();
  const [context, setContext] = useState<CheckoutContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "razorpay">(
    "stripe",
  );

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Razorpay is only available in the browser."));
        return;
      }
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existingScript) {
        if (typeof (window as any).Razorpay !== "undefined") {
          resolve();
        } else {
          existingScript.addEventListener("load", () => resolve());
          existingScript.addEventListener("error", () =>
            reject(new Error("Failed to load Razorpay script")),
          );
        }
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
      if (!raw) {
        router.replace("/pages/subscription");
        return;
      }
      const parsed = JSON.parse(raw) as CheckoutContext;
      if (!parsed?.plan?.name || !parsed.orgName || !parsed.selectedOrgType) {
        sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
        router.replace("/pages/subscription");
        return;
      }
      setContext(parsed);
    } catch {
      sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
      router.replace("/pages/subscription");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handlePay = async () => {
    if (!context) return;
    setError(null);
    setPaying(true);
    try {
      const orgId = await createOrganization({
        organization_name: context.orgName,
        organization_type: context.selectedOrgType,
        contact_email: context.orgEmail,
        contact_phone: context.orgPhone,
        billing_address: context.orgAddress,
      });

      const amount = context.plan.cost ?? context.plan.plan_price;
      const normalizedAmount =
        typeof amount === "number" && amount > 0 ? amount : undefined;

      if (paymentMethod === "stripe") {
        const result = await createPaymentIntentForPlan(
          orgId,
          context.plan.name,
          normalizedAmount,
        );

        const returnTo = "/pages/subscription";
        const planPayment = {
          payment_request: result.payment_request,
          client_secret: result.client_secret,
          publishable_key: result.publishable_key,
          amount: result.amount,
          currency: result.currency,
          organization: orgId,
          plan: context.plan.name,
          return_to: returnTo,
        };
        sessionStorage.setItem(
          PLAN_PAYMENT_STORAGE_KEY,
          JSON.stringify(planPayment),
        );
        sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);

        router.push(
          `/pages/pay/${encodeURIComponent(
            result.payment_request,
          )}?return_to=${encodeURIComponent(returnTo)}`,
        );
      } else {
        const order = await createRazorpayOrderForPlan(
          orgId,
          context.plan.name,
          normalizedAmount,
        );

        await loadRazorpayScript();

        if (typeof window === "undefined" || !(window as any).Razorpay) {
          throw new Error("Razorpay SDK failed to load.");
        }

        const RazorpayConstructor = (window as any).Razorpay;

        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Xperts",
          description: `Subscription for ${context.plan.name}`,
          order_id: order.order_id,
          prefill: {
            name: context.orgName,
            email: context.orgEmail,
            contact: context.orgPhone,
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await completeRazorpayPaymentForPlan({
                integration_request: order.integration_request,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
              router.push("/pages/subscription");
            } catch (e) {
              const message =
                e instanceof Error
                  ? e.message
                  : "Failed to finalize Razorpay payment";
              setError(message);
              setPaying(false);
            }
          },
          modal: {
            ondismiss: () => {
              setPaying(false);
            },
          },
          theme: {
            color: "#2563eb",
          },
          // Enable Card + FPX + Wallet (e-wallet)
          method: {
            card: true,
            fpx: true,
            wallet: true,
          },
          config: {
            display: {
              blocks: {
                payment_options: {
                  name: "Payment Options",
                  instruments: [
                    { method: "card" },
                    { method: "fpx" },
                    { method: "wallet" },
                  ],
                },
              },
              sequence: ["block.payment_options"],
              preferences: {
                show_default_blocks: false,
              },
            },
          },
        };

        const rzp = new RazorpayConstructor(options);
        rzp.open();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start payment";
      setError(message);
      setPaying(false);
    }
  };

  if (loading || !context) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="flex flex-1 items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const plan = context.plan;
  const amount = plan.cost ?? plan.plan_price;
  const amountNum = typeof amount === "number" ? amount : 0;
  const priceStr = formatPrice(amountNum);
  const subtotal = priceStr;
  const taxStr = "RM 0.00";
  const totalStr = priceStr;
  const features = planFeatures(plan);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-[1200px] min-h-[calc(100vh-8rem)] flex flex-col md:flex-row">
            {/* Left Column: Order Summary */}
            <div className="w-full md:w-5/12 p-6 md:p-8 lg:p-12 flex flex-col justify-start">
              <div className="mb-8">
                <Link
                  href="/pages/subscription"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium mb-6"
                >
                  <ArrowLeft className="size-4" />
                  Back to plans
                </Link>
                <p className="text-muted-foreground font-medium text-sm mb-2 uppercase tracking-wider">
                  Subscribe to
                </p>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {plan.plan_name}
                </h1>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {priceStr}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    per {plan.billing_interval.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-0.5 flex items-center justify-center">
                      <Check className="size-4 text-primary font-bold" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {feature.title}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border pt-6 mt-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span className="font-medium text-foreground">{taxStr}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-bold text-lg text-foreground">
                    Total due today
                  </span>
                  <span className="font-bold text-2xl text-foreground">
                    {totalStr}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Review & Pay */}
            <div className="w-full md:w-7/12 p-6 md:p-8 lg:p-12 flex items-center justify-center bg-background md:bg-transparent">
              <Card className="w-full max-w-md shadow-lg border-border">
                <CardHeader>
                  <CardTitle>Review & pay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact summary from subscription step */}
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      Contact & organization
                    </h2>
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1 text-sm">
                      <p className="font-medium text-foreground">
                        {context.orgName}
                      </p>
                      {context.orgEmail && (
                        <p className="text-muted-foreground">
                          {context.orgEmail}
                        </p>
                      )}
                      {context.orgPhone && (
                        <p className="text-muted-foreground">
                          {context.orgPhone}
                        </p>
                      )}
                      <p className="text-muted-foreground capitalize">
                        {context.selectedOrgType.replace(/_/g, " ")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To change details, go back to plans and select again.
                    </p>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      Payment method
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("stripe")}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          paymentMethod === "stripe"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        Stripe
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("razorpay")}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          paymentMethod === "razorpay"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        Razorpay
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full font-bold py-6 text-base shadow-lg"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Setting up payment…
                      </>
                    ) : (
                      <>
                        <Lock className="size-5" />
                        Pay {totalStr} with{" "}
                        {paymentMethod === "stripe" ? "Stripe" : "Razorpay"}
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground px-4">
                    {paymentMethod === "stripe"
                      ? "You will be taken to a secure Stripe page to complete payment."
                      : "You will be taken to a secure Razorpay page to complete payment."}
                  </p>
                </CardContent>

                {/* Footer */}
                <div className="px-8 pb-8 pt-0">
                  <div className="border-t border-border pt-6 flex flex-col items-center space-y-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShieldCheck className="size-4" />
                      <span className="text-xs font-medium uppercase tracking-tighter">
                        Secure payment powered by Stripe
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href="#"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Terms of Service
                      </Link>
                      <Link
                        href="#"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
