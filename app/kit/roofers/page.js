import KitLandingShell, { buildFaqJsonLd } from '../KitLandingShell'

const pageTitle = 'Google Review Ask for Roofers — FieldDeskOps Review Kit · $29'
const pageDescription =
  'Roofers: after the shingles are tight and the tarp comes off, send a Google review ask before you leave. One-time Review Kit · $29.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://fielddeskops.com/kit/roofers' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://fielddeskops.com/kit/roofers',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

const faq = [
  {
    q: 'When should roofers ask for the review?',
    a: 'After final walkthrough—shingles tight, clean-up done, tarp off—before the crew leaves.',
  },
  {
    q: 'Emergency tarp jobs too?',
    a: 'Yes. Leak stopped or full re-roof—send the ask when the work’s done and the customer’s relieved.',
  },
  {
    q: 'Is the kit a subscription?',
    a: 'No. $29 one-time. Pay today. Use on every roof after that.',
  },
]

export default function RoofersKitPage() {
  return (
    <KitLandingShell
      brandLine="Review Kit for Roofers"
      h1Before="Tarp off."
      h1Accent="Ask for the review."
      heroSub="Shingles tight. Leak stopped. Clean-up done. Send the Google review ask before the truck leaves."
      painTitle="Solid roof. Quiet listing."
      painLines={[
        'Homeowner’s dry again—then never leaves a review.',
        'Crew packs up and the ask never goes out.',
        'Next storm bid goes to the company with more Google stars.',
      ]}
      painCloser="Make the review ask part of every roof wrap."
      bodyParagraph="Magnet sweep done. Gutters clear. Walk the ridge once, send the link, then roll. That’s the kit."
      steps={[
        { title: 'Set your link', desc: 'Add your Google review URL. One time.' },
        { title: 'Finish the roof', desc: 'Shingles tight. Tarp off. Site clean.' },
        { title: 'Send the ask', desc: 'Share the review link while they’re still grateful.' },
      ]}
      stepsIntro="Buy once. Use after every re-roof, repair, and storm job."
      offerFeatures={[
        'Google review ask after roof jobs',
        'Built for roofing crews',
        'One payment. No recurring bill',
      ]}
      finalH2="Leave the job with the ask sent."
      finalSub="$29. One kit. Every roof after that."
      faq={faq}
      faqJsonLd={buildFaqJsonLd(faq)}
      backToKit
      fromPath="/kit/roofers"
    />
  )
}
