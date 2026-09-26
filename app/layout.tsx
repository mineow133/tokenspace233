import "./globals.css";
import Providers from "./providers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "TokenSpace — Solana Market Terminal",
  description: "Discover interesting Solana tokens, research them quickly, and trade through Jupiter.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07080d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
