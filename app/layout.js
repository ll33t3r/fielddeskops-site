import { Inter, Oswald } from 'next/font/google'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'FieldDeskOps | Digital Toolbelt',
  description: 'Professional apps for tradespeople',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-[#1a1a1a] text-[#A3A3A3]`}>
        <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040]">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-white font-oswald">FieldDeskOps | Digital Toolbelt</h1>
          </div>
        </header>
        
        <main>{children}</main>
        
        <footer className="bg-[#262626] border-t border-[#404040] py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">Powered by FieldDeskOps</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
