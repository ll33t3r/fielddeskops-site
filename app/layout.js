import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FieldDeskOps - Digital Toolbelt for Tradesmen",
  description: "Your all-in-one digital toolbelt for field service operations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('theme') || 'dark';
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
      </body>
    </html>
  );
}
