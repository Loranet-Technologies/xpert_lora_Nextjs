"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  paymentRequestName: string;
  returnTo?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function PaymentForm({
  paymentRequestName,
  returnTo,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    onError(""); // clear previous error

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== "undefined" ? window.location.origin : ""}/pages/pay/${encodeURIComponent(paymentRequestName)}/success${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`,
          receipt_email: undefined, // optional: collect email
          payment_method_data: {
            // optional: billing_details for invoice
          },
        },
      });

      if (error) {
        onError(error.message ?? "Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // If we reach here, payment may still be processing (e.g. 3D Secure).
      // For Payment Element, confirmPayment often redirects to return_url.
      // If no redirect, consider success (e.g. card succeeded without 3DS).
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
            radios: true,
            spacedAccordionItems: true,
          },
        }}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Pay now"
        )}
      </Button>
    </form>
  );
}
