import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemedToaster } from "@/components/ui/themed-toaster";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "CloudPulse — Cloud Cost Optimization", template: "%s · CloudPulse" },
  description: "Monitor AWS spend, detect idle resources and get actionable cost-optimization alerts. Built for Cloud & DevOps teams.",
  keywords: ["AWS cost", "FinOps", "cloud cost optimization", "DevOps", "EC2", "NAT Gateway"],
  openGraph: { title: "CloudPulse", description: "Cloud Infrastructure & Cost Optimization Dashboard", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#07080c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
