import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
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
  UserPlus,
  LogOut,
  Percent,
} from 'lucide-react'
import { getInterestSettings } from '@/lib/interest'
import { LOAN_TO_SAVINGS_MULTIPLIER } from '@/lib/loanEligibility'

const ABOUT_NAV = [
  { href: '#vision-mission', label: 'ចក្ខុវិស័យ និង បេសកកម្ម' },
  { href: '#membership', label: 'សមាជិកភាព' },
  { href: '#saving-benefits', label: 'អត្ថប្រយោជន៍សន្សំ' },
  { href: '#loan-rates', label: 'អត្រាកម្ជី' },
] as const

export default async function HomePage() {
  const interestSettings = await getInterestSettings()
  const { monthlySavingInterestRate, monthlyLoanInterestRate } = interestSettings

  return (
    <div className="font-khmer min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative min-h-screen overflow-hidden bg-brand-950 text-white flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/home-hero-cooperative.jpg')" }}
        />
        <div className="absolute inset-0 bg-brand-950/88" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <ScrollReveal animation="fade-up" delay={0}>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
                  ចូលសហគមន៍សន្សំដើម្បីទទួលបានការសន្សំ និង កម្ជីដែលមានតម្លាភាព
                </h1>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={120}>
                <p className="text-brand-100 text-lg md:text-xl leading-8 max-w-2xl mb-8">
                  សន្សំជួយសមាជិកសន្សំទៀងទាត់ ស្នើសុំកម្ជីដោយតម្លាភាព និង គ្រប់គ្រងគ្រប់ជំហានតាមអនឡាញ
                  ជាមួយការផ្ទៀងផ្ទាត់ឯកសារ ភស្តុតាងបង់ប្រាក់ និង ការទទួលយកពីអ្នកគ្រប់គ្រង។
                </p>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={240}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-brand-950 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-brand-800 transition-colors"
                  >
                    ក្លាយជាសមាជិក
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="#about-sansam"
                    className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur"
                  >
                    អំពី SanSam
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal animation="fade-left" delay={180} className="relative">
              <div className="bg-white/10 p-6 md:p-8 text-white shadow-2xl shadow-brand-950/30 ring-1 ring-white/15 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/15 pb-5 mb-6">
                  <div>          
                    <p className="text-2xl font-bold mt-1">ផ្ទាំងគ្រប់គ្រងហិរញ្ញវត្ថុ</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Landmark className="w-7 h-7 text-brand-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'ការប្រាក់សន្សំ', value: `${monthlySavingInterestRate}%`, icon: TrendingUp },
                    { label: 'ការទទួលយកកម្ជី', value: '១-៣ថ្ងៃ', icon: CreditCard },
                    { label: 'របាយការណ៍', value: 'តេឡេក្រាម', icon: CheckCircle },
                    { label: 'ការដកដើមទុន', value: '២០-២៥ មករា', icon: Wallet },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-2xl bg-white/10 p-4">
                        <Icon className="w-5 h-5 text-brand-200 mb-4" />
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-brand-200 text-sm mt-1">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section id="about-sansam" className="py-16 md:py-24 bg-white border-y border-gray-100 scroll-mt-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-700 mb-3">About SanSam</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950 mb-4">
              អំពី SanSam
            </h2>
            <p className="text-gray-600 text-lg leading-7">
              ស្វែងយល់អំពីចក្ខុវិស័យ សមាជិកភាព អត្ថប្រយោជន៍សន្សំ និង អត្រាកម្ជី
              មុនពេលអ្នកចូលរួមជាសមាជិក។
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={80}>
            <nav
              aria-label="ផ្នែកអំពី SanSam"
              className="mb-14 flex flex-wrap items-center justify-center gap-2"
            >
              {ABOUT_NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </ScrollReveal>

          <div className="space-y-16 md:space-y-20">
            <div id="vision-mission" className="scroll-mt-28">
            <ScrollReveal animation="fade-up">
              <div className=" border border-gray-200 p-8 md:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="inline-flex shrink-0 rounded-2xl bg-brand-950 p-4 text-white">
                    <Eye className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-extrabold text-gray-950 mb-4">ចក្ខុវិស័យ និង បេសកកម្ម</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-brand-100 bg-white p-6">
                        <p className="text-sm font-bold uppercase tracking-wide text-brand-700 mb-2">ចក្ខុវិស័យ</p>
                        <p className="text-gray-600 leading-7">
                          កសាងសហករណ៍ដែលជឿទុកចិត្តបាន គ្រប់គ្រងដោយសមាជិក
                          ដើម្បីជួយគ្រួសារសន្សំ ខ្ចីដោយយុត្តិធម៌ និង រីកចម្រើនទៅជាមួយគ្នា។
                        </p>
                      </div>
                      <div className="rounded-2xl border border-brand-100 bg-white p-6">
                        <p className="text-sm font-bold uppercase tracking-wide text-brand-700 mb-2">បេសកកម្ម</p>
                        <p className="text-gray-600 leading-7">
                          ផ្តល់វិបផតថលសន្សំដែលមានតម្លាភាព ការផ្ទៀងផ្ទាត់ឯកសារ ភស្តុតាងបង់ប្រាក់
                          និង ការទទួលយកពីគណៈកម្មាធិការ ដើម្បីជួយសមាជិកគ្រប់គ្រងហិរញ្ញវត្ថុរបស់ខ្លួន។
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            </div>

            <div id="membership" className="scroll-mt-28">
            <ScrollReveal animation="fade-up">
              <div className="border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
                <div className="mb-8 flex items-center gap-4">
                  <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-800">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-950">សមាជិកភាព</h3>
                    <p className="mt-1 text-gray-600">ចូលជាសមាជិក ឬ ដកដើមទុនតាមលក្ខខណ្ឌរបស់សហករណ៍។</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="group rounded-2xl border border-gray-200 bg-brand-50/60 p-6 transition-all hover:border-brand-200 hover:shadow-md">
                    <div className="mb-4 inline-flex rounded-xl bg-white p-3 text-brand-800 shadow-sm">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-950 mb-2">ក្លាយជាសមាជិក</h4>
                    <p className="text-gray-600 text-sm leading-6 mb-5">
                      ចុះឈ្មោះតាមអនឡាញ ដាក់ព័ត៌មានផ្ទាល់ខ្លួន បន្ថែមអ្នកធានា ផ្ទុកឯកសារអត្តសញ្ញាណប័ណ្ណ
                      និង រង់ចាំការទទួលយកគណនីពីអ្នកគ្រប់គ្រង។
                    </p>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 text-sm font-bold text-brand-900 hover:text-brand-700"
                    >
                      ចាប់ផ្តើមចុះឈ្មោះ <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-md">
                    <div className="mb-4 inline-flex rounded-xl bg-amber-50 p-3 text-amber-800">
                      <LogOut className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-950 mb-2">ដកដើមទុនសមាជិកភាព</h4>
                    <p className="text-gray-600 text-sm leading-6 mb-5">
                      សមាជិកអាចស្នើសុំដកដើមទុនក្នុងអំឡុងពេលប្រចាំឆ្នាំ
                      ត្រូវបានទទួលយកតែចន្លោះថ្ងៃទី ២០-២៥ មករា។
                      អាចជ្រើសរើសដកដើមទុនរក្សាសមាជិកភាព ឬ បញ្ចប់ការចូលជាសមាជិក។
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-brand-900 hover:text-brand-700"
                    >
                      ចូលគណនីដើម្បីដាក់ស្នើ <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            </div>

            <div id="saving-benefits" className="scroll-mt-28">
            <ScrollReveal animation="fade-up">
              <div className="border border-gray-200 bg-brand-950 p-8 md:p-10 text-white shadow-xl shadow-brand-900/10">
                <div className="mb-8 flex items-center gap-4">
                  <div className="inline-flex rounded-2xl bg-white/10 p-3 text-brand-100">
                    <PiggyBank className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold">អត្ថប្រយោជន៍សន្សំ</h3>
                    <p className="mt-1 text-brand-100">អត្ថប្រយោជន៍ដែលសមាជិកទទួលបានពីការសន្សំទៀងទាត់។</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: TrendingUp,
                      title: `ការប្រាក់ ${monthlySavingInterestRate}% ក្នុងមួយខែ`,
                      text: 'ទទួលបានការប្រាក់លើសមតុល្យសន្សំផ្ទៀងផ្ទាត់របស់អ្នករៀងរាល់ខែ។',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'ការផ្ទៀងផ្ទាត់ដោយអ្នកគ្រប់គ្រង',
                      text: 'ការសន្សំទាំងអស់ត្រូវបានផ្ទៀងផ្ទាត់មុនពេលរាប់ចូលសមតុល្យសរុប។',
                    },
                    {
                      icon: CheckCircle,
                      title: 'របាយការណ៍សន្សំ',
                      text: 'សុំរបាយការណ៍សន្សំ និង ទទួលបានតាម Telegram នៅពេលអ្នកត្រូវការ។',
                    },
                    {
                      icon: HeartHandshake,
                      title: 'សហការជាមួយសមាជិក',
                      text: 'សន្សំជាសហករណ៍ដែលគ្រប់គ្រងដោយសមាជិក ដើម្បីផលប្រយោជន៍រួមគ្នា។',
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <Icon className="mb-3 h-5 w-5 text-brand-200" />
                        <p className="font-bold">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-brand-100">{item.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>
            </div>

            <div id="loan-rates" className="scroll-mt-28">
            <ScrollReveal animation="fade-up">
              <div className="border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
                <div className="mb-8 flex items-center gap-4">
                  <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-800">
                    <Percent className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-950">អត្រាកម្ជី</h3>
                    <p className="mt-1 text-gray-600">លក្ខខណ្ឌ និង អត្រាកម្ជីសម្រាប់សមាជិកដែលមានសមតុល្យសន្សំ។</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">ប្រភេទ</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">ព័ត៌មាន</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-5 py-4 font-semibold text-gray-700">អត្រាការប្រាក់កម្ជី</td>
                        <td className="px-5 py-4 font-bold tabular-nums text-gray-950">{monthlyLoanInterestRate}% ក្នុងមួយខែ</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-4 font-semibold text-gray-700">អតិបរមាកម្ជី</td>
                        <td className="px-5 py-4 text-gray-800">
                          រហូតដល់ <span className="font-bold">{LOAN_TO_SAVINGS_MULTIPLIER} ដង</span> នៃសមតុល្យសន្សំផ្ទៀងផ្ទាត់
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-4 font-semibold text-gray-700">អ្នកធានា</td>
                        <td className="px-5 py-4 text-gray-800">ត្រូវការអ្នកធានាដែលជាសមាជិកសកម្ម និង ការផ្ទៀងផ្ទាត់ពីគណៈកម្មាធិការ</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-4 font-semibold text-gray-700">រយៈពេលទទួលយក</td>
                        <td className="px-5 py-4 text-gray-800">ប្រហែល ១-៣ ថ្ងៃបន្ទាប់ពីពាក្យសុំត្រូវបានទទួលយក</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
                  >
                    ស្នើសុំកម្ជី <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:text-brand-900 transition-colors"
                  >
                    ចូលគណនីសមាជិក
                  </Link>
                </div>
              </div>
            </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[70vh] flex items-center overflow-hidden py-20 bg-brand-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/home-cta-finance.jpg')" }}
        />
        <div className="absolute inset-0 bg-brand-950/85" />
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal animation="scale">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              ត្រៀមរួចហើយដើម្បីចូលរួមជាមួយសន្សំ?
            </h2>
            <p className="text-brand-100 leading-7 mb-8">
              បង្កើតពាក្យសុំចូលជាសមាជិករបស់អ្នក ផ្ទុកឯកសារ ហើយក្រុមការងាររបស់យើងនឹងពិនិត្យ
              គណនីរបស់អ្នកមុនពេលអ្នកចាប់ផ្តើមសន្សំ ឬ ដាក់ពាក្យសុំកម្ជី។
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link href="/register" className="inline-flex items-center gap-2 bg-brand-950 text-white px-7 py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors">
                ក្លាយជាសមាជិក <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-800 px-7 py-3 rounded-xl font-semibold hover:border-brand-300 hover:text-brand-900 transition-colors">
                ចូលគណនីសមាជិក
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="bg-brand-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-in" className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Building2 className="w-6 h-6" />
              សមាគមន៏សន្សំ
            </div>
            <div className="flex gap-6 text-sm text-brand-200">
              <Link href="/register" className="hover:text-white transition-colors">ចូលរួមជាមួយយើង</Link>
              <Link href="/login" className="hover:text-white transition-colors">ចូលគណនីសមាជិក</Link>
            </div>
            <p className="text-brand-300 text-sm">&copy; ២០២៥ សន្សំ។ រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  )
}
