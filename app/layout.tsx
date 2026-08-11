import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NhostProvider } from "@/providers/NhostProvider";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { OrgProvider } from "@/components/auth/OrgContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Agent Workflow Builder — Nhost & Hasura",
  description: "A mini n8n purpose-built for chaining AI agent steps with two-layer permissions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100">
        <NhostProvider>
          <ApolloProvider>
            <OrgProvider>{children}</OrgProvider>
          </ApolloProvider>
        </NhostProvider>
      </body>
    </html>
  );
}
