import Link from 'next/link'
import KitLandingShell, { buildFaqJsonLd } from './KitLandingShell'

const pageTitle = 'FieldDeskOps Review Kit — One-Time Google Review Ask · $29'
const pageDescription =
  'One-time Review Kit for painters, HVAC, roofers, and contractors. After the job, send a Google review ask. Pay $29 today — no trial, no monthly.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://fielddeskops.com/kit' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://fielddeskops.com/kit',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

const faq = [
  {
    q: 'What is the Review Kit?',
    a: 'A one-time $29 kit so you can send a Google review ask after every job. No monthly bill.',
  },
  {
    q: 'Who is it for?',
    a: 'Painters, HVAC techs, roofers—any crew that wraps a job and wants the stars they earned.',
  },
  {
    q: 'Prefer monthly instead?',
    a: 'FieldDeskOps Reviews is the subscription option with a 7-day trial. The kit is pay-once.',
  },
]

export default function KitPage() {
  return (
    <KitLandingShell
      h1Before="Job done."
      h1Accent="Ask for the review."
      heroSub="One-time kit for painters, HVAC, and roofers. Send a Google review ask before you leave the driveway."
      painTitle="You earned the stars. Ask for them."
      painLines={[
        'Customer loved the work—then forgot to review.',
        'You wrap the job and never send the ask.',
        'Empty Google page. Full schedule for someone else.',
      ]}
      painCloser="The Review Kit makes the ask part of the job wrap."
      bodyParagraph="Painters after the punch list. HVAC after the unit’s running. Roofers when the tarp comes off. Same kit—ask before you leave."
      faq={faq}
      faqJsonLd={buildFaqJsonLd(faq)}
      monthlyLink={
        <>
          Want a monthly plan instead? See{' '}
          <Link href="/reviews" className="text-[#FF6700] hover:underline">
            FieldDeskOps Reviews
          </Link>
          .
        </>
      }
      tradeLinks={
        <>
          Built for your trade:{' '}
          <Link href="/kit/painters" className="text-[#FF6700] hover:underline">
            painters
          </Link>
          ,{' '}
          <Link href="/kit/hvac" className="text-[#FF6700] hover:underline">
            HVAC
          </Link>
          ,{' '}
          <Link href="/kit/roofers" className="text-[#FF6700] hover:underline">
            roofers
          </Link>
          .
        </>
      }
      fromPath="/kit"
    />
  )
}
