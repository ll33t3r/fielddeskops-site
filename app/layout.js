import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteTitle = "FieldDeskOps - Digital Toolbelt for Tradesmen";
const siteDescription =
  "Your all-in-one digital toolbelt for field service operations.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | FieldDeskOps",
  },
  description: siteDescription,
  applicationName: "FieldDeskOps",
  keywords: [
    "field service",
    "contractor tools",
    "job management",
    "estimates",
    "field operations",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "FieldDeskOps",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var savedTheme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', savedTheme);
                document.documentElement.classList.remove('dark', 'light');
                document.documentElement.classList.add(savedTheme);
              })()
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200`}>
        <main>{children}</main>
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-4">
          <p className="text-[9px] font-bold uppercase tracking-widest">
            <span className="text-[var(--text-sub)] opacity-50">Powered by </span>
            <span className="text-[#FF6700]">FieldDeskOps</span>
          </p>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
