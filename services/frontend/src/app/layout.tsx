import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getCatalog } from "@/lib/api";
import { brand } from "@/lib/brand";
import CartDrawer from "@/components/cart/CartDrawer";
import CartProvider from "@/components/cart/CartProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const text = Inter({ subsets: ["latin"], variable: "--font-text", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: `${brand.name}: ${brand.tagline}`, template: `%s · ${brand.name}` },
  description: brand.description,
  openGraph: { type: "website", siteName: brand.name, title: brand.name, description: brand.description },
};
export const viewport: Viewport = { themeColor: "#FAF8F5", width: "device-width", initialScale: 1 };

// Re-generate at most every 30s so a build made while the API was down recovers on its own.
export const revalidate = 30;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { source } = await getCatalog(); // memoised per request, shared with the pages
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only z-50 rounded-control bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <CartProvider>
          <SiteHeader isDemo={source === "demo"} />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
