import "./globals.css";
import Providers from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "TokenSpace — Solana Token Terminal", description: "Discover and trade interesting Solana tokens." };

export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }