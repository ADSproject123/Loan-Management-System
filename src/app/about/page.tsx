'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
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
  Sparkles,
  Calendar,
  Send,
  Quote,
  ShieldCheck,
  Clock,
  Receipt,
  Wallet,
  UserPlus,
} from 'lucide-react'

type Tab = 'vision' | 'saving-benefits' | 'loan-rates' | 'membership'

const IMAGES = {
  hero: '/home-hero-cooperative.jpg',
  community: '/home-about-community.jpg',
  cta: '/home-cta-finance.jpg',
  vision: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=1600&q=80',
  savings: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80',
  loans: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80',
  repayment: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=1200&q=80',
  membership: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1600&q=80',
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<Tab>('vision')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'vision', label: 'ចក្ខុវិស័យ និង បេសកកម្ម', icon: Eye },
    { id: 'saving-benefits', label: 'អត្ថប្រយោជន៍សន្សំ', icon: PiggyBank },
    { id: 'loan-rates', label: 'អត្រាការប្រាក់ឥណទាន', icon: CreditCard },
    { id: 'membership', label: 'សមាជិកភាព', icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <Hero />

      <StatsStrip />

      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <main className="flex-1">
        {activeTab === 'vision' && <VisionSection />}
        {activeTab === 'saving-benefits' && <SavingsSection />}
        {activeTab === 'loan-rates' && <LoansSection />}
        {activeTab === 'membership' && <MembershipSection />}
      </main>

      <CTAFooter />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-blue-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${IMAGES.hero}')` }}
      />
      <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-900/80 to-blue-800/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.22),transparent_38%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 md:pt-32 md:pb-24">
        <div className="flex items-center gap-2 text-blue-200/90 text-sm mb-5">
          <Link href="/" className="hover:text-white transition-colors">
            ទំព័រដើម
          </Link>
          <span>/</span>
          <span className="text-white/80">អំពីសន្សំ</span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100 ring-1 ring-white/15">
          <Sparkles className="h-3.5 w-3.5" />
          សហករណ៍គ្រប់គ្រងដោយសមាជិក
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
          រឿងរ៉ាវរបស់យើង។ បេសកកម្មរបស់យើង។ សហគមន៍របស់យើង។
        </h1>
        <p className="mt-5 max-w-2xl text-blue-100 text-lg leading-8">
          ស្វែងយល់ពីរបៀបដែលសន្សំជួយសមាជិករាប់រយនាក់ក្នុងការសន្សំទៀងទាត់ ស្នើសុំឥណទាន
          ដោយយុត្តិធម៌ និង រីកចម្រើនទៅជាមួយគ្នាជាសហគមន៍ដ៏ខ្លាំង។
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stats Strip                                                         */
/* ------------------------------------------------------------------ */

function StatsStrip() {
  const stats = [
    { value: '៥០០+', label: 'សមាជិកសកម្ម' },
    { value: '៣%', label: 'ការប្រាក់សន្សំប្រចាំខែ' },
    { value: '១-២%', label: 'អត្រាការប្រាក់ឥណទាន' },
    { value: '១-៣ ថ្ងៃ', label: 'ការអនុម័តពាក្យសុំ' },
  ]
  return (
    <section className="relative -mt-12 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl shadow-blue-950/10 ring-1 ring-slate-200/60">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-blue-900">{stat.value}</p>
              <p className="text-gray-500 text-xs md:text-sm mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Tab Navigation                                                      */
/* ------------------------------------------------------------------ */

function TabNav({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: Tab; label: string; icon: React.ElementType }[]
  activeTab: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-blue-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {active && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-900" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vision Section                                                      */
/* ------------------------------------------------------------------ */

function VisionSection() {
  return (
    <div className="py-16 md:py-20 space-y-20">
      {/* Vision editorial split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <div
              className="aspect-[4/5] rounded-3xl bg-cover bg-center shadow-2xl shadow-blue-900/20"
              style={{ backgroundImage: `url('${IMAGES.vision}')` }}
            />
            <div className="absolute -bottom-6 -right-6 hidden md:block rounded-2xl bg-white p-5 shadow-xl shadow-blue-900/10 ring-1 ring-slate-200/60 w-64">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Heart className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-gray-500">បង្កើតឡើងដោយ</p>
                  <p className="text-sm font-bold text-gray-900">សមាជិក សម្រាប់សមាជិក</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">ចក្ខុវិស័យរបស់យើង</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
              សហករណ៍ហិរញ្ញវត្ថុដែលផ្លាស់ប្តូរជីវិតគ្រួសារទាំងមូល។
            </h2>
            <p className="text-gray-600 leading-8 mt-5 text-lg">
              យើងស្រមៃឃើញសហគមន៍មួយដែលសមាជិកគ្រប់រូបមានឧបករណ៍ហិរញ្ញវត្ថុ និង ការគាំទ្រ
              ដែលត្រូវការដើម្បីសម្រេចគោលដៅផ្ទាល់ខ្លួន និង គ្រួសារ ដោយគ្មានការផ្តល់ប្រាក់កម្ចី
              ដែលត្រាច់ចរ និង អសន្តិសុខហិរញ្ញវត្ថុ។
            </p>
            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {[
                { icon: ShieldCheck, label: 'តម្លាភាពពេញលេញ' },
                { icon: Users, label: 'អភិបាលដោយសមាជិក' },
                { icon: TrendingUp, label: 'រីកចម្រើនប្រកបដោយចីរភាព' },
                { icon: Heart, label: 'ជំរុញដោយសហគមន៍' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl bg-blue-50/60 ring-1 ring-blue-100 px-4 py-3">
                    <Icon className="h-4 w-4 text-blue-700 shrink-0" />
                    <span className="text-sm font-semibold text-blue-950">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-8 md:p-12 text-white shadow-2xl shadow-blue-900/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.25),transparent_45%)]" />
          <div className="relative grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <span className="inline-flex rounded-xl bg-white/10 ring-1 ring-white/15 p-3 mb-5">
                <Target className="w-7 h-7 text-blue-100" />
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">បេសកកម្មរបស់យើង</h2>
              <p className="text-blue-100 mt-4 leading-7">
                សន្សំមានគោលបំណងលើកកម្ពស់សុខុមាលភាពហិរញ្ញវត្ថុក្នុងចំណោមសមាជិករបស់យើង
                តាមរយៈការផ្តល់ជូននូវឱកាស និង ការគាំទ្រ៖
              </p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                'វេទិកាសន្សំសហការដែលមានសុវត្ថិភាព និង តម្លាភាព',
                'ឥណទានដែលយុត្តិធម៌ និង ងាយស្រួលសម្រាប់សេចក្តីត្រូវការសមាជិក',
                'អប់រំហិរញ្ញវត្ថុ និង គ្រប់គ្រងលុយដោយទំនួលខុសត្រូវ',
                'អភិបាលកិច្ចដែលជំរុញដោយសហគមន៍ដែលសមាជិកមានសំឡេង',
                'ការគាំទ្រសមាជិកក្នុងពេលអាសន្នហិរញ្ញវត្ថុ',
                'ទិន្នន័យហិរញ្ញវត្ថុលម្អិតភ្លាមៗតាមរយៈ Telegram',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <span className="text-sm leading-6 text-blue-50">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">តម្លៃរបស់យើង</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            គោលការណ៍បីដែលដឹកនាំការងាររបស់យើងប្រចាំថ្ងៃ។
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Eye,
              title: 'តម្លាភាព',
              description: 'ប្រតិបត្តិការហិរញ្ញវត្ថុទាំងអស់គឺបើកចំហ និង ទទួលខុសត្រូវចំពោះសមាជិកគ្រប់រូប។',
              accent: 'from-blue-500 to-blue-700',
            },
            {
              icon: Users,
              title: 'សហគមន៍',
              description: 'យើងរីកចម្រើនជាមួយគ្នា។ ភាពជោគជ័យរបស់សមាជិកម្នាក់ពង្រឹងសហករណ៍ទាំងមូល។',
              accent: 'from-emerald-500 to-emerald-700',
            },
            {
              icon: Shield,
              title: 'សុចរិតភាព',
              description: 'យើងប្រតិបត្តិតាមស្តង់ដារក្រមសីលធម៌ខ្ពស់បំផុតក្នុងគ្រប់ការងារ និង ទំនាក់ទំនងសមាជិក។',
              accent: 'from-purple-500 to-purple-700',
            },
          ].map((value) => {
            const Icon = value.icon
            return (
              <div key={value.title} className="group relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${value.accent}`} />
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${value.accent} text-white shadow-md mb-5`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-bold text-gray-950 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-7 text-sm">{value.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Story / Quote */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-8 items-stretch">
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Building2 className="w-7 h-7 text-blue-900" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-950">សហករណ៍សន្សំ</h2>
            </div>
            <p className="text-gray-600 leading-8 mb-7">
              បង្កើតឡើងដោយសមាជិកសម្រាប់សមាជិក សន្សំបានរីកចម្រើនពីក្រុមសន្សំតូចមួយទៅជា
              សហករណ៍ដ៏រីកចម្រើនដែលមានសមាជិកសកម្មរាប់រយនាក់។ យើងគ្រប់គ្រងដោយតំណាង
              ដែលត្រូវបានជ្រើសរើស និង ប្រតិបត្តិដើម្បីផលប្រយោជន៍សមាជិកទាំងអស់ មិនមែនសម្រាប់ប្រាក់ចំណេញឡើយ។
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Users, label: 'គ្រប់គ្រងដោយសមាជិក', sub: 'អភិបាលប្រជាធិបតេយ្យ' },
                { icon: Shield, label: 'សុវត្ថិភាព', sub: 'ការសន្សំការពារ' },
                { icon: TrendingUp, label: 'រីកចម្រើន', sub: 'ឆ្នាំទៅឆ្នាំ' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 p-4">
                    <Icon className="w-5 h-5 text-blue-700 mb-2" />
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden bg-cover bg-center min-h-72 shadow-2xl shadow-blue-900/20"
            style={{ backgroundImage: `url('${IMAGES.community}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <Quote className="w-8 h-8 text-blue-200/80 mb-3" />
              <p className="text-lg leading-7 font-medium">
                &ldquo;សន្សំជួយយើងសន្សំបានទៀងទាត់ និង ងាយស្រួល ខ្ចីប្រាក់សម្រាប់
                ហុចគ្រួសារនៅពេលត្រូវការ ដោយគ្មានភាពតានតឹង។&rdquo;
              </p>
              <p className="mt-4 text-sm text-blue-200">— សមាជិកសន្សំ ដែលបានចូលរួមតាំងពីឆ្នាំ ២០២៣</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Savings Section                                                     */
/* ------------------------------------------------------------------ */

function SavingsSection() {
  return (
    <div className="py-16 md:py-20 space-y-20">
      {/* Big number feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">អត្ថប្រយោជន៍សន្សំ</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-950 leading-[1.05]">
              ការសន្សំរបស់អ្នករកបាន<br />
              <span className="text-blue-900">៣% ប្រចាំខែ</span> ដោយស្វ័យប្រវត្តិ។
            </h2>
            <p className="text-gray-600 leading-8 mt-5 text-lg">
              រាល់បាតដែលអ្នកសន្សំរួមចំណែកដល់កម្លាំងសមូហភាពរបស់សន្សំ។ ការប្រាក់ត្រូវបានឥណពន្ធ
              ដោយស្វ័យប្រវត្តិនៅចុងខែនីមួយៗលើសមតុល្យសន្សំសរុបរបស់អ្នក។
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard/savings/add"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 text-white px-5 py-3 text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                ចាប់ផ្តើមសន្សំ
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:border-blue-200 transition-colors"
              >
                ក្លាយជាសមាជិក
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="aspect-square rounded-3xl bg-cover bg-center shadow-2xl shadow-blue-900/20"
              style={{ backgroundImage: `url('${IMAGES.savings}')` }}
            />
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-xl shadow-blue-900/10 ring-1 ring-slate-200/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">ការប្រាក់ខែនេះ</p>
              <p className="mt-1 text-3xl font-extrabold text-gray-950">+฿៣០០</p>
              <p className="text-xs text-gray-500 mt-1">លើការសន្សំ ฿១០,០០០</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: 'ការប្រាក់ ៣% ប្រចាំខែ',
              description: 'ការប្រាក់ឥណពន្ធដោយស្វ័យប្រវត្តិលើសមតុល្យសរុបរបស់អ្នកនៅចុងខែនីមួយៗ។',
              highlight: true,
            },
            {
              icon: PiggyBank,
              title: 'ការការពារដើមទុន',
              description: 'ការសន្សំដើមត្រូវបានការពារជានិច្ច និង អាចដកវិញនៅអំឡុង ២០-២៥ មករា។',
              highlight: false,
            },
            {
              icon: CheckCircle,
              title: 'ចំនួនទឹកប្រាក់បត់បែន',
              description: 'សន្សំចំនួនណាមួយរាល់ខែតាមសមត្ថភាពហិរញ្ញវត្ថុរបស់អ្នក។ មិនត្រូវការអប្បបរមាទេ។',
              highlight: false,
            },
          ].map((benefit) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className={`relative rounded-3xl p-7 transition-all ${
                  benefit.highlight
                    ? 'bg-blue-950 text-white shadow-xl shadow-blue-900/30 -translate-y-2'
                    : 'bg-white text-gray-950 ring-1 ring-slate-200 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {benefit.highlight && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">
                    <Sparkles className="h-3 w-3" /> ពេញនិយម
                  </span>
                )}
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5 ${
                  benefit.highlight ? 'bg-white/10 ring-1 ring-white/15' : 'bg-blue-50 text-blue-700'
                }`}>
                  <Icon className={`h-6 w-6 ${benefit.highlight ? 'text-blue-100' : ''}`} />
                </span>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className={`text-sm leading-7 ${benefit.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works - horizontal flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">របៀបដែលការសន្សំដំណើរការ</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            ៥ ជំហានសាមញ្ញដើម្បីសន្សំប្រចាំខែរបស់អ្នក។
          </h2>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 relative">
            {[
              { step: '១', title: 'ចូលគណនី', description: 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណរបស់អ្នក' },
              { step: '២', title: 'បញ្ចូលចំនួន', description: 'ជ្រើសរើសចំនួនទឹកប្រាក់សន្សំ' },
              { step: '៣', title: 'ស្កេន QR', description: 'ផ្ទេរទៅគណនីសហករណ៍' },
              { step: '៤', title: 'ដាក់ភស្តុតាង', description: 'ផ្ទុករូបបញ្ជាក់ការផ្ទេរ' },
              { step: '៥', title: 'ការបញ្ជាក់', description: 'ការផ្ទៀងផ្ទាត់ដោយអ្នកគ្រប់គ្រង' },
            ].map((s) => (
              <div key={s.step} className="relative bg-white rounded-2xl ring-1 ring-slate-200 p-5 shadow-sm">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-900 text-white text-lg font-bold shadow-lg shadow-blue-900/30 mb-4 ring-4 ring-white">
                  {s.step}
                </div>
                <p className="font-bold text-gray-950">{s.title}</p>
                <p className="text-gray-500 text-sm mt-1.5 leading-6">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram Reports Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 ring-1 ring-emerald-200 p-8 md:p-10">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
            <div>
              <span className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700 mb-5">
                <Send className="w-6 h-6" />
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mb-3">
                របាយការណ៍សន្សំភ្លាមៗតាម Telegram
              </h3>
              <p className="text-emerald-900/85 leading-7">
                សុំរបាយការណ៍សន្សំសម្រាប់រយៈពេលណាមួយដោយផ្ទាល់ពីវិបផតថលសមាជិក។
                របាយការណ៍ត្រូវបានផ្ញើភ្លាមៗទៅគណនី Telegram របស់អ្នក។
              </p>
            </div>
            <div className="rounded-2xl bg-white ring-1 ring-emerald-200 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-3">របាយការណ៍រួមមាន</p>
              <ul className="space-y-3">
                {[
                  'ការសន្សំសរុបក្នុងរយៈពេលដែលអ្នកជ្រើស',
                  'ការបរិច្ចាគប្រចាំខែលម្អិត',
                  'ការប្រាក់ដែលរកបាន',
                  'សមតុល្យបច្ចុប្បន្ន និង ការប៉ាន់ប្រមាណ',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-6">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Loans Section                                                       */
/* ------------------------------------------------------------------ */

function LoansSection() {
  return (
    <div className="py-16 md:py-20 space-y-20">
      {/* Rate hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div
              className="aspect-[5/4] rounded-3xl bg-cover bg-center shadow-2xl shadow-blue-900/20"
              style={{ backgroundImage: `url('${IMAGES.loans}')` }}
            />
            <div className="absolute -top-5 -right-5 hidden md:block rounded-2xl bg-white p-4 shadow-xl shadow-blue-900/10 ring-1 ring-slate-200/60">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">អនុម័ត</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-gray-950">១-៣ ថ្ងៃ</p>
              <p className="text-xs text-gray-500">ដំណើរការត្រួតពិនិត្យ</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">អត្រាការប្រាក់ឥណទាន</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-950 leading-[1.05]">
              ឥណទានដោយយុត្តិធម៌។<br />
              <span className="text-blue-900">តម្លាភាពពេញលេញ។</span>
            </h2>
            <p className="text-gray-600 leading-8 mt-5 text-lg">
              ទទួលបានឥណទានដែលរចនាឡើងសម្រាប់សេចក្តីត្រូវការសមាជិក។ អត្រាការប្រាក់ប្រកួតប្រជែង
              ដំណើរការត្រង់ និង ការអនុម័តលឿន។
            </p>
          </div>
        </div>

        {/* Rate cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            { label: 'អត្រាអប្បបរមា', value: '១%', sub: 'ក្នុងមួយខែ', tone: 'bg-blue-900' },
            { label: 'អត្រាស្តង់ដារ', value: '២%', sub: 'ក្នុងមួយខែ', tone: 'bg-blue-700' },
            { label: 'រយៈពេលអតិបរមា', value: '២៤', sub: 'ខែ', tone: 'bg-blue-600' },
          ].map((item) => (
            <div key={item.label} className={`relative overflow-hidden ${item.tone} text-white rounded-3xl p-7 shadow-lg shadow-blue-900/20`}>
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <p className="relative text-xs uppercase tracking-wide text-blue-200 font-semibold">{item.label}</p>
              <p className="relative text-5xl md:text-6xl font-extrabold mt-3">{item.value}</p>
              <p className="relative text-blue-200 mt-1 text-sm">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Eligibility checklist */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-7">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-950">លក្ខខណ្ឌសិទ្ធិទទួលបានឥណទាន</h3>
              <p className="text-sm text-gray-500">ត្រូវបំពេញលក្ខខណ្ឌខាងក្រោមដើម្បីដាក់ពាក្យសុំ</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'ត្រូវតែជាសមាជិកសកម្មរបស់សន្សំ',
              'សមាជិកភាពមានស្ថានភាពល្អយ៉ាងតិច ៣ ខែ',
              'ត្រូវការអ្នកធានាដែលបានផ្ទៀងផ្ទាត់ (សមាជិកសន្សំ)',
              'ចំនួនឥណទានអតិបរមាផ្អែកលើសមតុល្យសន្សំ',
              'គ្មានឥណទានដែលមិនទាន់សងនៅឡើយ',
              'ត្រូវដាក់ឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃ',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 p-4">
                <CheckCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <span className="text-gray-800 text-sm leading-6">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">ដំណើរការដាក់ពាក្យ</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            ៦ ជំហានពីការដាក់ពាក្យដល់ការទទួលប្រាក់។
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
          {[
            { step: '១', title: 'ដាក់ពាក្យសុំឥណទាន', description: 'បំពេញពាក្យសុំជាមួយចំនួន គោលបំណង និង រយៈពេល។' },
            { step: '២', title: 'ផ្ទុកឯកសារគាំទ្រ', description: 'ផ្តល់ឯកសារដែលត្រូវការដើម្បីគាំទ្រពាក្យសុំ។' },
            { step: '៣', title: 'ការផ្ទៀងផ្ទាត់អ្នកធានា', description: 'អ្នកធានាដែលអ្នកកំណត់ត្រូវផ្ទៀងផ្ទាត់ និង អនុម័ត។' },
            { step: '៤', title: 'ការត្រួតពិនិត្យ', description: 'គណៈកម្មាធិការសន្សំត្រួតពិនិត្យក្នុងរយៈពេល ១-៣ ថ្ងៃ។' },
            { step: '៥', title: 'ដាក់ឯកសារច្បាប់ដើម', description: 'ប្រគល់ឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃទៅសហករណ៍។' },
            { step: '៦', title: 'បើកប្រាក់ឥណទាន', description: 'ចំនួនឥណទានដែលអនុម័តត្រូវផ្ទេរទៅគណនីរបស់អ្នក។' },
          ].map((s) => (
            <div key={s.step} className="flex gap-5 rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="shrink-0">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-900 text-lg font-extrabold ring-1 ring-blue-100">
                  {s.step}
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-950">{s.title}</p>
                <p className="text-gray-600 text-sm mt-1.5 leading-6">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Repayment card with image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200 shadow-sm bg-white">
          <div className="grid lg:grid-cols-2">
            <div
              className="min-h-72 bg-cover bg-center"
              style={{ backgroundImage: `url('${IMAGES.repayment}')` }}
            />
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700 mb-5 w-fit">
                <Receipt className="w-6 h-6" />
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-3">
                ការសងងាយស្រួលតាម QR
              </h3>
              <p className="text-gray-600 leading-7 mb-5">
                សងឥណទានរបស់អ្នកតាមរយៈវិបផតថលសមាជិក។ ការសងនីមួយៗត្រូវការការបង់ប្រាក់
                តាម QR code ជាមួយការដាក់ភស្តុតាង។ ការផ្ទៀងផ្ទាត់ដោយអ្នកគ្រប់គ្រងក្នុងរយៈពេល ២៤ ម៉ោង។
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Clock className="w-4 h-4" />
                ការផ្ទៀងផ្ទាត់ក្នុងរយៈពេល ២៤ ម៉ោង
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Membership Section                                                  */
/* ------------------------------------------------------------------ */

function MembershipSection() {
  return (
    <div className="py-16 md:py-20 space-y-20">
      {/* Hero with image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">សមាជិកភាព</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-950 leading-[1.05]">
              ចូលរួមសហគមន៍សន្សំ។<br />
              <span className="text-blue-900">សន្សំ ខ្ចី រីកចម្រើនជាមួយគ្នា។</span>
            </h2>
            <p className="text-gray-600 leading-8 mt-5 text-lg">
              សមាជិកភាពគឺបើកចំហសម្រាប់អ្នកដែលមានអ្នកធានាដែលបានផ្ទៀងផ្ទាត់។
              ចូលរួមដើម្បីទទួលបានសេវាសន្សំ និង ឥណទានទាំងអស់របស់សន្សំ។
            </p>
          </div>
          <div
            className="aspect-[5/4] rounded-3xl bg-cover bg-center shadow-2xl shadow-blue-900/20"
            style={{ backgroundImage: `url('${IMAGES.membership}')` }}
          />
        </div>
      </section>

      {/* Two paths */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">ផ្លូវចូលរួម</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            ផ្លូវពីរដើម្បីក្លាយជាសមាជិក។
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              step: 'ក',
              title: 'តាមរយៈអ្នកធានា',
              desc: 'ឱ្យសមាជិកបច្ចុប្បន្នបន្ថែមអ្នកជាការណែនាំរបស់ពួកគេ បន្ទាប់មកស្នើសុំការផ្ទៀងផ្ទាត់។',
              icon: UserPlus,
              tone: 'bg-blue-950 text-white',
              accent: 'text-blue-100',
            },
            {
              step: 'ខ',
              title: 'ដាក់ពាក្យដោយផ្ទាល់',
              desc: 'ដាក់ពាក្យសុំសមាជិក ផ្ទុកអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសារ និង រង់ចាំការអនុម័ត។',
              icon: Sparkles,
              tone: 'bg-white ring-1 ring-slate-200',
              accent: 'text-gray-600',
            },
          ].map((path) => {
            const Icon = path.icon
            return (
              <div key={path.step} className={`relative overflow-hidden rounded-3xl p-7 md:p-8 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all ${path.tone}`}>
                <div className="flex items-start gap-5">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-extrabold ${path.tone === 'bg-blue-950 text-white' ? 'bg-white/10 ring-1 ring-white/15' : 'bg-blue-50 text-blue-900 ring-1 ring-blue-100'}`}>
                    {path.step}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${path.tone === 'bg-blue-950 text-white' ? 'text-blue-200' : 'text-blue-700'}`} />
                      <p className={`text-xs font-semibold uppercase tracking-wide ${path.accent}`}>ផ្លូវ {path.step}</p>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{path.title}</h3>
                    <p className={`text-sm leading-7 ${path.accent}`}>{path.desc}</p>
                  </div>
                </div>
                <Link
                  href="/register"
                  className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${path.tone === 'bg-blue-950 text-white' ? 'text-white hover:text-blue-200' : 'text-blue-900 hover:text-blue-700'}`}
                >
                  ចាប់ផ្តើមដំណើរការ <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Withdrawal window */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-amber-50 ring-1 ring-amber-200 p-8 md:p-10">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
            <div>
              <span className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-700 mb-5">
                <Calendar className="w-6 h-6" />
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-amber-950 mb-3">
                អំឡុងពេលដកដើមទុនប្រចាំឆ្នាំ
              </h3>
              <p className="text-amber-900/85 leading-7">
                សមាជិកអាចស្នើសុំដកដើមទុន និង បញ្ចប់សមាជិកភាព។ ការដកដើមទុនត្រូវបាន
                ដំណើរការតែម្តងក្នុងមួយឆ្នាំក្នុងអំឡុង <strong>ថ្ងៃ ២០-២៥ មករា</strong>។
              </p>
            </div>
            <div className="rounded-2xl bg-white ring-1 ring-amber-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-4">ដំណើរការដក</p>
              <ol className="space-y-3">
                {[
                  'ដាក់ពាក្យសុំដើមទុនតាមរយៈវិបផតថលសមាជិក',
                  'បំពេញបែបបទដកជាមួយចំនួនទឹកប្រាក់',
                  'ទទួលការជូនដំណឹងពីការអនុម័ត (ថ្ងៃ ២០-២៥ មករា)',
                  'ជ្រើសរើសបន្តសន្សំ ឬ បញ្ចប់សមាជិកភាព',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide mb-3">សរុបអត្ថប្រយោជន៍</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            អ្វីដែលអ្នកទទួលបានជាសមាជិក។
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: PiggyBank, label: 'ការសន្សំប្រចាំខែ', value: 'ការប្រាក់ ៣%' },
            { icon: CreditCard, label: 'ឥណទាន', value: 'ចាប់ពី ១%/ខែ' },
            { icon: Send, label: 'របាយការណ៍', value: 'តាមរយៈ Telegram' },
            { icon: Wallet, label: 'អភិបាលកិច្ច', value: 'ការបោះឆ្នោតសមាជិក' },
          ].map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.label} className="group rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:ring-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all">
                <Icon className="w-6 h-6 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-gray-950 text-sm">{benefit.label}</p>
                <p className="text-blue-700 text-sm mt-1 font-semibold">{benefit.value}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CTA Footer                                                          */
/* ------------------------------------------------------------------ */

function CTAFooter() {
  return (
    <section className="relative overflow-hidden bg-blue-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${IMAGES.cta}')` }}
      />
      <div className="absolute inset-0 bg-blue-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.25),transparent_45%)]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
          ត្រៀមរួចហើយដើម្បីចូលរួមជាមួយសន្សំ?
        </h2>
        <p className="text-blue-100 leading-8 mb-9 max-w-2xl mx-auto">
          ចាប់ផ្តើមដំណើររបស់អ្នកឆ្ពោះទៅរកសុខុមាលភាពហិរញ្ញវត្ថុល្អប្រសើរថ្ងៃនេះ។
          ការចុះឈ្មោះត្រូវការត្រឹមតែប៉ុន្មាននាទីប៉ុណ្ណោះ។
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-900 px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            ចុះឈ្មោះឥឡូវនេះ <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-white/40 bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur"
          >
            ចូលគណនីសមាជិក
          </Link>
        </div>
      </div>
    </section>
  )
}
