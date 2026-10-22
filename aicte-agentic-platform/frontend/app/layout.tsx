import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DrishtiAssistant } from "@/components/drishti/drishti-assistant";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drishti AI | Agentic Regulatory Decision Intelligence",
  description:
    "Next-generation agentic decision-support and regulatory scrutiny platform for institutional approvals, forensic verification, and compliance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08090d] text-[#f8fafc] font-sans selection:bg-red-500/30 selection:text-white">
        <AuthProvider>
          {children}
          <DrishtiAssistant />
          <Toaster theme="dark" richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
