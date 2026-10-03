import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { ResearchProvider } from "@/components/research-provider";
import "./globals.css";
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "CulturePilot — Cultural intelligence, actionable strategy",
    template: "%s | CulturePilot",
  },
  description:
    "Turn a business idea into an evidence-backed cultural strategy. Autonomous Qloo research, an interactive culture graph, and a reason behind every recommendation.",
  applicationName: "CulturePilot",
  openGraph: {
    title: "CulturePilot",
    description: "Understand what your audience actually cares about.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <ResearchProvider>{children}</ResearchProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
