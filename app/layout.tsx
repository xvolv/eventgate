import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import { HideOnAdmin } from "@/components/hide-on-admin";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AAU EventGate | Addis Ababa University Event Management",
  description:
    "The official event proposal and management system for Addis Ababa University clubs and student organizations. Submit proposals, track approvals, and manage campus events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <HideOnAdmin>
          <Nav />
        </HideOnAdmin>
        {children}
      </body>
    </html>
  );
}
