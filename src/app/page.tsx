import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import {
  ArrowRight,
  PiggyBank,
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle,
  Building2,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-800 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Savings &amp; Loan Cooperative
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Empowering Members Through{' '}
              <span className="text-blue-200">Financial Cooperation</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 leading-relaxed">
              SanSam is a member-owned cooperative dedicated to helping you save, grow, and access
              fair loans. Together we build a stronger financial future.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Become a Member
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '500+', label: 'Active Members' },
              { value: '฿2M+', label: 'Total Savings' },
              { value: '3%', label: 'Monthly Interest' },
              { value: '1-3 Days', label: 'Loan Approval' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-blue-900">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SanSam provides members with accessible financial services designed for community growth.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: PiggyBank,
                title: 'Monthly Savings',
                description:
                  'Save a fixed amount monthly and watch your capital grow with competitive interest rates. Withdraw your savings capital anytime.',
                href: '/about#saving-benefits',
                color: 'text-green-600 bg-green-50',
              },
              {
                icon: CreditCard,
                title: 'Fair Loans',
                description:
                  'Access loans at member-friendly rates. Simple application process with quick 1-3 day approval for qualified members.',
                href: '/about#loan-rates',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Users,
                title: 'Community',
                description:
                  'Join a community of members who support each other financially. Become a referee for new members and help grow our cooperative.',
                href: '/about#vision',
                color: 'text-purple-600 bg-purple-50',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                  <Link
                    href={feature.href}
                    className="inline-flex items-center gap-1 text-blue-900 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Join */}
      <section className="bg-blue-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Join SanSam</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Joining is simple. Follow these steps to become a member.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Find a Referee',
                description: 'Get a current SanSam member to be your referee and vouch for you.',
              },
              {
                step: '02',
                title: 'Submit Application',
                description: 'Fill out the membership form with your personal details.',
              },
              {
                step: '03',
                title: 'Upload Documents',
                description: 'Provide your ID card and Resident Book for verification.',
              },
              {
                step: '04',
                title: 'Wait for Approval',
                description: 'Accounts are reviewed within 1-3 business days.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Start Registration
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose SanSam?</h2>
              <div className="space-y-4">
                {[
                  'Member-owned cooperative with transparent governance',
                  'Competitive savings interest rates paid monthly',
                  'Fast loan approval within 1-3 business days',
                  'Flexible loan terms tailored to your needs',
                  'Digital reports sent directly to your Telegram',
                  'Referee system ensures trusted membership',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-8 text-white">
              <TrendingUp className="w-10 h-10 mb-4 text-blue-200" />
              <h3 className="text-2xl font-bold mb-4">Start Saving Today</h3>
              <p className="text-blue-100 mb-6">
                Every baht saved with SanSam works harder for you. Our cooperative model ensures
                profits are shared with members, not shareholders.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Monthly Saving Rate', value: '3%' },
                  { label: 'Loan Interest Rate', value: 'From 1% / month' },
                  { label: 'Capital Withdrawal', value: 'Jan 20-25 annually' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-blue-700">
                    <span className="text-blue-200 text-sm">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Building2 className="w-6 h-6" />
              SanSam Cooperative
            </div>
            <div className="flex gap-6 text-sm text-blue-200">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/register" className="hover:text-white transition-colors">Join Us</Link>
              <Link href="/login" className="hover:text-white transition-colors">Member Login</Link>
            </div>
            <p className="text-blue-300 text-sm">&copy; 2025 SanSam. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
