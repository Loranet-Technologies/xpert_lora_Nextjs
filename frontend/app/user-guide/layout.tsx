import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User guide",
  description:
    "Step-by-step Xpert LoRa walkthrough with labelled screenshot slots for documentation.",
};

export default function UserGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
