import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Components
import { NavBar } from "@/components/nav/nav-bar";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tandem AI Email Assistant Demo",
  description: "AI-powered email drafting for office leasing agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <NavBar />
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
