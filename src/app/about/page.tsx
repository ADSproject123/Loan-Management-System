'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import {
  Target,
  Eye,
  Heart,
  PiggyBank,
  CreditCard,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  Shield,
} from 'lucide-react'

type Tab = 'vision' | 'saving-benefits' | 'loan-rates' | 'membership'

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<Tab>('vision')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'vision', label: 'Vision & Mission', icon: Eye },
    { id: 'saving-benefits', label: 'Saving Benefits', icon: PiggyBank },
    { id: 'loan-rates', label: 'Loan Rates', icon: CreditCard },
    { id: 'membership', label: 'Membership', icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span>About SanSam</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">About SanSam</h1>
          <p className="text-blue-200 max-w-2xl">
            Learn about our cooperative&apos;s vision, membership benefits, saving programs, and loan offerings.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-900 text-blue-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Vision & Mission */}
          {activeTab === 'vision' && (
            <div id="vision" className="space-y-10">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Eye className="w-6 h-6 text-blue-900" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg mb-4">
                    To be the most trusted and empowering financial cooperative that transforms
                    the lives of our members through collaborative savings and accessible credit.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    We envision a community where every member has the financial tools and
                    support needed to achieve their personal and family goals, free from
                    predatory lending and financial insecurity.
                  </p>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Target className="w-6 h-6 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    SanSam exists to promote financial well-being among our members by providing:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'A safe, transparent platform for cooperative savings',
                      'Fair and accessible loans for genuine member needs',
                      'Financial education and responsible money management',
                      'Community-driven governance where members have a voice',
                      'Support for members during financial emergencies',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-600 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Heart className="w-6 h-6 text-purple-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Transparency',
                      description: 'All financial operations are open and accountable to every member of the cooperative.',
                      color: 'bg-blue-50 text-blue-900',
                    },
                    {
                      title: 'Community',
                      description: 'We grow together. The success of one member strengthens the entire cooperative.',
                      color: 'bg-green-50 text-green-900',
                    },
                    {
                      title: 'Integrity',
                      description: 'We operate with the highest ethical standards in all financial dealings and member relations.',
                      color: 'bg-purple-50 text-purple-900',
                    },
                  ].map((value) => (
                    <div key={value.title} className={`rounded-xl p-5 ${value.color}`}>
                      <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                      <p className="text-sm opacity-80 leading-relaxed">{value.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-blue-900 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-7 h-7 text-blue-200" />
                  <h2 className="text-2xl font-bold">SanSam Cooperative</h2>
                </div>
                <p className="text-blue-100 leading-relaxed mb-6">
                  Founded by members for members, SanSam has grown from a small savings group into
                  a thriving cooperative with hundreds of active participants. We are governed by
                  elected representatives and operate for the benefit of all members, not for profit.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: Users, label: 'Member-Owned', sub: 'Democratic governance' },
                    { icon: Shield, label: 'Secure', sub: 'Protected savings' },
                    { icon: TrendingUp, label: 'Growing', sub: 'Year over year growth' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-3 bg-blue-800 rounded-lg p-4">
                        <Icon className="w-5 h-5 text-blue-200 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">{item.label}</p>
                          <p className="text-blue-300 text-xs">{item.sub}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Saving Benefits */}
          {activeTab === 'saving-benefits' && (
            <div id="saving-benefits" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Saving Benefits</h2>
                <p className="text-gray-600">
                  Grow your wealth through cooperative savings. Every baht you save contributes to
                  the collective strength of SanSam and earns you competitive returns.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: TrendingUp,
                    title: '3% Monthly Interest',
                    description: 'Earn 3% interest per month on your total savings balance, paid out monthly.',
                    highlight: true,
                  },
                  {
                    icon: PiggyBank,
                    title: 'Capital Protection',
                    description: 'Your principal savings are always protected and can be withdrawn during the annual window.',
                    highlight: false,
                  },
                  {
                    icon: CheckCircle,
                    title: 'Flexible Amounts',
                    description: 'Save any amount each month according to your financial capacity. No minimum required.',
                    highlight: false,
                  },
                ].map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <Card key={benefit.title} className={benefit.highlight ? 'border-blue-900 border-2' : ''}>
                      {benefit.highlight && (
                        <div className="text-xs font-semibold text-blue-900 bg-blue-50 rounded-full px-3 py-1 inline-block mb-3">
                          Most Popular
                        </div>
                      )}
                      <div className="p-3 bg-blue-50 rounded-xl inline-flex mb-4">
                        <Icon className="w-6 h-6 text-blue-900" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </Card>
                  )
                })}
              </div>

              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-5">How Saving Works</h3>
                <div className="space-y-4">
                  {[
                    {
                      step: '1',
                      title: 'Log in to Your Account',
                      description: 'Access the Member Portal and verify your identity.',
                    },
                    {
                      step: '2',
                      title: 'Enter Saving Amount',
                      description: 'Choose how much you want to save this month.',
                    },
                    {
                      step: '3',
                      title: 'Scan QR Code',
                      description: 'Use the QR code to transfer funds to the cooperative account.',
                    },
                    {
                      step: '4',
                      title: 'Submit Evidence',
                      description: 'Upload a screenshot of the transfer confirmation.',
                    },
                    {
                      step: '5',
                      title: 'Confirmation',
                      description: 'Receive confirmation once your saving is verified by admin.',
                    },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-gray-600 text-sm">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4">Instant Saving Reports</h3>
                <p className="text-green-800 mb-4">
                  Request a saving report for any period directly from the member portal.
                  Reports are sent instantly to your registered Telegram account.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600">
                    Reports include: total savings, monthly contributions, interest earned, and running balance.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Loan Rates */}
          {activeTab === 'loan-rates' && (
            <div id="loan-rates" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Loan Rates &amp; Terms</h2>
                <p className="text-gray-600">
                  Access fair and transparent loans designed for member needs. Our rates are
                  competitive and our process is straightforward.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { label: 'Minimum Rate', value: '1%', sub: 'per month', color: 'bg-blue-900' },
                  { label: 'Standard Rate', value: '2%', sub: 'per month', color: 'bg-blue-700' },
                  { label: 'Max Term', value: '24', sub: 'months', color: 'bg-blue-600' },
                ].map((item) => (
                  <div key={item.label} className={`${item.color} text-white rounded-xl p-6 text-center`}>
                    <p className="text-5xl font-bold mb-1">{item.value}</p>
                    <p className="text-blue-200 text-sm mb-2">{item.sub}</p>
                    <p className="font-medium">{item.label}</p>
                  </div>
                ))}
              </div>

              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-5">Loan Eligibility Requirements</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Must be an active SanSam member',
                    'Membership in good standing for at least 3 months',
                    'Require a verified referee (SanSam member)',
                    'Maximum loan amount based on savings balance',
                    'No existing defaulted loans',
                    'Must submit hard copy documents with thumbprints',
                  ].map((req) => (
                    <div key={req} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-900 flex-shrink-0 mt-1" />
                      <span className="text-gray-700 text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-5">Loan Application Process</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Submit Loan Request', description: 'Fill in the loan application with amount, purpose, and preferred term.' },
                    { step: '2', title: 'Upload Supporting Documents', description: 'Provide required documents to support your loan application.' },
                    { step: '3', title: 'Referee Verification', description: 'Your designated referee must verify and approve your application.' },
                    { step: '4', title: 'Admin Review', description: 'SanSam committee reviews and approves within 1-3 business days.' },
                    { step: '5', title: 'Submit Hard Copy', description: 'Deliver signed hard copy documents with thumbprints to the cooperative.' },
                    { step: '6', title: 'Loan Disbursement', description: 'Approved loan amount is transferred to your account.' },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-gray-600 text-sm">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-5">Loan Repayment</h3>
                <p className="text-gray-600 mb-4">
                  Repay your loan through the Member Portal. Each repayment requires QR code payment
                  with evidence submission. Repayments are verified by admin within 24 hours.
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-900 font-medium text-sm">
                    Instant loan reports are available for any period, sent to your Telegram account upon request.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Membership */}
          {activeTab === 'membership' && (
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Membership</h2>
                <p className="text-gray-600">
                  Join SanSam as a member to access all savings and loan services. Membership
                  is open to anyone with a verified referee.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Become a Member</h3>
                  <div className="space-y-4 mb-6">
                    {[
                      { step: 'A', title: 'Via Referee Path', desc: 'Have a current member add you as their referee introduction, then request verification.' },
                      { step: 'B', title: 'Direct Application', desc: 'Submit the member request form, upload ID and Resident Book, and wait for approval.' },
                    ].map((path) => (
                      <div key={path.step} className="bg-gray-50 rounded-lg p-4 flex gap-4">
                        <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {path.step}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{path.title}</p>
                          <p className="text-gray-600 text-sm">{path.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
                  >
                    Start Registration
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>

                <Card>
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Membership Withdrawal</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Members may request to withdraw their capital and terminate their membership.
                    Capital withdrawal requests must be submitted during the designated period
                    (January 20-25 each year).
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm font-medium">Important Notice</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Capital withdrawal is processed only once per year during January 20-25.
                      After withdrawal, members can choose to continue saving or remove their membership entirely.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Withdrawal Process:</p>
                    {[
                      'Submit capital request via Member Portal',
                      'Fill out the withdrawal form with amount',
                      'Receive notification of approval (Jan 20-25)',
                      'Choose to continue saving or end membership',
                    ].map((step) => (
                      <div key={step} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-5">Member Benefits Summary</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: PiggyBank, label: 'Monthly Savings', value: '3% interest' },
                    { icon: CreditCard, label: 'Loans', value: 'From 1%/month' },
                    { icon: TrendingUp, label: 'Reports', value: 'Via Telegram' },
                    { icon: Users, label: 'Governance', value: 'Member vote' },
                  ].map((benefit) => {
                    const Icon = benefit.icon
                    return (
                      <div key={benefit.label} className="bg-blue-50 rounded-xl p-4 text-center">
                        <Icon className="w-6 h-6 text-blue-900 mx-auto mb-2" />
                        <p className="font-semibold text-blue-900 text-sm">{benefit.label}</p>
                        <p className="text-blue-700 text-xs mt-1">{benefit.value}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* CTA Footer */}
      <section className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Join SanSam?</h2>
          <p className="text-blue-200 mb-6">Start your journey toward better financial wellbeing today.</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
