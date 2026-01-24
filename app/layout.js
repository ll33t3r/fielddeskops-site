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
      {/* Dynamic Background Class */}
      <body className={`${inter.className} bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200`}>
        
        {/* Nav - Always Dark for Contrast */}
        <nav className="bg-[#121212] border-b border-gray-800 p-4 text-white">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF6700] rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">F</span>
              </div>
              <span className="font-bold text-xl">FieldDeskOps</span>
            </div>
            <div className="space-x-4">
              <a href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</a>
              <a href="/auth/login" className="px-4 py-2 bg-[#FF6700] hover:bg-orange-600 rounded-lg text-white">Login</a>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
        
        {/* Footer - Always Dark */}
        <footer className="bg-[#121212] border-t border-gray-800 mt-auto p-8 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-[#FF6700] rounded flex items-center justify-center">
                <span className="font-bold text-white text-sm">F</span>
              </div>
              <span className="font-bold text-white">FieldDeskOps</span>
            </div>
            <p className="text-gray-400 text-sm">© 2024 FieldDeskOps. Built for tradesmen.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
