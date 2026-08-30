import KitLandingShell, { buildFaqJsonLd } from '../KitLandingShell'

const pageTitle = 'Google Review Ask for HVAC — FieldDeskOps Review Kit · $29'
const pageDescription =
  'HVAC techs: after the install, changeout, or service call—when the unit’s running—send a Google review ask. One-time Review Kit · $29.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://fielddeskops.com/kit/hvac' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://fielddeskops.com/kit/hvac',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

const faq = [
  {
    q: 'When do HVAC techs ask for the review?',
    a: 'When the unit’s running and the customer’s comfortable—end of install, changeout, or service call.',
  },
  {
    q: 'Installs and service calls both?',
    a: 'Yes. Same kit after a new system, a swap, or a no-cool call that you fixed.',
  },
  {
    q: 'One-time or subscription?',
    a: 'Review Kit is $29 one-time. No monthly. Pay today and keep asking.',
  },
]

export default function HvacKitPage() {
  return (
    <KitLandingShell
      brandLine="Review Kit for HVAC"
      h1Before="Unit running."
      h1Accent="Ask for the stars."
      heroSub="Install done. Changeout complete. Service call wrapped. Send the Google review ask while the air’s cold (or warm)."
      painTitle="Fixed the call. Missed the ask."
      painLines={[
        'Customer’s happy the unit’s back—then never reviews.',
        'You write up the invoice and skip the ask.',
        'Competitors with more Google stars keep winning the next install.',
      ]}
      painCloser="Make the review ask part of every HVAC wrap."
      bodyParagraph="System’s up. Thermostat set. Hand them the warranty card—and the review link—before you roll out."
      steps={[
        { title: 'Set your link', desc: 'Add your Google review URL. One time.' },
        { title: 'Finish the call', desc: 'Unit running. Customer signed off.' },
        { title: 'Send the ask', desc: 'Share the review link before you leave the driveway.' },
      ]}
      stepsIntro="Buy once. Use after every install, changeout, and service call."
      offerFeatures={[
        'Google review ask after HVAC jobs',
        'Built for techs in the field',
        'One payment. No recurring bill',
      ]}
      finalH2="Close the call with the ask."
      finalSub="$29. One kit. Every HVAC job after that."
      faq={faq}
      faqJsonLd={buildFaqJsonLd(faq)}
      backToKit
      fromPath="/kit/hvac"
    />
  )
}
