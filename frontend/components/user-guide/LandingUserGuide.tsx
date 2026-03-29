"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const USER_GUIDE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "registration", label: "User registration" },
  { id: "verification", label: "Verification & approval" },
  { id: "subscription", label: "Subscription & payment" },
  { id: "activation", label: "System activation" },
  { id: "api", label: "API integration" },
  { id: "ongoing", label: "Day-to-day usage" },
] as const;

function GuideSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-primary">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function LandingUserGuide() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <div className="space-y-3 text-center md:text-left">
        <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
          End-to-end user guide
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          How to register, get approved, subscribe, activate product access,
          connect integrations, and run your LoRaWAN workspace in this
          application.
        </p>
      </div>

      <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">On this page</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="flex flex-wrap justify-center gap-2 md:justify-start">
            {USER_GUIDE_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "inline-flex items-center rounded-md border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-8">
        <GuideSection
          id="overview"
          title="Overview"
          description="What this application does in the overall workflow."
        >
          <p className="text-foreground/90">
            The LoRaWAN Dashboard is the web front end for your Xperts LoRa
            stack. It signs you in against ERPNext (with optional SSO flows),
            loads subscription and usage from your organization’s account, and
            lets you manage applications, devices, gateways, and related
            settings. Payments for subscriptions are handled through integrated
            checkout (for example Razorpay), with state kept in sync on the
            ERPNext side.
          </p>
        </GuideSection>

        <GuideSection
          id="registration"
          title="User registration"
          description="Creating a new login before you use the system."
        >
          <BulletList
            items={[
              <>
                Open the public registration screen at{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  /register
                </Link>
                .
              </>,
              <>
                Enter your{" "}
                <strong className="text-foreground">full name</strong>,{" "}
                <strong className="text-foreground">email</strong>, and a{" "}
                <strong className="text-foreground">password</strong> (at least
                8 characters). Confirm the password and accept the terms.
              </>,
              <>
                Submit the form. The app calls the backend to create your user
                record. On success you will be prompted to sign in on the login
                page.
              </>,
            ]}
          />
          <p>
            If registration fails, the message returned from the server (for
            example duplicate email) is shown in a toast—correct the input and
            try again.
          </p>
        </GuideSection>

        <GuideSection
          id="verification"
          title="Account verification and approval"
          description="Signing in and when an administrator must enable your account."
        >
          <BulletList
            items={[
              <>
                Go to{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  /login
                </Link>{" "}
                and authenticate with your email and password (ERPNext
                session). Your session token is stored for subsequent API calls.
              </>,
              <>
                Depending on how your site is configured, new users may be
                created as{" "}
                <strong className="text-foreground">disabled</strong> until an
                administrator enables them. Admins use{" "}
                <strong className="text-foreground">Users Management</strong> (
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  /pages/users
                </code>
                ) to review users, assign roles (for example User, Admin,
                SuperAdmin), and toggle access.
              </>,
              <>
                If you cannot log in after registering, contact your
                organization’s admin or support so they can confirm the account
                is enabled and assigned the correct role.
              </>,
            ]}
          />
        </GuideSection>

        <GuideSection
          id="subscription"
          title="Subscription and payment"
          description="Choosing a plan, paying, and reconciling status."
        >
          <p className="text-foreground/90">
            Billing is tied to your{" "}
            <strong className="text-foreground">organization</strong> in
            ERPNext. After you sign in, use the{" "}
            <Link
              href="/pages/subscription"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Subscription
            </Link>{" "}
            area to view plans, trials, and payment status.
          </p>
          <Separator className="my-2" />
          <BulletList
            items={[
              <>
                From subscription or checkout flows, select a plan and proceed
                to{" "}
                <Link
                  href="/pages/checkout"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  checkout
                </Link>
                . The app can create a Razorpay order and open the payment modal
                (cards, FPX, e-wallets, depending on configuration).
              </>,
              <>
                After you pay, the app finalizes the payment with the backend so
                invoices and subscription documents stay aligned. If you land
                on a payment success page, it may briefly poll until the invoice
                shows as paid.
              </>,
              <>
                Outstanding amounts, next due dates, and payment status appear on
                the{" "}
                <Link
                  href="/pages/dashboard"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Dashboard
                </Link>{" "}
                summary when the backend provides them.
              </>,
            ]}
          />
          <p>
            Admins can maintain payment merchants and gateway credentials under{" "}
            <strong className="text-foreground">Merchant Management</strong>,
            including environment (production vs sandbox), keys, and related
            metadata used by the billing integration.
          </p>
        </GuideSection>

        <GuideSection
          id="activation"
          title="System activation"
          description="When features unlock, how smart usage controls work, and what happens if access is on hold."
        >
          <p className="text-foreground/90">
            The dashboard loads an account summary that includes subscription
            status. For normal use, the subscription should be in an active state
            such as:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Active</Badge>
            <Badge variant="secondary">Trialling</Badge>
          </div>
          <p>
            If the account is on hold—or the subscription is not in an allowed
            state—the app may limit navigation to operational sections and guide
            you toward Subscription, Checkout, Dashboard, Settings, or payment
            recovery until billing is resolved.
          </p>
          <p>
            Smart usage controls (for example{" "}
            <strong className="text-foreground">device counts</strong> and
            message or data allowances) come from the same subscription context;
            creating devices may be restricted when you are over limit or not
            entitled.
          </p>
        </GuideSection>

        <GuideSection
          id="api"
          title="API integration and configuration"
          description="How the browser talks to ERPNext and how operators configure environments."
        >
          <BulletList
            items={[
              <>
                <strong className="text-foreground">Browser to Next.js:</strong>{" "}
                The React app calls routes under{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  /api/erpnext/...
                </code>
                . Those API routes proxy to your ERPNext site’s{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  xpert_lora_app
                </code>{" "}
                methods and resources.
              </>,
              <>
                <strong className="text-foreground">Authentication:</strong>{" "}
                After ERPNext login, requests send your bearer token (or
                equivalent) so the proxy can act as you. Do not embed secrets in
                client-side code; keep keys in server environment variables.
              </>,
              <>
                <strong className="text-foreground">Deployment URLs:</strong> Set{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_ERPNEXT_URL
                </code>{" "}
                to your Frappe/ERPNext base URL and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_API_URL
                </code>{" "}
                if your deployment uses a separate REST service (defaults exist
                for local development).
              </>,
              <>
                <strong className="text-foreground">Optional SSO:</strong>{" "}
                Keycloak or similar can be wired for federated login; see your
                project’s Keycloak setup notes for realm, client, and role
                mapping.
              </>,
            ]}
          />
          <p>
            Custom automation or external systems should call ERPNext’s
            documented API directly with appropriate API keys or user sessions,
            or go through your own backend—not by scraping the Next.js UI.
          </p>
        </GuideSection>

        <GuideSection
          id="ongoing"
          title="Ongoing system usage and management"
          description="Primary areas you will use after you are up and running."
        >
          <BulletList
            items={[
              <>
                <strong className="text-foreground">Dashboard & alerts:</strong>{" "}
                High-level account, subscription, usage, and billing signals;
                notifications may also surface in the header.
              </>,
              <>
                <strong className="text-foreground">
                  Organizations & tenants:
                </strong>{" "}
                Admins manage organizational structure as configured for your
                deployment.
              </>,
              <>
                <strong className="text-foreground">Applications:</strong>{" "}
                Define and maintain LoRaWAN application entities linked to your
                network operations.
              </>,
              <>
                <strong className="text-foreground">
                  Device profiles, devices, gateways:
                </strong>{" "}
                Configure device templates, register devices, register and sync
                gateways, and use the device list for inventory-style views.
              </>,
              <>
                <strong className="text-foreground">Settings:</strong> Update
                profile details, password, and related preferences.
              </>,
              <>
                <strong className="text-foreground">Admin-only tools:</strong>{" "}
                Subscription dashboards and lifecycle tools, payment and billing
                logs, activity logs, user administration, and merchant/gateway
                management for operators who run the platform.
              </>,
            ]}
          />
          <p>
            For access problems, start with Subscription and Dashboard; for
            account lockout, contact an administrator; for integration failures,
            verify ERPNext availability and environment variables on the server
            hosting this Next.js app.
          </p>
        </GuideSection>
      </div>
    </div>
  );
}
