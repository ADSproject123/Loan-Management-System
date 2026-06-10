import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AboutSectionNav } from './AboutSectionNav'
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

const SECTION_STACK = 'space-y-12'
const PAGE_SECTION = 'scroll-mt-28'
const GRID_GAP = 'gap-8'
const GRID_GAP_MD = 'gap-6'
const GRID_GAP_SM = 'gap-4'
const CARD_PAD = 'p-6 md:p-8'

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-700 text-sm font-bold uppercase tracking-wide mb-2">{children}</p>
  )
}

function SectionBlockHeader({ label, title }: { label: string; title?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <SectionEyebrow>{label}</SectionEyebrow>
      {title && (
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
          {title}
        </h2>
      )}
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="font-khmer min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-8 md:pb-12">
        <div className="w-full rounded-xl border border-gray-300 bg-white shadow-sm">
          <AboutSectionNav />
          <div className="space-y-16 p-4 sm:p-6 md:p-8">
            <div id="vision" className={PAGE_SECTION}>
              <ScrollReveal animation="fade-up">
                <SectionEyebrow>ចក្ខុវិស័យ និង បេសកកម្ម</SectionEyebrow>
              </ScrollReveal>
              <VisionSection />
            </div>
            <div id="saving-benefits" className={`border-t border-gray-200 pt-16 ${PAGE_SECTION}`}>
              <ScrollReveal animation="fade-up">
                <SectionEyebrow>អត្ថប្រយោជន៍សន្សំ</SectionEyebrow>
              </ScrollReveal>
              <SavingsSection />
            </div>
            <div id="member-loans" className={`border-t border-gray-200 pt-16 ${PAGE_SECTION}`}>
              <ScrollReveal animation="fade-up">
                <SectionEyebrow>កម្ជីសមាជិក</SectionEyebrow>
              </ScrollReveal>
              <LoansSection />
            </div>
            <div id="membership" className={`border-t border-gray-200 pt-16 ${PAGE_SECTION}`}>
              <ScrollReveal animation="fade-up">
                <SectionEyebrow>ចូលជាសមាជិក</SectionEyebrow>
              </ScrollReveal>
              <MembershipSection />
            </div>
          </div>
        </div>
      </div>

      <CTAFooter />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vision Section                                                      */
/* ------------------------------------------------------------------ */

function VisionSection() {
  return (
    <div className={SECTION_STACK}>
      <ScrollReveal animation="fade-up">
      <section className="w-full">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
          សហករណ៍ហិរញ្ញវត្ថុដែលផ្លាស់ប្តូរជីវិតគ្រួសារទាំងមូល។
        </h2>
        <p className="mt-4 text-gray-600 text-lg leading-7">
          យើងស្រមៃឃើញសហគមន៍មួយដែលសមាជិកគ្រប់រូបមានឧបករណ៍ហិរញ្ញវត្ថុ និង ការគាំទ្រ
          ដែលត្រូវការដើម្បីសម្រេចគោលដៅផ្ទាល់ខ្លួន និង គ្រួសារ ដោយគ្មានការផ្តល់ប្រាក់កម្ចី
          ដែលត្រាច់ចរ និង អសន្តិសុខហិរញ្ញវត្ថុ។
        </p>
        <div className={`mt-6 grid sm:grid-cols-2 lg:grid-cols-4 ${GRID_GAP_SM}`}>
          {[
            { icon: ShieldCheck, label: 'តម្លាភាពពេញលេញ' },
            { icon: Users, label: 'អភិបាលដោយសមាជិក' },
            { icon: TrendingUp, label: 'រីកចម្រើនប្រកបដោយចីរភាព' },
            { icon: Heart, label: 'ជំរុញដោយសហគមន៍' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-brand-50/60 ring-1 ring-brand-100 px-4 py-3">
                <Icon className="h-4 w-4 text-brand-700 shrink-0" />
                <span className="text-sm font-semibold text-brand-950">{item.label}</span>
              </div>
            )
          })}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`rounded-3xl bg-brand-950 ${CARD_PAD} text-white shadow-2xl shadow-brand-900/30 overflow-hidden relative`}>
          <div className={`relative grid lg:grid-cols-[1fr_1.4fr] ${GRID_GAP} items-start`}>
            <div>
              <span className="inline-flex rounded-xl bg-white/10 ring-1 ring-white/15 p-3 mb-4">
                <Target className="w-7 h-7 text-brand-100" />
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">បេសកកម្មរបស់យើង</h2>
              <p className="mt-4 text-brand-100 leading-7">
                សន្សំមានគោលបំណងលើកកម្ពស់សុខុមាលភាពហិរញ្ញវត្ថុក្នុងចំណោមសមាជិករបស់យើង
                តាមរយៈការផ្តល់ជូននូវឱកាស និង ការគាំទ្រ៖
              </p>
            </div>
            <ul className={`grid sm:grid-cols-2 ${GRID_GAP_SM}`}>
              {[
                'វេទិកាសន្សំសហការដែលមានសុវត្ថិភាព និង តម្លាភាព',
                'កម្ជីដែលយុត្តិធម៌ និង ងាយស្រួលសម្រាប់សេចក្តីត្រូវការសមាជិក',
                'អប់រំហិរញ្ញវត្ថុ និង គ្រប់គ្រងលុយដោយទំនួលខុសត្រូវ',
                'អភិបាលកិច្ចដែលជំរុញដោយសហគមន៍ដែលសមាជិកមានសំឡេង',
                'ការគាំទ្រសមាជិកក្នុងពេលអាសន្នហិរញ្ញវត្ថុ',
                'ទិន្នន័យហិរញ្ញវត្ថុលម្អិតភ្លាមៗតាមរយៈ Telegram',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  <span className="text-sm leading-6 text-brand-50">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section className="w-full">
        <SectionEyebrow>តម្លៃរបស់យើង</SectionEyebrow>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
          គោលការណ៍បីដែលដឹកនាំការងាររបស់យើងប្រចាំថ្ងៃ។
        </h2>
        <div className={`mt-6 grid md:grid-cols-3 ${GRID_GAP_MD}`}>
          {[
            {
              icon: Eye,
              title: 'តម្លាភាព',
              description: 'ប្រតិបត្តិការហិរញ្ញវត្ថុទាំងអស់គឺបើកចំហ និង ទទួលខុសត្រូវចំពោះសមាជិកគ្រប់រូប។',
              accent: 'bg-brand-600',
            },
            {
              icon: Users,
              title: 'សហគមន៍',
              description: 'យើងរីកចម្រើនជាមួយគ្នា។ ភាពជោគជ័យរបស់សមាជិកម្នាក់ពង្រឹងសហករណ៍ទាំងមូល។',
              accent: 'bg-emerald-600',
            },
            {
              icon: Shield,
              title: 'សុចរិតភាព',
              description: 'យើងប្រតិបត្តិតាមស្តង់ដារក្រមសីលធម៌ខ្ពស់បំផុតក្នុងគ្រប់ការងារ និង ទំនាក់ទំនងសមាជិក។',
              accent: 'bg-purple-600',
            },
          ].map((value) => {
            const Icon = value.icon
            return (
              <div key={value.title} className={`group relative rounded-3xl bg-white ${CARD_PAD} shadow-sm ring-1 ring-slate-200 hover:shadow-xl hover:shadow-brand-900/10 hover:-translate-y-1 transition-all overflow-hidden`}>
                <div className={`absolute top-0 inset-x-0 h-1 ${value.accent}`} />
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${value.accent} text-white shadow-md mb-4`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-bold text-gray-950 mb-2">{value.title}</h3>
                <p className="text-gray-600 leading-7 text-sm">{value.description}</p>
              </div>
            )
          })}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`grid lg:grid-cols-2 ${GRID_GAP} items-stretch`}>
          <ScrollReveal animation="fade-right" delay={120}>
          <div className={`rounded-3xl bg-white ring-1 ring-slate-200 ${CARD_PAD} shadow-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-7 h-7 text-brand-900" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-950">សមាគមន៏សន្សំ</h2>
            </div>
            <p className="mb-6 text-gray-600 leading-7">
              បង្កើតឡើងដោយសមាជិកសម្រាប់សមាជិក សន្សំបានរីកចម្រើនពីក្រុមសន្សំតូចមួយទៅជា
              សហករណ៍ដ៏រីកចម្រើនដែលមានសមាជិកសកម្មរាប់រយនាក់។ យើងគ្រប់គ្រងដោយតំណាង
              ដែលត្រូវបានជ្រើសរើស និង ប្រតិបត្តិដើម្បីផលប្រយោជន៍សមាជិកទាំងអស់ មិនមែនសម្រាប់ប្រាក់ចំណេញឡើយ។
            </p>
            <div className={`grid sm:grid-cols-3 ${GRID_GAP_SM}`}>
              {[
                { icon: Users, label: 'គ្រប់គ្រងដោយសមាជិក', sub: 'អភិបាលប្រជាធិបតេយ្យ' },
                { icon: Shield, label: 'សុវត្ថិភាព', sub: 'ការសន្សំការពារ' },
                { icon: TrendingUp, label: 'រីកចម្រើន', sub: 'ឆ្នាំទៅឆ្នាំ' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-2xl bg-background ring-1 ring-slate-200/70 p-4">
                    <Icon className="w-5 h-5 text-brand-700 mb-2" />
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" delay={180}>
          <div className={`rounded-3xl bg-brand-950 ${CARD_PAD} text-white shadow-xl shadow-brand-900/20`}>
            <Quote className="mb-4 h-8 w-8 text-brand-200/80" />
            <p className="text-lg leading-7 font-medium">
              &ldquo;សន្សំជួយយើងសន្សំបានទៀងទាត់ និង ងាយស្រួល ខ្ចីប្រាក់សម្រាប់
              ហុចគ្រួសារនៅពេលត្រូវការ ដោយគ្មានភាពតានតឹង។&rdquo;
            </p>
            <p className="mt-4 text-sm text-brand-200">— សមាជិកសន្សំ ដែលបានចូលរួមតាំងពីឆ្នាំ ២០២៣</p>
          </div>
          </ScrollReveal>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Savings Section                                                     */
/* ------------------------------------------------------------------ */

function SavingsSection() {
  return (
    <div className={SECTION_STACK}>
      <ScrollReveal animation="fade-up">
      <section className="w-full">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
          ការសន្សំរបស់អ្នករកបាន<br />
          <span className="text-brand-900">៣% ប្រចាំខែ</span> ដោយស្វ័យប្រវត្តិ។
        </h2>
        <p className="mt-4 text-gray-600 text-lg leading-7">
          រាល់បាតដែលអ្នកសន្សំរួមចំណែកដល់កម្លាំងសមូហភាពរបស់សន្សំ។ ការប្រាក់ត្រូវបានឥណពន្ធ
          ដោយស្វ័យប្រវត្តិនៅចុងខែនីមួយៗលើសមតុល្យសន្សំសរុបរបស់អ្នក។
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/savings/add"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-950 text-white px-5 py-3 text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            ចាប់ផ្តើមសន្សំ
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-900 hover:border-brand-200 transition-colors"
          >
            ក្លាយជាសមាជិក
          </Link>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`grid md:grid-cols-3 ${GRID_GAP_MD}`}>
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
          ].map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <ScrollReveal key={benefit.title} animation="fade-up" delay={index * 90}>
              <div
                className={`relative rounded-3xl ${CARD_PAD} transition-all h-full ${
                  benefit.highlight
                    ? 'bg-brand-950 text-white shadow-xl shadow-brand-900/30 -translate-y-2'
                    : 'bg-white text-gray-950 ring-1 ring-slate-200 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {benefit.highlight && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">
                    <Sparkles className="h-3 w-3" /> ពេញនិយម
                  </span>
                )}
                <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  benefit.highlight ? 'bg-white/10 ring-1 ring-white/15' : 'bg-brand-50 text-brand-700'
                }`}>
                  <Icon className={`h-6 w-6 ${benefit.highlight ? 'text-brand-100' : ''}`} />
                </span>
                <h3 className="mb-2 text-xl font-bold">{benefit.title}</h3>
                <p className={`text-sm leading-7 ${benefit.highlight ? 'text-brand-100' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <SectionBlockHeader
          label="របៀបដែលការសន្សំដំណើរការ"
        />
        <div className="relative">
          <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-brand-300" />
          <div className={`relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 ${GRID_GAP_MD}`}>
            {[
              { step: '១', title: 'ចូលគណនី', description: 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណរបស់អ្នក' },
              { step: '២', title: 'បញ្ចូលចំនួន', description: 'ជ្រើសរើសចំនួនទឹកប្រាក់សន្សំ' },
              { step: '៣', title: 'ស្កេន QR', description: 'ផ្ទេរទៅគណនីសហករណ៍' },
              { step: '៤', title: 'ដាក់ភស្តុតាង', description: 'ផ្ទុករូបបញ្ជាក់ការផ្ទេរ' },
              { step: '៥', title: 'ការបញ្ជាក់', description: 'ការផ្ទៀងផ្ទាត់ដោយអ្នកគ្រប់គ្រង' },
            ].map((s, index) => (
              <ScrollReveal key={s.step} animation="fade-up" delay={index * 70}>
              <div className="relative bg-white rounded-2xl ring-1 ring-slate-200 p-5 shadow-sm h-full">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-950 text-white text-lg font-bold shadow-lg shadow-brand-900/30 mb-4 ring-4 ring-white">
                  {s.step}
                </div>
                <p className="font-bold text-gray-950">{s.title}</p>
                <p className="text-gray-500 text-sm mt-1.5 leading-6">{s.description}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="scale" delay={80}>
      <section>
        <div className={`rounded-3xl bg-emerald-50 ring-1 ring-emerald-200 ${CARD_PAD}`}>
          <div className={`grid lg:grid-cols-[1fr_1.2fr] ${GRID_GAP} items-center`}>
            <div>
              <span className="mb-4 inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <Send className="w-6 h-6" />
              </span>
              <h3 className="mb-2 text-2xl md:text-3xl font-extrabold text-emerald-950">
                របាយការណ៍សន្សំភ្លាមៗតាម Telegram
              </h3>
              <p className="text-emerald-900/85 leading-7">
                សុំរបាយការណ៍សន្សំសម្រាប់រយៈពេលណាមួយដោយផ្ទាល់ពីវិបផតថលសមាជិក។
                របាយការណ៍ត្រូវបានផ្ញើភ្លាមៗទៅគណនី Telegram របស់អ្នក។
              </p>
            </div>
            <div className="rounded-2xl bg-white ring-1 ring-emerald-200 p-5 md:p-6 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-emerald-700">របាយការណ៍រួមមាន</p>
              <ul className="space-y-4">
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
      </ScrollReveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Loans Section                                                       */
/* ------------------------------------------------------------------ */

function LoansSection() {
  return (
    <div className={SECTION_STACK}>
      <ScrollReveal animation="fade-up">
      <section className="space-y-8">
        <div>
          <h2 className="mt-4 text-gray-600 text-lg leading-7">
            ទទួលបានកម្ជីដែលរចនាឡើងសម្រាប់សេចក្តីត្រូវការសមាជិក។ ដំណើរការត្រង់
            ការផ្ទៀងផ្ទាត់អ្នកធានា និង ការទទួលយកលឿន។
          </h2>         
        </div>

        <div className={`grid md:grid-cols-3 ${GRID_GAP_MD}`}>
          {[
            { label: 'រយៈពេលអតិបរមា', value: '២៤', sub: 'ខែ', tone: 'bg-brand-950' },
            { label: 'ការទទួលយក', value: '១-៣', sub: 'ថ្ងៃ', tone: 'bg-brand-700' },
            { label: 'អ្នកធានា', value: '១', sub: 'សមាជិកសកម្ម', tone: 'bg-brand-600' },
          ].map((item, index) => (
            <ScrollReveal key={item.label} animation="fade-up" delay={index * 90}>
            <div className={`relative overflow-hidden ${item.tone} text-white rounded-3xl ${CARD_PAD} shadow-lg shadow-brand-900/20 h-full`}>
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <p className="relative text-xs uppercase tracking-wide text-brand-200 font-semibold">{item.label}</p>
              <p className="relative text-5xl md:text-6xl font-extrabold mt-3">{item.value}</p>
              <p className="relative text-brand-200 mt-1 text-sm">{item.sub}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`rounded-3xl bg-white ring-1 ring-slate-200 ${CARD_PAD} shadow-sm`}>
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-950">លក្ខខណ្ឌសិទ្ធិទទួលបានកម្ជី</h3>
              <p className="text-sm text-gray-500">ត្រូវបំពេញលក្ខខណ្ឌខាងក្រោមដើម្បីដាក់ពាក្យសុំ</p>
            </div>
          </div>
          <div className={`grid sm:grid-cols-2 ${GRID_GAP_SM}`}>
            {[
              'ត្រូវតែជាសមាជិកសកម្មរបស់សន្សំ',
              'ចូលជាសមាជិកមានស្ថានភាពល្អយ៉ាងតិច ៣ ខែ',
              'ត្រូវការអ្នកធានាដែលបានផ្ទៀងផ្ទាត់ (សមាជិកសន្សំ)',
              'ចំនួនកម្ជីអតិបរមាផ្អែកលើសមតុល្យសន្សំ',
              'គ្មានកម្ជីដែលមិនទាន់សងនៅឡើយ',
              'ត្រូវដាក់ឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃ',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 rounded-2xl bg-background ring-1 ring-slate-200/70 p-4">
                <CheckCircle className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
                <span className="text-gray-800 text-sm leading-6">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <SectionBlockHeader
          label="ដំណើរការដាក់ពាក្យ"
          title="៦ ជំហានពីការដាក់ពាក្យដល់ការទទួលប្រាក់។"
        />
        <div className={`grid md:grid-cols-2 ${GRID_GAP_MD}`}>
          {[
            { step: '១', title: 'ដាក់ពាក្យសុំកម្ជី', description: 'បំពេញពាក្យសុំជាមួយចំនួន គោលបំណង និង រយៈពេល។' },
            { step: '២', title: 'ផ្ទុកឯកសារគាំទ្រ', description: 'ផ្តល់ឯកសារដែលត្រូវការដើម្បីគាំទ្រពាក្យសុំ។' },
            { step: '៣', title: 'ការផ្ទៀងផ្ទាត់អ្នកធានា', description: 'អ្នកធានាដែលអ្នកកំណត់ត្រូវផ្ទៀងផ្ទាត់ និង ទទួលយក។' },
            { step: '៤', title: 'ការត្រួតពិនិត្យ', description: 'គណៈកម្មាធិការសន្សំត្រួតពិនិត្យក្នុងរយៈពេល ១-៣ ថ្ងៃ។' },
            { step: '៥', title: 'ដាក់ឯកសារច្បាប់ដើម', description: 'ប្រគល់ឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃទៅសហករណ៍។' },
            { step: '៦', title: 'បើកប្រាក់កម្ជី', description: 'ចំនួនកម្ជីដែលទទួលយកត្រូវផ្ទេរទៅគណនីរបស់អ្នក។' },
          ].map((s, index) => (
            <ScrollReveal key={s.step} animation="fade-up" delay={index * 60}>
            <div className="flex gap-5 rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:shadow-md transition-shadow h-full">
              <div className="shrink-0">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-900 text-lg font-extrabold ring-1 ring-brand-100">
                  {s.step}
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-950">{s.title}</p>
                <p className="text-gray-600 text-sm mt-1.5 leading-6">{s.description}</p>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm ${CARD_PAD}`}>
          <span className="mb-4 inline-flex w-fit rounded-xl bg-brand-50 p-3 text-brand-700">
            <Receipt className="w-6 h-6" />
          </span>
          <h3 className="mb-2 text-2xl md:text-3xl font-extrabold text-gray-950">
            ការសងងាយស្រួលតាម QR
          </h3>
          <p className="mb-4 text-gray-600 leading-7">
            សងកម្ជីរបស់អ្នកតាមរយៈវិបផតថលសមាជិក។ ការសងនីមួយៗត្រូវការការបង់ប្រាក់
            តាម QR code ជាមួយការដាក់ភស្តុតាង។ ការផ្ទៀងផ្ទាត់ដោយអ្នកគ្រប់គ្រងក្នុងរយៈពេល ២៤ ម៉ោង។
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <Clock className="w-4 h-4" />
            ការផ្ទៀងផ្ទាត់ក្នុងរយៈពេល ២៤ ម៉ោង
          </div>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Membership Section                                                  */
/* ------------------------------------------------------------------ */

function MembershipSection() {
  return (
    <div className={SECTION_STACK}>
      <ScrollReveal animation="fade-up">
      <section className="w-full">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 leading-tight">
          ចូលរួមសហគមន៍សន្សំ
        </h2>
        <p className="mt-4 text-gray-600 text-lg leading-7">
          ចូលជាសមាជិកគឺបើកចំហសម្រាប់អ្នកដែលមានអ្នកធានាដែលបានផ្ទៀងផ្ទាត់។
          ចូលរួមដើម្បីទទួលបានសេវាសន្សំ និង កម្ជីទាំងអស់របស់សន្សំ។
        </p>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <SectionBlockHeader
          label="ផ្លូវចូលរួម"
          title="ផ្លូវពីរដើម្បីក្លាយជាសមាជិក។"
        />
        <div className={`grid md:grid-cols-2 ${GRID_GAP_MD}`}>
          {[
            {
              title: 'តាមរយៈអ្នកធានា',
              desc: 'ឱ្យសមាជិកបច្ចុប្បន្នបន្ថែមអ្នកជាការណែនាំរបស់ពួកគេ បន្ទាប់មកស្នើសុំការផ្ទៀងផ្ទាត់។',
              icon: UserPlus,
              tone: 'bg-brand-950 text-white',
              accent: 'text-brand-100',
            },
            {
              title: 'ដាក់ពាក្យដោយផ្ទាល់',
              desc: 'ដាក់ពាក្យសុំសមាជិក ផ្ទុកអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសារ និង រង់ចាំការទទួលយក។',
              icon: Sparkles,
              tone: 'bg-white ring-1 ring-slate-200',
              accent: 'text-gray-600',
            },
          ].map((path, index) => {
            const Icon = path.icon
            return (
              <ScrollReveal key={path.title} animation={index === 0 ? 'fade-right' : 'fade-left'} delay={120}>
              <div className={`relative overflow-hidden rounded-3xl ${CARD_PAD} shadow-sm hover:shadow-xl hover:shadow-brand-900/10 transition-all h-full ${path.tone}`}>
                <div className="flex items-start gap-5">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{path.title}</h3>
                    <p className={`text-sm leading-7 ${path.accent}`}>{path.desc}</p>
                  </div>
                </div>
                <Link
                  href="/register"
                  className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${path.tone === 'bg-brand-950 text-white' ? 'text-white hover:text-brand-200' : 'text-brand-900 hover:text-brand-700'}`}
                >
                  ចាប់ផ្តើមដំណើរការ <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <div className={`rounded-3xl bg-amber-50 ring-1 ring-amber-200 ${CARD_PAD}`}>
          <div className={`grid lg:grid-cols-[0.85fr_1.15fr] ${GRID_GAP} items-start`}>
            <div>
              <span className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
                <Calendar className="w-6 h-6" />
              </span>
              <h3 className="mb-2 text-2xl md:text-3xl font-extrabold text-amber-950">
                អំឡុងពេលដកដើមទុនប្រចាំឆ្នាំ
              </h3>
              <p className="text-amber-900/85 leading-7">
                សមាជិកអាចស្នើសុំដកដើមទុន និង បញ្ចប់ចូលជាសមាជិក។ ការដកដើមទុនត្រូវបាន
                ដំណើរការតែម្តងក្នុងមួយឆ្នាំក្នុងអំឡុង <strong>ថ្ងៃ ២០-២៥ មករា</strong>។
              </p>
            </div>
            <div className="rounded-2xl bg-white ring-1 ring-amber-200 p-5 md:p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-amber-700">ដំណើរការដក</p>
              <ol className="space-y-4">
                {[
                  'ដាក់ពាក្យសុំដើមទុនតាមរយៈវិបផតថលសមាជិក',
                  'បំពេញបែបបទដកជាមួយចំនួនទឹកប្រាក់',
                  'ទទួលការជូនដំណឹងពីការទទួលយក (ថ្ងៃ ២០-២៥ មករា)',
                  'ជ្រើសរើសបន្តសន្សំ ឬ បញ្ចប់ចូលជាសមាជិក',
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
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={80}>
      <section>
        <SectionBlockHeader
          label="សរុបអត្ថប្រយោជន៍"
          title="អ្វីដែលអ្នកទទួលបានជាសមាជិក។"
        />
        <div className={`grid sm:grid-cols-2 md:grid-cols-4 ${GRID_GAP_SM}`}>
          {[
            { icon: PiggyBank, label: 'ការសន្សំប្រចាំខែ', value: 'ការប្រាក់ ៣%' },
            { icon: CreditCard, label: 'កម្ជី', value: 'ចាប់ពី ១%/ខែ' },
            { icon: Send, label: 'របាយការណ៍', value: 'តាមរយៈ Telegram' },
            { icon: Wallet, label: 'អភិបាលកិច្ច', value: 'ការបោះឆ្នោតសមាជិក' },
          ].map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <ScrollReveal key={benefit.label} animation="fade-up" delay={index * 70}>
              <div className="group rounded-2xl bg-white ring-1 ring-slate-200 p-5 hover:ring-brand-200 hover:shadow-lg hover:shadow-brand-900/5 transition-all h-full">
                <Icon className="mb-4 h-6 w-6 text-brand-900 transition-transform group-hover:scale-110" />
                <p className="font-bold text-gray-950 text-sm">{benefit.label}</p>
                <p className="text-brand-700 text-sm mt-1 font-semibold">{benefit.value}</p>
              </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CTA Footer                                                          */
/* ------------------------------------------------------------------ */

function CTAFooter() {
  return (
    <section className="bg-brand-950 text-white">
      <ScrollReveal animation="scale" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
          ត្រៀមរួចហើយដើម្បីចូលរួមជាមួយសន្សំ?
        </h2>
        <p className="text-brand-100 leading-8 mb-9 max-w-2xl mx-auto">
          ចាប់ផ្តើមដំណើររបស់អ្នកឆ្ពោះទៅរកសុខុមាលភាពហិរញ្ញវត្ថុល្អប្រសើរថ្ងៃនេះ។
          ការចុះឈ្មោះត្រូវការត្រឹមតែប៉ុន្មាននាទីប៉ុណ្ណោះ។
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-900 px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
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
      </ScrollReveal>
    </section>
  )
}
