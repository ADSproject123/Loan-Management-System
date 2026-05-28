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
  Eye,
  HeartHandshake,
  Landmark,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

export default function HomePage() {
  const aboutItems = [
    {
      icon: Eye,
      title: 'Vision & Mission',
      description: 'Build a trusted member-owned cooperative that helps families save, borrow fairly, and grow together.',
    },
    {
      icon: Users,
      title: 'Membership',
      description: 'Join with a verified referee, submit your documents, and access the SanSam member portal after approval.',
    },
    {
      icon: PiggyBank,
      title: 'Saving Benefits',
      description: 'Make regular contributions, earn cooperative returns, and request savings reports when you need them.',
    },
    {
      icon: CreditCard,
      title: 'Loan Rates',
      description: 'Apply for fair member loans with transparent rates, referee verification, and committee approval.',
    },
  ]

  return (
    <div className="font-times min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <section className="relative min-h-screen overflow-hidden bg-blue-950 text-white flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/home-hero-cooperative.jpg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-900/82 to-blue-800/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.24),transparent_35%)]" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
                Better savings, fair loans, and a trusted member community.
              </h1>
              <p className="text-blue-100 text-lg md:text-xl leading-8 max-w-2xl mb-8">
                SanSam helps members save regularly, request transparent loans, and manage every step
                online with document verification, payment evidence, and admin approval.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-blue-800 transition-colors"
                >
                  Become a Member
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#about-sansam"
                  className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur"
                >
                  Explore Benefits
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-4xl bg-white/10 p-6 md:p-8 text-white shadow-2xl shadow-blue-950/30 ring-1 ring-white/15 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/15 pb-5 mb-6">
                  <div>
                    <p className="text-blue-200 text-sm">Member Portal</p>
                    <p className="text-2xl font-bold mt-1">Financial Dashboard</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Landmark className="w-7 h-7 text-blue-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Saving Return', value: '3%', icon: TrendingUp },
                    { label: 'Loan Approval', value: '1-3d', icon: CreditCard },
                    { label: 'Reports', value: 'Telegram', icon: CheckCircle },
                    { label: 'Withdrawal', value: 'Jan 20-25', icon: Wallet },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-2xl bg-white/10 p-4">
                        <Icon className="w-5 h-5 text-blue-200 mb-4" />
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-blue-200 text-sm mt-1">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about-sansam" className="min-h-screen flex items-center py-16 md:py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">About SanSam</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
              Everything members need to understand before joining.
            </h2>
            <p className="text-gray-600 mt-4 leading-7">
              Learn the mission, membership choices, saving benefits, loan rates, and withdrawal
              options before opening your member account.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
            <div
              className="min-h-96 rounded-3xl bg-cover bg-center shadow-xl shadow-blue-900/10 relative overflow-hidden"
              style={{ backgroundImage: "url('/home-about-community.jpg')" }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-950/80 via-blue-900/45 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-sm font-semibold text-blue-100">Community-first finance</p>
                <p className="mt-2 text-2xl font-extrabold leading-tight">
                  Members save, borrow, and grow with transparent support.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {aboutItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-200 hover:shadow-lg transition-all">
                    <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-800 mb-5 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-950 mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-6">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm">
              <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-800 mb-5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 mb-4">Membership</h2>
              <p className="text-gray-600 leading-7 mb-6">
                Become a member by submitting your information, adding a referee if available,
                and uploading your ID card and resident book for review.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-7">
                {[
                  { title: 'Become a member', text: 'Register online and wait for account approval.' },
                  { title: 'Membership withdrawal', text: 'Request capital withdrawal during the annual window.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-blue-50 p-5">
                    <p className="font-bold text-blue-950">{item.title}</p>
                    <p className="text-sm text-blue-800 mt-2 leading-6">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/register" className="inline-flex items-center gap-2 text-blue-900 font-bold hover:text-blue-700">
                Start membership request <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-3xl bg-blue-900 p-8 text-white shadow-xl shadow-blue-900/10">
              <div className="inline-flex rounded-xl bg-white/10 p-3 text-blue-100 mb-5">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">Saving & Loan Benefits</h2>
              <p className="text-blue-100 leading-7 mb-6">
                Members can add savings, submit payment evidence, request loans, repay by QR,
                and ask for instant reports through the portal.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Saving benefit', value: '3% monthly return' },
                  { label: 'Loan rates', value: 'From 1-2% per month' },
                  { label: 'Reports', value: 'Saving and loan reports' },
                  { label: 'Approval', value: 'Admin reviewed workflow' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
                    <span className="text-blue-200 text-sm">{item.label}</span>
                    <span className="font-semibold text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { value: '500+', label: 'Active Members' },
              { value: '฿2M+', label: 'Total Savings' },
              { value: '3%', label: 'Monthly Saving Return' },
              { value: '1-3 Days', label: 'Approval Review' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-slate-50 p-6 text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-blue-900">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 bg-blue-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/home-cta-finance.jpg')" }}
        />
        <div className="absolute inset-0 bg-blue-950/82" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.28),transparent_42%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Ready to join SanSam?
          </h2>
          <p className="text-blue-100 leading-7 mb-8">
            Create your membership request, upload your documents, and our admin team will review
            your account before you begin saving or applying for loans.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-900 text-white px-7 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors">
              Become a Member <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-800 px-7 py-3 rounded-xl font-semibold hover:border-blue-300 hover:text-blue-900 transition-colors">
              Member Login
            </Link>
          </div>
        </div>
      </section>

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
