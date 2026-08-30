import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const KIT_CHECKOUT_URL = 'https://whop.com/checkout/plan_jAVrFtMQJes3t'
const REVIEWS_CHECKOUT_URL = 'https://whop.com/checkout/plan_a9Kkusw3Dp0mh'
const KIT_AFFILIATE_JOIN_URL = 'https://whop.com/truffr/review-kit'
const REVIEWS_AFFILIATE_JOIN_URL = 'https://whop.com/truffr/fielddeskops-reviews'

const pageTitle = 'FieldDeskOps affiliate program — 30% on Review Kit and Reviews'
const pageDescription =
  'Share the Review Kit ($29 one-time) or Reviews ($9.99/mo) links. Earn 30% when someone pays. Join on Whop, get a tracking link with ?a=.'

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://fielddeskops.com/affiliates' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: 'https://fielddeskops.com/affiliates',
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
}

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto hide-scrollbar bg-[var(--bg-main)] text-[var(--text-main)] font-inter">
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[#FF6700] font-oswald font-bold text-xl uppercase tracking-wide shrink-0"
          >
            FIELDDESKOPS
          </Link>
          <a
            href={KIT_AFFILIATE_JOIN_URL}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-[#FF6700] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,103,0,0.35)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition-all text-sm md:text-base whitespace-nowrap"
          >
            Become an affiliate
          </a>
        </div>
      </nav>

      <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6700]/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,103,0,0.12),_transparent_55%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative animate-[fadeUp_0.7s_ease-out]">
          <p className="text-[#FF6700] font-oswald font-bold text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide mb-4">
            FieldDeskOps Affiliates
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-oswald font-black uppercase tracking-tight mb-5 leading-tight">
            Share the link.{' '}
            <span className="text-[#FF6700] drop-shadow-[0_0_30px_rgba(255,103,0,0.4)]">
              Earn 30%.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-sub)] mb-8 max-w-2xl mx-auto">
            Point painters, HVAC, and roofers at the Review Kit or Reviews. When they pay, you get
            30%.
          </p>
          <p className="text-sm text-[var(--text-sub)] flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> 30% commission
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> Kit ~$8.70 per sale
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> Reviews monthly cut
            </span>
          </p>
        </div>
      </section>

      <section className="py-16 px-6 border-y border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-oswald font-bold mb-6 uppercase text-center">
            What you promote
          </h2>
          <div className="space-y-8 text-[var(--text-sub)]">
            <div>
              <h3 className="font-oswald font-bold uppercase text-[var(--text-main)] mb-2">
                Review Kit — $29 one-time
              </h3>
              <p className="text-sm mb-3">
                Pay today. No monthly. ~$8.70 to you at 30% when someone buys.
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  Landing:{' '}
                  <Link href="/kit" className="text-[#FF6700] hover:underline">
                    fielddeskops.com/kit
                  </Link>
                </li>
                <li>
                  Checkout:{' '}
                  <a
                    href={KIT_CHECKOUT_URL}
                    className="text-[#FF6700] hover:underline break-all"
                  >
                    {KIT_CHECKOUT_URL}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-oswald font-bold uppercase text-[var(--text-main)] mb-2">
                Reviews — $9.99/mo after trial
              </h3>
              <p className="text-sm mb-3">
                7-day trial, then $9.99/mo. 30% when they pay.
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  Landing:{' '}
                  <Link href="/reviews" className="text-[#FF6700] hover:underline">
                    fielddeskops.com/reviews
                  </Link>
                </li>
                <li>
                  Checkout:{' '}
                  <a
                    href={REVIEWS_CHECKOUT_URL}
                    className="text-[#FF6700] hover:underline break-all"
                  >
                    {REVIEWS_CHECKOUT_URL}
                  </a>
                </li>
              </ul>
            </div>
            <p className="text-sm">
              Photos and contracts are a separate product—this program is Kit and Reviews only.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold text-center mb-4 uppercase">
            How to join
          </h2>
          <p className="text-center text-[var(--text-sub)] mb-12 max-w-lg mx-auto">
            Hit Become an affiliate on the Whop product. Then you get a tracking link with ?a=.
          </p>
          <ol className="space-y-8 max-w-xl mx-auto">
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-[#FF6700] text-black font-black text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="font-oswald font-bold uppercase mb-1">Review Kit product</p>
                <a
                  href={KIT_AFFILIATE_JOIN_URL}
                  className="text-[#FF6700] hover:underline text-sm break-all"
                >
                  {KIT_AFFILIATE_JOIN_URL}
                </a>
                <p className="text-sm text-[var(--text-sub)] mt-1">
                  Become an affiliate lives here.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-[#FF6700] text-black font-black text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="font-oswald font-bold uppercase mb-1">Reviews product</p>
                <a
                  href={REVIEWS_AFFILIATE_JOIN_URL}
                  className="text-[#FF6700] hover:underline text-sm break-all"
                >
                  {REVIEWS_AFFILIATE_JOIN_URL}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-[#FF6700] text-black font-black text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="font-oswald font-bold uppercase mb-1">Share your ?a= link</p>
                <p className="text-sm text-[var(--text-sub)]">
                  Wrap the kit or reviews checkout / landing URLs above with the tracking link Whop
                  gives you.
                </p>
              </div>
            </li>
          </ol>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={KIT_AFFILIATE_JOIN_URL}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] hover:scale-[1.02] transition-all"
            >
              Join via Review Kit <ArrowRight size={20} />
            </a>
            <a
              href={REVIEWS_AFFILIATE_JOIN_URL}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#FF6700]/50 text-[#FF6700] font-bold rounded-xl hover:bg-[#FF6700]/10 transition-all"
            >
              Join via Reviews <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-color)] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link
              href="/"
              className="text-[#FF6700] font-oswald font-bold text-lg uppercase tracking-wide"
            >
              FIELDDESKOPS
            </Link>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/kit"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Review Kit
              </Link>
              <Link
                href="/reviews"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Reviews
              </Link>
              <Link
                href="/legal/terms?from=%2Faffiliates"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Terms
              </Link>
              <Link
                href="/legal/privacy?from=%2Faffiliates"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-[var(--text-sub)] text-sm">
            © {new Date().getFullYear()} FieldDeskOps.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
