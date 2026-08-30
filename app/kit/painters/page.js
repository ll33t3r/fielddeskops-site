import KitLandingShell, { buildFaqJsonLd } from '../KitLandingShell'

const pageTitle = 'Google Review Ask for Painters — FieldDeskOps Review Kit · $29'
const pageDescription =
  'Painting contractors: after the interior or exterior wrap and punch list, send a Google review ask before you leave the jobsite. One-time Review Kit · $29.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://fielddeskops.com/kit/painters' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://fielddeskops.com/kit/painters',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

const faq = [
  {
    q: 'When should painters ask for the review?',
    a: 'After final walkthrough—walls dry, punch list closed, before the truck leaves the driveway.',
  },
  {
    q: 'Does this work for interior and exterior jobs?',
    a: 'Yes. Same kit after a single room, a full house paint, or a commercial wrap.',
  },
  {
    q: 'Is there a monthly fee?',
    a: 'No. Review Kit is $29 one-time. Pay today, use on every job after that.',
  },
]

export default function PaintersKitPage() {
  return (
    <KitLandingShell
      brandLine="Review Kit for Painters"
      h1Before="Wrap the job."
      h1Accent="Ask for the review."
      heroSub="Interior or exterior just wrapped. Punch list done. Send the Google review ask before you leave the jobsite."
      painTitle="Great paint. Quiet Google page."
      painLines={[
        'Homeowner loves the finish—then never hits review.',
        'You load the ladders and forget the ask.',
        'Next bid goes to the crew with more stars.',
      ]}
      painCloser="Make the review ask part of every paint wrap."
      bodyParagraph="Last coat’s on. Tape pulled. Walk the room once, send the link, then leave. That’s the kit."
      steps={[
        { title: 'Set your link', desc: 'Add your Google review URL. One time.' },
        { title: 'Finish the punch list', desc: 'Touch-ups done. Customer walked the job.' },
        { title: 'Send the ask', desc: 'Share the review link while the paint’s still fresh in their mind.' },
      ]}
      stepsIntro="Buy once. Use after every paint job—interior, exterior, commercial."
      offerFeatures={[
        'Google review ask after paint jobs',
        'Built for painting contractors',
        'One payment. No recurring bill',
      ]}
      finalH2="Leave the driveway with the ask sent."
      finalSub="$29. One kit. Every paint job after that."
      faq={faq}
      faqJsonLd={buildFaqJsonLd(faq)}
      backToKit
      fromPath="/kit/painters"
    />
  )
}
