import "./globals.css";

import React from "react";
import type { Metadata } from "next";

import { Noto_Sans_TC } from "next/dist/compiled/@next/font/dist/google";

import { clsx } from "clsx";

const NotoSansTC = Noto_Sans_TC({
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDFs Signature Generator",
  description: "Generate PDFs Signatures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={clsx(
          NotoSansTC.className,
          NotoSansTC.variable,
          "antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
