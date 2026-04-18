"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { GuideImagePlaceholder } from "./GuideImagePlaceholder";

export const USER_GUIDE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "registration", label: "User registration" },
  { id: "verification", label: "Verification & approval" },
  { id: "subscription", label: "Subscription & payment" },
  { id: "activation", label: "System activation" },
  { id: "page-organizations", label: "Organizations" },
  { id: "page-applications", label: "Applications" },
  { id: "page-device-profile", label: "Device profile" },
  { id: "page-devices", label: "Devices" },
  { id: "page-gateways", label: "Gateways" },
  { id: "page-device-list", label: "Device list" },
  { id: "page-subscription-app", label: "Subscription (app)" },

  { id: "page-pay", label: "Pay links" },
  { id: "page-subscription-dashboard", label: "Sub. dashboard" },
  { id: "page-subscription-management", label: "Sub. management" },
  { id: "page-activity-logs", label: "Activity logs" },
  { id: "page-subscription-lifecycle-logs", label: "Sub. lifecycle" },
  { id: "page-payment-billing-logs", label: "Pay & billing logs" },
  { id: "page-merchants", label: "Merchants" },
  { id: "page-settings", label: "Settings" },
  { id: "troubleshooting", label: "Troubleshooting" },
] as const;

export type UserGuideVariant = "embedded" | "standalone";

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

function AppPageGuideCard({
  id,
  title,
  description,
  href,
  access,
  image,
  children,
}: {
  id: string;
  title: string;
  description: string;
  href?: string;
  access?: string;
  image: {
    slotId: string;
    title: string;
    fileName: string;
    hint: string;
  };
  children: ReactNode;
}) {
  return (
    <GuideSection id={id} title={title} description={description}>
      {href ? (
        <p>
          <Link
            href={href}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Open in the app
          </Link>
          <span className="text-muted-foreground">
            {" "}
            —{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{href}</code>
          </span>
        </p>
      ) : null}
      {access ? (
        <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
          {access}
        </p>
      ) : null}
      {children}
      <GuideImagePlaceholder
        slotId={image.slotId}
        title={image.title}
        fileName={image.fileName}
        hint={image.hint}
      />
    </GuideSection>
  );
}

export function UserGuideContent({ variant }: { variant: UserGuideVariant }) {
  const standalone = variant === "standalone";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <div className="space-y-4 text-center md:text-left">
        {standalone ? (
          <h1 className="text-3xl font-black tracking-tight lg:text-4xl">
            User guide — full walkthrough
          </h1>
        ) : (
          <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
            End-to-end user guide
          </h2>
        )}
        <p className="text-muted-foreground text-base leading-relaxed">
          {standalone ? (
            <>
              Same content as the home page, with screenshots under each section
              and in-app page card. Handy for printing or sharing with
              management.
            </>
          ) : (
            <>
              From first signup through billing, activation, and a full tour of
              every in-app page — what each screen is for, in plain language.
            </>
          )}
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
          description="What you are looking at, and how it fits together."
        >
          <p className="text-foreground/90">
            This app is the browser front end for your Xperts LoRa stack. You
            sign in through ERPNext (sometimes via SSO, depending on how your
            company set things up). After that, the UI pulls subscription and
            usage from your organisation record, and you get screens for
            applications, devices, gateways, and the usual account settings.
          </p>
          <p>
            Payments run through whatever checkout your team configured — often
            Razorpay for cards or local methods. The important part is that the
            paid state is written back to ERPNext so invoices and subscription
            documents stay honest. You should not need to juggle two truths
            between the portal and the books.
          </p>
          <GuideImagePlaceholder
            slotId="image-overview"
            title="Product context"
            fileName="01-overview-home-or-hero.png"
            hint="Wide shot of the marketing home or logged-in shell so readers see the product name and overall layout."
          />
        </GuideSection>

        <GuideSection
          id="registration"
          title="User registration"
          description="Creating an account before anyone expects you inside the workspace."
        >
          <p className="text-foreground/90">
            Start on the public registration screen (
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              /register
            </Link>
            ). You will need a full name, email, and a password of at least
            eight characters, plus confirmation and acceptance of the terms.
          </p>
          <BulletList
            items={[
              <>
                Submit the form once everything looks right. The app calls the
                backend to create the user; on success you are nudged toward the
                login page rather than being dropped into the app silently.
              </>,
              <>
                If something is wrong — duplicate email is the usual one — you
                get a toast with the server message. Fix the field and try
                again; there is no partial account to clean up on your side.
              </>,
            ]}
          />
          <p>
            Keep the email you register with handy: it is the same identifier
            you will use at login, and admins match support tickets to it.
          </p>
          <GuideImagePlaceholder
            slotId="image-register"
            title="Registration screen"
            fileName="02-register-form-filled.png"
            hint="The /register form with labels visible; blur or fake data if this is a staging grab."
          />
        </GuideSection>

        <GuideSection
          id="verification"
          title="Account verification and approval"
          description="Logging in for the first time, and what admins do behind the scenes."
        >
          <p className="text-foreground/90">
            Head to{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              /login
            </Link>{" "}
            and sign in with email and password. That handshake creates the
            ERPNext session the app reuses for API calls, so you stay signed in
            across pages until the session expires or you log out.
          </p>
          <p>
            Many installs create new users in a disabled state until an admin
            flips them on. That is not a bug — it is a guardrail. Your admin
            opens <strong className="text-foreground">Users management</strong>{" "}
            at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /pages/users
            </code>
            , checks who joined, assigns roles (User, Admin, SuperAdmin, and so
            on), and enables the account. If you cannot log in right after
            registering, ask them to confirm both enablement and role before you
            spend time on password resets.
          </p>
          <GuideImagePlaceholder
            slotId="image-login"
            title="Login page"
            fileName="03-login-page.png"
            hint="Standard login with email and password fields; no secrets in frame."
          />
          <GuideImagePlaceholder
            slotId="image-users-admin"
            title="Users management (admin)"
            fileName="04-users-management-row.png"
            hint="A row or detail panel showing role and enabled toggle so approvers see what they are changing."
          />
        </GuideSection>

        <GuideSection
          id="subscription"
          title="Subscription and payment"
          description="Plans, checkout, and how paid status shows up elsewhere."
        >
          <p className="text-foreground/90">
            Billing hangs off your{" "}
            <strong className="text-foreground">organisation</strong> in
            ERPNext, not off your personal login. After you are in, open{" "}
            <Link
              href="/pages/subscription"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Subscription
            </Link>{" "}
            to see plans, trial state, and anything waiting on payment.
          </p>
          <GuideImagePlaceholder
            slotId="image-subscription"
            title="Subscription area"
            fileName="05-subscription-plans.png"
            hint="Plans or renewal view with enough context that finance recognises the screen."
          />
          <Separator className="my-2" />
          <BulletList
            items={[
              <>
                When you pick a plan, the flow sends you to{" "}
                <Link
                  href="/pages/checkout"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  checkout
                </Link>
                . The client can create a Razorpay order and open the payment
                modal; what you actually see (cards, FPX, wallets) depends on
                merchant configuration.
              </>,
              <>
                After a successful charge, the app talks to the backend to
                finalise the payment so invoices and subscription documents line
                up. If you land on a success URL, it may poll briefly until the
                invoice shows paid — give it a moment before refreshing
                manually.
              </>,
              <>
                Balances, next due dates, and status chips often surface on the{" "}
                <Link
                  href="/pages/dashboard"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Dashboard
                </Link>{" "}
                when the backend returns them. That is the quickest sanity check
                after buying or renewing.
              </>,
            ]}
          />
          <p>
            Operators maintain gateways and keys under{" "}
            <strong className="text-foreground">Merchant management</strong>{" "}
            (production vs sandbox, credentials, and related metadata). End
            users rarely touch that, but it explains who to ping when checkout
            errors mention configuration rather than card declines.
          </p>
          <GuideImagePlaceholder
            slotId="image-checkout"
            title="Checkout or payment modal"
            fileName="06-checkout-or-razorpay-modal.png"
            hint="The step where the user confirms payment; mask card numbers and keys."
          />
        </GuideSection>

        <GuideSection
          id="activation"
          title="System activation"
          description="When the app treats you as fully live, and when it holds you back."
        >
          <p className="text-foreground/90">
            The dashboard loads a summary that includes subscription state. For
            day-to-day work you want something in the allowed band — for
            example:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Active</Badge>
            <Badge variant="secondary">Trialling</Badge>
          </div>
          <p>
            If billing is on hold or the subscription is not in an allowed
            state, the UI may narrow what you can open and steer you back toward
            Subscription, Checkout, Dashboard, Settings, or a payment recovery
            path. That is intentional: it is cheaper to block device creation
            than to let you build a fleet you are not entitled to host.
          </p>
          <p>
            Smart usage limits — device counts, traffic caps, whatever your plan
            maps to — read from the same subscription context. If you hit a
            ceiling, the error should say so; upgrading or freeing capacity is
            the fix, not refreshing until it magically works.
          </p>
          <GuideImagePlaceholder
            slotId="image-activation"
            title="Dashboard subscription status"
            fileName="07-dashboard-subscription-badges.png"
            hint="The part of the dashboard that shows Active / Trialling / hold messaging."
          />
        </GuideSection>

        <AppPageGuideCard
          id="page-organizations"
          title="Organizations"
          description="Tenant records, limits, and stack identifiers that everything else hangs on."
          href="/pages/organizations"
          access="Admin (and similar elevated roles) only in the sidebar."
          image={{
            slotId: "image-page-organizations",
            title: "Organizations table or form",
            fileName: "11-page-organizations.png",
            hint: "Tenant list or edit dialog with limits visible.",
          }}
        >
          <p>
            Treat this as tenant administration. You create and edit
            organisation records that back everything else: tenant name, linkage
            to the network stack (for example ChirpStack identifiers where
            configured), and limits such as how many gateways or devices that
            tenant may carry. Getting this wrong affects every downstream
            screen.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-applications"
          title="Applications"
          description="LoRaWAN applications grouped under each tenant."
          href="/pages/applications"
          image={{
            slotId: "image-page-applications",
            title: "Applications list",
            fileName: "12-page-applications.png",
            hint: "Table with tenant column and application identifiers.",
          }}
        >
          <p>
            LoRaWAN applications live here — the logical unit you use in the
            field to group devices under one join and key policy. You pick which
            organisation each application belongs to, then add, edit, or retire
            applications. Rows show ERPNext metadata and remote identifiers used
            when syncing to the network server.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-device-profile"
          title="Device profile"
          description="Radio behaviour, join settings, and optional payload decoders per tenant."
          href="/pages/deviceProfile"
          image={{
            slotId: "image-page-device-profile",
            title: "Device profile editor",
            fileName: "13-page-device-profile.png",
            hint: "Profile form or tabs including decoder section if used.",
          }}
        >
          <p>
            Device profiles define how end devices behave on air: region, MAC
            version, regional parameters, join preferences (for example OTAA),
            frame counter behaviour, and optional payload decoder configuration.
            Profiles are scoped to a tenant so customers do not share templates.
            Use the tabs when decoder templates are wired through the backend.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-devices"
          title="Devices"
          description="Create, edit, and remove end devices with plan limits enforced."
          href="/pages/devices"
          image={{
            slotId: "image-page-devices",
            title: "Devices management",
            fileName: "14-page-devices.png",
            hint: "Device table or modal with application and profile pickers.",
          }}
        >
          <p>
            Full lifecycle management for end devices: create, edit, and remove
            devices, attach each to an application and device profile, and
            manage identifiers such as DevEUI. If you are out of device
            entitlement you will see it here rather than half-saving a row.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-gateways"
          title="Gateways"
          description="Inventory, map, sync, and per-gateway detail routes."
          href="/pages/gateways"
          image={{
            slotId: "image-page-gateways",
            title: "Gateways map or table",
            fileName: "15-page-gateways.png",
            hint: "List with sync control or map tab showing gateway positions.",
          }}
        >
          <p>
            Lists gateways with tenant filtering, manual sync when you need a
            fresh pull from the network server, and map plus table views where
            coordinates exist. Opening a row goes to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /pages/gateways/[id]
            </code>{" "}
            for last seen, location, and metadata.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-device-list"
          title="Device list"
          description="Read-focused inventory with filters and pagination."
          href="/pages/device-list"
          image={{
            slotId: "image-page-device-list",
            title: "Device list view",
            fileName: "09-device-list.png",
            hint: "Filtered table — blur serials if needed.",
          }}
        >
          <p>
            Filter by tenant and application, page through results, and open a
            device at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /pages/device-list/[id]
            </code>
            . Same records as Devices, tuned for search and audit rather than
            bulk edit.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-subscription-app"
          title="Subscription (in-app)"
          description="Current plan, trials, and links into checkout from inside the product."
          href="/pages/subscription"
          image={{
            slotId: "image-page-subscription-app",
            title: "In-app subscription screen",
            fileName: "16-page-subscription.png",
            hint: "Plan cards or renewal panel as customers see them here.",
          }}
        >
          <p>
            Where members see current plan, trial or renewal context, and entry
            points to checkout. Use it when someone asks what the organisation
            is on without opening ERPNext.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-subscription-dashboard"
          title="Subscription dashboard"
          description="Charts and KPIs for subscription and revenue health."
          href="/pages/subscription-dashboard"
          access="Admin only in the sidebar."
          image={{
            slotId: "image-page-subscription-dashboard",
            title: "Subscription dashboard charts",
            fileName: "19-page-subscription-dashboard.png",
            hint: "KPI row plus at least one chart from the analytics view.",
          }}
        >
          <p>
            Analytics for leadership and finance: KPI cards, line, bar, or pie
            charts, and tables from the subscription dashboard API — trends, not
            single-device edits.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-subscription-management"
          title="Subscription management"
          description="Catalogue of sellable plans and their limits."
          href="/pages/subscription-management"
          access="Admin only in the sidebar."
          image={{
            slotId: "image-page-subscription-management",
            title: "Plan catalogue admin",
            fileName: "20-page-subscription-management.png",
            hint: "Plans table or edit modal with device and data caps.",
          }}
        >
          <p>
            Create, edit, and retire subscription plans: device caps, included
            messages and data, billing interval, pricing, and other fields your
            product exposes. Changes flow through to Subscription and Checkout.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-activity-logs"
          title="Activity logs"
          description="Who did what, with filters for support and compliance."
          href="/pages/activity-logs"
          image={{
            slotId: "image-page-activity-logs",
            title: "Activity log grid",
            fileName: "22-page-activity-logs.png",
            hint: "Filtered audit table with dates and actions.",
          }}
        >
          <p>
            Audit history of product actions: date range, action type, and
            status filters; admins and superadmins can narrow by user. Use for
            who changed what and when.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-subscription-lifecycle-logs"
          title="Subscription lifecycle logs"
          description="Filtered billing log view for subscription events only."
          href="/pages/subscription-lifecycle-logs"
          access="Admin only in the sidebar."
          image={{
            slotId: "image-page-subscription-lifecycle",
            title: "Lifecycle events list",
            fileName: "23-page-subscription-lifecycle.png",
            hint: "Rows for created, renewed, plan changed, cancelled, expired.",
          }}
        >
          <p>
            Same payment and billing pipeline as the full log, filtered to
            lifecycle events with payload detail such as plan names and amounts
            when stored by the backend.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-payment-billing-logs"
          title="Payment & billing logs"
          description="Operational payment and invoice reconciliation."
          href="/pages/payment-billing-logs"
          access="Sensitive finance data — role-gated in practice."
          image={{
            slotId: "image-page-payment-billing",
            title: "Payment & billing log",
            fileName: "24-page-payment-billing-logs.png",
            hint: "Log table with filters; mask account details for external docs.",
          }}
        >
          <p>
            Filters, exports, and row detail for reconciling gateways and
            invoices. Ask before sharing screenshots outside the company.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-merchants"
          title="Merchant management"
          description="Merchants, gateway accounts, and related transaction tabs."
          href="/pages/merchants"
          access="Admin only in the sidebar."
          image={{
            slotId: "image-page-merchants",
            title: "Merchant or gateway account UI",
            fileName: "25-page-merchants.png",
            hint: "Merchant list or gateway account form — never real keys in shots.",
          }}
        >
          <p>
            Configure merchants and gateway accounts (environments, keys, active
            flags) and inspect payment transaction logs in tabs. First place to
            look when checkout says misconfigured.
          </p>
        </AppPageGuideCard>

        <AppPageGuideCard
          id="page-settings"
          title="Settings"
          description="Profile, avatar, password, and read-only connection hints."
          href="/pages/settings"
          image={{
            slotId: "image-page-settings",
            title: "Settings profile area",
            fileName: "26-page-settings.png",
            hint: "Profile fields and password section; blur personal data if needed.",
          }}
        >
          <p>
            Personal workspace: profile, avatar, password modal, and read-only
            hints for support. Usually available even when other areas wait on
            billing so people can fix their own password.
          </p>
        </AppPageGuideCard>

        <GuideSection
          id="troubleshooting"
          title="Quick troubleshooting"
          description="A sensible order to check things before you blame the browser."
        >
          <p>
            When something looks wrong, work in this order: check{" "}
            <strong className="text-foreground">Dashboard</strong> and{" "}
            <strong className="text-foreground">Subscription</strong> for
            entitlement or money, then{" "}
            <strong className="text-foreground">Activity logs</strong> if you
            suspect a human change, then ask an admin to peek at{" "}
            <strong className="text-foreground">
              Payment &amp; billing logs
            </strong>{" "}
            or <strong className="text-foreground">Merchants</strong> before you
            assume the browser is at fault.
          </p>
        </GuideSection>
      </div>
    </div>
  );
}
