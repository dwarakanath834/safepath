import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafePath | Route with more context",
  description: "A community-informed route planning project. Safety estimates are not guarantees.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}