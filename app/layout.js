import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({ 
  subsets: ["latin"],
  variable: "--font-oswald", 
  display: "swap",
});

export const metadata = {
  title: "FieldDeskOps",
  description: "The Digital Toolbelt",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} bg-[#1a1a1a] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}