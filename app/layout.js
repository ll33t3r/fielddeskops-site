import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FieldDeskOps - Digital Toolbelt for Tradesmen',
  description: 'Your all-in-one digital toolbelt for field service operations.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200`}>
        {/* APP SHELL: No global nav/footer. The pages (Login, Dashboard) control the full screen. */}
        <main>{children}</main>
      </body>
    </html>
  )
}
