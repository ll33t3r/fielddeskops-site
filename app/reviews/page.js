import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  MessageSquareQuote,
  Star,
  Smartphone,
} from 'lucide-react'

/** FieldDeskOps Reviews Whop plan — do not reuse SiteSnap+SignOff checkout. */
const REVIEWS_CHECKOUT_URL = 'https://whop.com/checkout/plan_a9Kkusw3Dp0mh'
const CTA_LABEL = 'Start 7-day trial · $9.99/mo'

export default function ReviewsPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto hide-scrollbar bg-[var(--bg-main)] text-[var(--text-main)] font-inter">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[#FF6700] font-oswald font-bold text-xl uppercase tracking-wide shrink-0"
          >
            FIELDDESKOPS
          </Link>
          <a
            href={REVIEWS_CHECKOUT_URL}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-[#FF6700] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,103,0,0.35)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition-all text-sm md:text-base whitespace-nowrap"
          >
            {CTA_LABEL}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6700]/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,103,0,0.12),_transparent_55%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative animate-[fadeUp_0.7s_ease-out]">
          <p className="text-[#FF6700] font-oswald font-bold text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide mb-4">
            FieldDeskOps Reviews
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-oswald font-black uppercase tracking-tight mb-5 leading-tight">
            More Google reviews.{' '}
            <span className="text-[#FF6700] drop-shadow-[0_0_30px_rgba(255,103,0,0.4)]">
              After every job.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-sub)] mb-8 max-w-2xl mx-auto">
            When the work is done, send your Google review link. Painters, HVAC, roofers—get the
            5-stars you earned.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <a
              href={REVIEWS_CHECKOUT_URL}
              className="w-full sm:w-auto px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-lg"
            >
              {CTA_LABEL} <ArrowRight size={20} />
            </a>
          </div>
          <p className="text-sm text-[var(--text-sub)] flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> 7-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> $0 due today
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> Then $9.99/mo
            </span>
          </p>
        </div>
      </section>

      {/* PAIN */}
      <section className="py-16 px-6 border-y border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto text-center animate-[fadeUp_0.8s_ease-out]">
          <h2 className="text-2xl md:text-3xl font-oswald font-bold mb-6 uppercase">
            Great jobs. Quiet Google page.
          </h2>
          <ul className="space-y-3 text-left text-[var(--text-sub)] max-w-xl mx-auto">
            {[
              'Customer says “I’ll leave a review”—then never does.',
              'Your crew crushed it. Your Google listing still looks empty.',
              'Competitors with more reviews keep winning the next bid.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="text-[#FF6700] font-bold shrink-0">×</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg text-[var(--text-main)] font-medium">
            Reviews fixes that. Ask while the job is fresh.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold text-center mb-4 uppercase">
            Three steps. Done.
          </h2>
          <p className="text-center text-[var(--text-sub)] mb-12 max-w-lg mx-auto">
            No complicated setup. Just your Google review link, ready when the job wraps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                icon: Star,
                step: 1,
                title: 'Add your link',
                desc: 'Drop in your Google review URL once. You’re set.',
              },
              {
                icon: Smartphone,
                step: 2,
                title: 'Finish the job',
                desc: 'Paint done. Unit swapped. Roof sealed. Pull out your phone.',
              },
              {
                icon: MessageSquareQuote,
                step: 3,
                title: 'Send the ask',
                desc: 'Text or share your review link before you leave the driveway.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="text-center group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-[#FF6700]/20 border-2 border-[#FF6700]/50 flex items-center justify-center mx-auto mb-4 relative">
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6700] text-black font-black text-xs flex items-center justify-center">
                    {step}
                  </span>
                  <Icon size={28} className="text-[#FF6700]" />
                </div>
                <h3 className="text-lg font-oswald font-bold mb-2 uppercase">{title}</h3>
                <p className="text-sm text-[var(--text-sub)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFER */}
      <section className="py-20 px-6 bg-[var(--bg-card)]/40 border-y border-[var(--border-color)]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-3 uppercase">
            Simple offer
          </h2>
          <p className="text-[var(--text-sub)] mb-8">
            One product. One price. Cancel anytime.
          </p>
          <div className="border border-[var(--border-color)] rounded-2xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6700]/10 via-transparent to-transparent pointer-events-none" />
            <p className="relative text-sm font-bold uppercase tracking-wider text-[#FF6700] mb-2">
              FieldDeskOps Reviews
            </p>
            <div className="relative mb-4">
              <span className="text-5xl md:text-6xl font-oswald font-black text-[#FF6700]">
                $9.99
              </span>
              <span className="text-xl text-[var(--text-sub)] ml-2">/month</span>
            </div>
            <p className="relative text-[#FF6700] font-bold mb-6">
              7-day free trial · $0 due today
            </p>
            <ul className="relative space-y-3 mb-8 text-left max-w-sm mx-auto">
              {[
                'Send your Google review link after jobs',
                'Built for contractors in the field',
                'Cancel anytime',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#FF6700] shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href={REVIEWS_CHECKOUT_URL}
              className="relative inline-flex w-full items-center justify-center gap-2 px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] hover:scale-[1.02] transition-all text-lg"
            >
              {CTA_LABEL} <ArrowRight size={20} />
            </a>
          </div>
          <p className="mt-8 text-sm text-[var(--text-sub)] max-w-md mx-auto">
            FieldDeskOps also has jobsite photos and contracts if you need them later—this page is
            just for Reviews.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-[#FF6700]/5 border-t border-[#FF6700]/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-oswald font-black mb-4 uppercase">
            Ask while they&apos;re still smiling
          </h2>
          <p className="text-xl text-[var(--text-sub)] mb-8 max-w-xl mx-auto">
            One link. More reviews. More next jobs.
          </p>
          <a
            href={REVIEWS_CHECKOUT_URL}
            className="inline-flex w-full sm:w-auto px-10 py-5 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_25px_rgba(255,103,0,0.4)] hover:shadow-[0_0_35px_rgba(255,103,0,0.5)] hover:scale-[1.02] transition-all items-center justify-center gap-2 text-xl"
          >
            {CTA_LABEL} <ArrowRight size={24} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
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
                href="/welcome"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Platform
              </Link>
              <a
                href={REVIEWS_CHECKOUT_URL}
                className="text-[#FF6700] font-semibold hover:underline text-sm"
              >
                Start trial
              </a>
              <Link
                href="/legal/terms?from=%2Freviews"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Terms
              </Link>
              <Link
                href="/legal/privacy?from=%2Freviews"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm"
              >
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-[var(--text-sub)] text-sm">
            © {new Date().getFullYear()} FieldDeskOps. Built for contractors, by contractors.
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
