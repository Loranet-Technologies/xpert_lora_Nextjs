"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import subscriptionPlansMock from "@/data/subscription-plans.mock.json";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface MockPlan {
  id: number | string;
  plan_name: string;
  price: number | string;
  priceLabel: string;
  interval: string;
  popular: boolean;
  allowDeferredBilling?: boolean;
  billingIntervalCost?: number;
  trialDays?: number;
  features: PlanFeature[];
}

const PLANS = subscriptionPlansMock.plans as MockPlan[];

/** Material Symbols icon - use real Google icon names */
function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: "inherit" }}
      aria-hidden
    >
      {name}
    </span>
  );
}

export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubscribe = () => {
    sessionStorage.setItem("post_login_redirect", "/pages/subscription");
    window.location.href = "/login";
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-6 lg:px-16 py-4">
        <div className="flex items-center justify-between mx-auto max-w-[1200px]">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-1.5 flex items-center justify-center">
              <MaterialIcon
                name="hub"
                className="h-5 w-5 text-primary-foreground"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Xpert LoRa</span>
          </Link>
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => scrollTo("features")}
            >
              Features
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => scrollTo("pricing")}
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => scrollTo("about")}
            >
              About
            </Button>
          </nav>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            {isMounted && (
              <>
                <div
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
                  onClick={toggleTheme}
                  title={
                    isMounted && isDarkMode
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  suppressHydrationWarning
                >
                  {isMounted ? (
                    isDarkMode ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </div>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[72px]">
        {/* Hero Section */}
        <section className="px-6 lg:px-16 py-20 lg:py-32 flex flex-col items-center">
          <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-8 text-left">
              <Badge
                variant="secondary"
                className="inline-flex w-fit gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border-primary/20"
              >
                <MaterialIcon name="verified" className="text-sm" />
                v2.0 Now Live
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                Professional <span className="text-primary">LoRaWAN</span>{" "}
                Management
              </h1>
              <p className="text-lg text-muted-foreground max-w-[500px] leading-relaxed">
                Simplify device, gateway, and tenant management with Xpert LoRa.
                The most robust enterprise-ready network stack for scaling IoT
                infrastructure.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-xl text-base font-bold gap-2"
                  asChild
                >
                  <Link href="/register">
                    Register Now
                    <MaterialIcon name="arrow_forward" className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 rounded-xl text-base font-bold border-2"
                  asChild
                >
                  <Link href="/login">Login</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 opacity-60">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Trusted By
                </span>
                <div className="flex gap-4 text-3xl text-muted-foreground">
                  <MaterialIcon name="sensors" />
                  <MaterialIcon name="router" />
                  <MaterialIcon name="memory" />
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <div
                className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border bg-muted"
                style={{
                  backgroundImage: `url('/lorawan.jpg')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 lg:px-16 py-24 bg-muted/50">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tight">
                Advanced Features for Scalable Networks
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your global IoT infrastructure
                from a single pane of glass.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform text-3xl">
                    <MaterialIcon name="developer_board" />
                  </div>
                  <CardTitle className="text-xl">Device Management</CardTitle>
                  <CardDescription>
                    Easily provision, organize, and manage thousands of LoRaWAN
                    nodes with bulk import and automated OTAA.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="group border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform text-3xl">
                    <MaterialIcon name="settings_input_antenna" />
                  </div>
                  <CardTitle className="text-xl">Gateway Monitoring</CardTitle>
                  <CardDescription>
                    Real-time health tracking, packet RSSI/SNR metrics, and
                    uptime logs for your entire gateway fleet.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="group border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform text-3xl">
                    <MaterialIcon name="groups_3" />
                  </div>
                  <CardTitle className="text-xl">
                    Multi-tenant Support
                  </CardTitle>
                  <CardDescription>
                    Securely isolate data and manage RBAC for different clients,
                    departments, or project teams.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="group border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform text-3xl">
                    <MaterialIcon name="query_stats" />
                  </div>
                  <CardTitle className="text-xl">Dashboards</CardTitle>
                  <CardDescription>
                    Customizable visual interfaces for deep insights into
                    network traffic and payload data visualization.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 lg:px-16 py-24 bg-background">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-12 text-center">
              <Badge
                variant="outline"
                className="mb-6 inline-flex gap-2 px-4 py-1.5 rounded-full bg-primary/10 border-primary/20"
              >
                <MaterialIcon name="info" className="h-4 w-4 text-primary" />
                <span className="text-primary font-semibold uppercase tracking-wider text-xs">
                  Please register or login to manage your subscriptions
                </span>
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-black mb-4 tracking-tight">
                Network Management Plans
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Scale your LoRaWAN deployment with ease. Choose a plan that
                matches your device density and monitoring needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? "border-2 border-primary shadow-xl md:scale-105 z-10 bg-primary/5 dark:bg-primary/10"
                      : "border-2 hover:border-primary/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span
                        className={
                          typeof plan.price === "string"
                            ? "text-2xl font-bold"
                            : "text-4xl font-black"
                        }
                      >
                        {plan.priceLabel}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">
                        {plan.interval}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Button
                      className="w-full mb-6"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      onClick={handleSubscribe}
                    >
                      Subscribe Now
                    </Button>
                    <ul className="space-y-4">
                      {plan.features.map((f, i) =>
                        f.included ? (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="text-primary shrink-0">
                              <MaterialIcon
                                name="check_circle"
                                className="h-5 w-5"
                              />
                            </span>
                            {f.text}
                          </li>
                        ) : (
                          <li
                            key={i}
                            className="flex gap-3 text-sm text-muted-foreground line-through"
                          >
                            <MaterialIcon
                              name="block"
                              className="h-5 w-5 shrink-0"
                            />
                            {f.text}
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Choose Your Plan Guide */}
            <div className="mt-16 rounded-2xl border-2 bg-muted/30 p-8">
              <h2 className="text-xl font-bold mb-6 text-center">
                Not sure which plan to pick?
              </h2>
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div className="space-y-2">
                  <p className="font-medium">Just getting started?</p>
                  <p className="text-sm text-muted-foreground">
                    Start with Personal Basic — perfect for trying LoRaWAN with
                    a few devices.
                  </p>
                </div>
                <div className="space-y-2 border-y sm:border-y-0 sm:border-x border-border py-4 sm:py-0">
                  <p className="font-medium">Growing your deployment?</p>
                  <p className="text-sm text-muted-foreground">
                    Starter SME is ideal — more devices, payment integration,
                    and support.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Need custom solutions?</p>
                  <p className="text-sm text-muted-foreground">
                    Business or Enterprise — tailored devices, SLA, and
                    dedicated support.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                All plans include gateway monitoring. You can change or upgrade
                anytime.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="about" className="px-6 lg:px-16 py-24">
          <div className="max-w-[1200px] mx-auto">
            <Card className="overflow-hidden rounded-3xl bg-primary border-0">
              <CardContent className="relative px-8 py-20 lg:py-24 text-center space-y-8 max-w-2xl mx-auto">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.8),transparent)]" />
                <div className="absolute -right-20 -bottom-20 size-80 rounded-full bg-white/10 blur-3xl" />
                <div className="relative space-y-6">
                  <h2 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight text-primary-foreground">
                    Ready to Connect Your World?
                  </h2>
                  <p className="text-primary-foreground/80 text-lg">
                    Join hundreds of companies scaling their IoT solutions with
                    the most powerful LoRaWAN stack available today.
                  </p>
                  <div className="pt-4">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-16 px-10 rounded-2xl text-xl font-bold bg-background text-primary hover:bg-background/90"
                      asChild
                    >
                      <Link href="/register">
                        Register Now — It&apos;s Free
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-12 border-t">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <MaterialIcon name="hub" className="h-5 w-5 text-primary" />
              <span className="font-bold text-xl tracking-tight">
                Xpert LoRa
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The global standard for professional LoRaWAN network management.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
              Product
            </h4>
            <nav className="flex flex-col gap-2">
              <Button
                variant="link"
                className="justify-start h-auto p-0 text-muted-foreground hover:text-primary"
                onClick={() => scrollTo("features")}
              >
                Features
              </Button>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                API Docs
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Release Notes
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
              Company
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                About Us
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Careers
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
              Social
            </h4>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                asChild
              >
                <a href="#" aria-label="Share">
                  <MaterialIcon name="share" className="h-5 w-5" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                asChild
              >
                <a href="#" aria-label="Website">
                  <MaterialIcon name="public" className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Xpert LoRa Management Systems. All rights
          reserved. Built with precision for the IoT era.
        </div>
      </footer>
    </div>
  );
}
