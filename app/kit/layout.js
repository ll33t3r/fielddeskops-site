const pageTitle = 'FieldDeskOps Review Kit — One-Time Google Review Ask · $29'
const pageDescription =
  'One-time Review Kit for painters, HVAC, roofers, and contractors. After the job, send a Google review ask. Pay $29 today — no trial, no monthly.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/kit',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

export default function KitLayout({ children }) {
  return children
}
