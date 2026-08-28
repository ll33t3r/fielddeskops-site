const pageTitle = 'FieldDeskOps Reviews — Get More Google Reviews After Every Job'
const pageDescription =
  'Send a Google review link when the job wraps. Built for painters, HVAC, roofers, and contractors who want more 5-star reviews. 7-day trial · $9.99/mo · $0 due today.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/reviews',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

export default function ReviewsLayout({ children }) {
  return children
}
