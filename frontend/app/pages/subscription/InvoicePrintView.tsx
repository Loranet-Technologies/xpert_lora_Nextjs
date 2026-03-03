"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cloud } from "lucide-react";
import type { BillingHistoryItem } from "@/lib/api/subscription/subscription";

const COMPANY_NAME = "Xpert LoRa";
const COMPANY_TAGLINE = "LoRaWAN Network Solutions";
const COMPANY_ADDRESS = "Tech Park, Malaysia";
const SUPPORT_EMAIL = "support@xperts.loranet.my";

interface InvoicePrintViewProps {
  invoice: BillingHistoryItem | null;
  organizationName: string;
  planName?: string;
}

function formatCurrency(amount: number, currency?: string) {
  const symbol = currency === "MYR" ? "RM" : currency || "RM";
  return `${symbol} ${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoicePrintView({
  invoice,
  organizationName,
  planName,
}: InvoicePrintViewProps) {
  if (!invoice) return null;

  const total = invoice.grand_total ?? 0;
  const currency = invoice.currency || "MYR";
  const isPaid = (invoice.status || "").toLowerCase() === "paid";
  const description =
    invoice.subject ||
    invoice.reference_name ||
    planName ||
    `Payment Request ${invoice.name}`;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-root,
          .invoice-print-root * {
            visibility: visible;
          }
          .invoice-print-root {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div className="invoice-print-root hidden print:block p-6 sm:p-8">
        <Card className="overflow-hidden border shadow-none print:shadow-none">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-primary" />
          <CardContent className="p-0">
            <div className="relative p-6 sm:p-10">
              {/* Paid watermark */}
              {isPaid && (
                <div className="absolute top-32 right-8 transform rotate-12 pointer-events-none opacity-20 select-none">
                  <div className="border-4 border-primary px-6 py-3 rounded-lg">
                    <span className="text-5xl font-black text-primary uppercase tracking-widest">
                      PAID
                    </span>
                  </div>
                </div>
              )}

              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10 relative">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Cloud className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{COMPANY_NAME}</h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {COMPANY_TAGLINE}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>{COMPANY_ADDRESS}</p>
                    <p className="text-primary font-medium">{SUPPORT_EMAIL}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-3xl font-black text-muted-foreground uppercase tracking-tight mb-2">
                    Invoice
                  </h2>
                  <div className="space-y-1">
                    <div className="flex sm:justify-end gap-3 text-sm">
                      <span className="text-muted-foreground font-medium">
                        Invoice No:
                      </span>
                      <span className="font-bold">{invoice.name}</span>
                    </div>
                    <div className="flex sm:justify-end gap-3 text-sm">
                      <span className="text-muted-foreground font-medium">
                        Date:
                      </span>
                      <span>{formatDate(invoice.creation)}</span>
                    </div>
                    <div className="flex sm:justify-end mt-3">
                      <Badge
                        variant="secondary"
                        className={
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        Status: {invoice.status || "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-10" />

              {/* Bill To & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Bill To
                  </h3>
                  <p className="font-semibold text-lg">{organizationName}</p>
                  {invoice.party && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {invoice.party}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    Company Details
                  </h3>
                  <div className="text-muted-foreground text-sm space-y-1">
                    <p>
                      <span className="font-medium text-foreground">
                        Support:
                      </span>{" "}
                      {SUPPORT_EMAIL}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Invoice:
                      </span>{" "}
                      {invoice.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="overflow-x-auto mb-10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 hover:bg-transparent">
                      <TableHead className="uppercase text-muted-foreground font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="uppercase text-muted-foreground font-semibold text-center w-20">
                        Qty
                      </TableHead>
                      <TableHead className="uppercase text-muted-foreground font-semibold text-right">
                        Price
                      </TableHead>
                      <TableHead className="uppercase text-muted-foreground font-semibold text-right">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="font-semibold">{description}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 italic">
                          {formatDate(invoice.creation)} – Payment Request
                        </div>
                      </TableCell>
                      <TableCell className="text-center">1</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(total, currency)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(total, currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex flex-col items-end">
                <div className="w-full sm:w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span className="font-medium">
                      {formatCurrency(0, currency)}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-black text-primary">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="mt-10 p-5 rounded-xl bg-muted/50 border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Payment Information
                </h4>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Transaction: {invoice.name}</span>
                  {isPaid && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Paid
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-10 text-center">
                <p className="font-medium text-muted-foreground">
                  Thank you for your business!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions? Contact {SUPPORT_EMAIL}
                </p>
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
              <p>
                © {new Date().getFullYear()} {COMPANY_NAME}. All rights
                reserved.
              </p>
              <p className="font-medium text-primary">{SUPPORT_EMAIL}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

