import type { Metadata } from "next";
import "./globals.css";
import { ProvidersWrapper } from "@/components/providers-wrapper";

export const metadata: Metadata = {
  title: "Resolv — Draw your futures",
  description: "A trading game where predictions are expressed as drawings, not orders. Draw your price prediction and trade your market intuition.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ProvidersWrapper>
          {children}
        </ProvidersWrapper>
      </body>
    </html>
  );
}
