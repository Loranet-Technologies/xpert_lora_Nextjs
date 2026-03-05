"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Material Symbols icon */
function MaterialIcon({
  name,
  className = "",
  title,
}: {
  name: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: "inherit" }}
      aria-hidden
      title={title}
    >
      {name}
    </span>
  );
}

// LoRaWAN IoT circuit / CPU image
const LORAWAN_IMAGE = "/lorawan.jpg";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value && value.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/erpnext/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      toast.success("Account created successfully. Please log in.");
      router.push("/login");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4 lg:px-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-1.5 flex items-center justify-center">
            <MaterialIcon
              name="hub"
              className="h-5 w-5 text-primary-foreground"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">Xpert LoRa</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Already have an account?
          </span>
          <Button variant="outline" size="default" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="absolute top-4 left-30 z-10">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to plans
          </Link>
        </div>
        <div className="z-10 grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-2xl border shadow-2xl lg:grid-cols-2 bg-card">
          {/* Form Section */}
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-black">Join the Network</h1>
              <p className="text-muted-foreground">
                Enterprise-grade LoRaWAN management starts here.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-destructive">
                    {passwordError}
                  </p>
                )}
                {!passwordError && password && password.length >= 8 && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Password is valid
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  placeholder="Re-enter password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isSubmitting}
                  className={cn(
                    "mt-1 size-4 rounded border-input accent-primary",
                    "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  )}
                />
                <Label
                  htmlFor="terms"
                  className="cursor-pointer text-xs font-normal text-muted-foreground"
                >
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !!passwordError ||
                  (confirmPassword !== "" && password !== confirmPassword)
                }
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Trust Indicators
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-6 flex justify-around grayscale opacity-50">
              <MaterialIcon
                name="verified_user"
                className="text-4xl"
                title="ISO Certified"
              />
              <MaterialIcon
                name="cloud_done"
                className="text-4xl"
                title="Cloud Secure"
              />
              <MaterialIcon
                name="speed"
                className="text-4xl"
                title="High Availability"
              />
            </div>
          </div>

          {/* Image Section - LoRaWAN IoT CPU */}
          <div className="relative hidden flex-col overflow-hidden bg-muted lg:flex">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative z-10 flex h-full flex-col p-12">
              <div className="mb-8">
                <h3 className="mb-4 text-2xl font-bold">
                  Scalable IoT Infrastructure
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Join 2,000+ organizations managing mission-critical LoRaWAN
                  assets with 99.99% uptime.
                </p>
              </div>
              <div className="relative flex flex-1 items-center justify-center">
                <Card className="overflow-hidden border border-primary/30 bg-primary/10 shadow-2xl backdrop-blur-sm">
                  <div className="relative aspect-video w-full min-w-[320px] ">
                    <Image
                      src={LORAWAN_IMAGE}
                      alt="LoRaWAN IoT network - circuit board with sensors and connectivity"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  </div>
                </Card>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-primary">5M+</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Connected Nodes
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black text-primary">120+</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Global Regions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Xpert LoRa Network Management. All rights
        reserved.
        <div className="mt-2 flex justify-center gap-4">
          <Link href="#" className="hover:text-primary transition-colors">
            Support
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Documentation
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            API Reference
          </Link>
        </div>
      </footer>
    </div>
  );
}
