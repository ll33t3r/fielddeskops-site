'use client'

import { usePathname } from 'next/navigation'

export default function PoweredByFooter() {
  const pathname = usePathname() || ''
  const hideOnAuthForms =
    pathname.startsWith('/auth/') || pathname === '/forgot-password' || pathname === '/reset-password'

  if (hideOnAuthForms) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center px-4">
      <p className="text-[9px] font-bold uppercase tracking-widest">
        <span className="text-[var(--text-sub)] opacity-50">Powered by </span>
        <span className="text-[#FF6700]">FieldDeskOps</span>
      </p>
    </div>
  )
}
