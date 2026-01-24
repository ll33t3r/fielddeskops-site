import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// We use '..' to go up one level, then into components
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FieldDeskOps',
  description: 'The Contractor Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className + ' bg-gray-50 pb-20 md:pb-0'}>
        <div className='min-h-screen flex flex-col max-w-2xl mx-auto'>
          <main className='flex-1'>
            {children}
          </main>
          <Navbar />
        </div>
      </body>
    </html>
  );
}
