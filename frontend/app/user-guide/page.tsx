"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserGuideContent } from "@/components/user-guide/UserGuideContent";

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Button variant="ghost" size="sm" className="gap-2 px-2" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Back to home
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>
      <main className="px-4 py-10 sm:px-6">
        <UserGuideContent variant="standalone" />
      </main>
    </div>
  );
}
