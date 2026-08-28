import Link from 'next/link'
import { getWhopCheckoutUrl } from '../../lib/whopCheckout'

export const metadata = {
  title: 'Pricing',
  description: 'Compare FieldDeskOps plans and choose the best fit.',
  openGraph: {
    title: 'Pricing',
    description: 'Compare FieldDeskOps plans and choose the best fit.',
    url: '/pricing',
  },
  twitter: {
    title: 'Pricing',
    description: 'Compare FieldDeskOps plans and choose the best fit.',
  },
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 active job',
        '1 rig + 1 worker',
        '1 customer',
        '3 estimates total',
        '3 photos total',
        '3 contracts total',
        '3 inventory items total',
        'Community support',
      ],
      cta: 'Current Plan',
      current: true,
      href: '/dashboard',
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: 'per month',
      features: [
        'All 4 apps: ProfitLock, SiteSnap, SignOff, LoadOut',
        'Unlimited jobs & estimates',
        'Unlimited photos & documentation',
        'Unlimited inventory, rigs & workers',
        'Professional contract templates',
        'Email support · Cancel anytime',
        '7-day free trial · $0 due today',
      ],
      cta: 'Upgrade Now',
      highlighted: true,
      href: getWhopCheckoutUrl(),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-orange-400 mb-6"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Pick the perfect plan for your field operations. Start small, scale as you grow.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-gray-800/50 rounded-2xl p-8 border transition-all duration-300 ${
                plan.highlighted 
                  ? 'border-primary scale-105 shadow-2xl shadow-primary/20' 
                  : plan.disabled
                  ? 'border-gray-700 opacity-60'
                  : 'border-gray-700 hover:border-primary hover:scale-[1.02]'
              }`}
            >
              {plan.highlighted && (
                <div className="inline-block bg-primary text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                  MOST POPULAR
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 ml-2">/{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.disabled ? '#' : (plan.href || '/dashboard')}
                className={`block w-full text-center py-4 rounded-lg font-bold transition-colors ${
                  plan.current
                    ? 'bg-gray-700 text-gray-300 cursor-default'
                    : plan.disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-orange-600 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Need a custom plan?</h3>
            <p className="text-gray-400 mb-6">
              Have a large crew or unique requirements? Contact us for enterprise solutions.
            </p>
            <Link
              href="mailto:contact@fielddeskops.com"
              className="inline-block px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-medium border border-gray-600 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
