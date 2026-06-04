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
} from 'lucide-react'

export default function HomePage() {
  const aboutItems = [
    {
      icon: Eye,
      title: 'ចក្ខុវិស័យ និង បេសកកម្ម',
      description: 'កសាងសហករណ៍ដែលជឿទុកចិត្តបាន គ្រប់គ្រងដោយសមាជិក ដើម្បីជួយគ្រួសារសន្សំ ខ្ចីដោយយុត្តិធម៌ និង រីកចម្រើនទៅជាមួយគ្នា។',
    },
    {
      icon: Users,
      title: 'ចូលជាសមាជិក',
      description: 'ចូលរួមជាមួយអ្នកធានាដែលបានផ្ទៀងផ្ទាត់ ដាក់ឯកសារ ហើយចូលប្រើវិបផតថលសមាជិកសន្សំបន្ទាប់ពីការទទួលយក។',
    },
    {
      icon: PiggyBank,
      title: 'អត្ថប្រយោជន៍នៃការសន្សំ',
      description: 'បរិច្ចាគទៀងទាត់ទទួលបានចំណូលពីសហករណ៍ និង សុំរបាយការណ៍សន្សំនៅពេលអ្នកត្រូវការ។',
    },
    {
      icon: CreditCard,
      title: 'កម្ជីសមាជិក',
      description: 'ដាក់ពាក្យសុំកម្ជីជាសមាជិកដោយយុត្តិធម៌ ការផ្ទៀងផ្ទាត់អ្នកធានា និង ការទទួលយកពីគណៈកម្មាធិការ។',
    },
  ]

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
                    ស្វែងយល់អត្ថប្រយោជន៍
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal animation="fade-left" delay={180} className="relative">
              <div className="rounded-4xl bg-white/10 p-6 md:p-8 text-white shadow-2xl shadow-brand-950/30 ring-1 ring-white/15 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/15 pb-5 mb-6">
                  <div>
                    <p className="text-brand-200 text-sm">វិបផតថលសមាជិក</p>
                    <p className="text-2xl font-bold mt-1">ផ្ទាំងគ្រប់គ្រងហិរញ្ញវត្ថុ</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Landmark className="w-7 h-7 text-brand-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'ការប្រាក់សន្សំ', value: '៣%', icon: TrendingUp },
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

      <section id="about-sansam" className="min-h-screen flex items-center py-16 md:py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up" className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
              អ្វីៗដែលសមាជិកត្រូវយល់ដឹងមុនពេលចូលរួម។
            </h2>
            <p className="text-gray-600 mt-4 leading-7">
              ស្វែងយល់អំពីបេសកកម្ម ជម្រើសចូលជាសមាជិក អត្ថប្រយោជន៍សន្សំ កម្ជីសមាជិក និង
              ជម្រើសដកដើមទុនមុនបើកគណនីសមាជិករបស់អ្នក។
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
            <ScrollReveal animation="fade-right" className="h-full">
              <div
                className="h-full min-h-96 lg:min-h-0 rounded-3xl bg-cover bg-center shadow-xl shadow-brand-900/10 relative overflow-hidden"
                style={{ backgroundImage: "url('/home-about-community.jpg')" }}
              >
                <div className="absolute inset-0 bg-brand-950/75" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm font-semibold text-brand-100">ហិរញ្ញវត្ថុដែលផ្តោតលើសហគមន៍</p>
                  <p className="mt-2 text-2xl font-extrabold leading-tight">
                    សមាជិកសន្សំ ខ្ចី និង រីកចម្រើនជាមួយការគាំទ្រដ៏តម្លាភាព។
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-5">
              {aboutItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <ScrollReveal key={item.title} animation="fade-up" delay={index * 90}>
                    <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-brand-200 hover:shadow-lg transition-all h-full">
                      <div className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-800 mb-5 group-hover:bg-brand-950 group-hover:text-white transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-950 mb-3">{item.title}</h3>
                      <p className="text-gray-600 text-sm leading-6">{item.description}</p>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center py-16 md:py-20 bg-background">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <ScrollReveal animation="fade-right" className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm h-full">
              <div className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-800 mb-5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 mb-4">ចូលជាសមាជិក</h2>
              <p className="text-gray-600 leading-7 mb-6">
                ក្លាយជាសមាជិកដោយដាក់ព័ត៌មានរបស់អ្នក បន្ថែមអ្នកធានាប្រសិនបើមាន
                ហើយផ្ទុកឯកសារអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសារសម្រាប់ការត្រួតពិនិត្យ។
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-7">
                {[
                  { title: 'ក្លាយជាសមាជិក', text: 'ចុះឈ្មោះតាមអនឡាញ និង រង់ចាំការទទួលយកគណនី។' },
                  { title: 'ដកចូលជាសមាជិក', text: 'ស្នើសុំដកដើមទុនក្នុងអំឡុងពេលប្រចាំឆ្នាំ។' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-brand-50 p-5">
                    <p className="font-bold text-brand-950">{item.title}</p>
                    <p className="text-sm text-brand-800 mt-2 leading-6">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/register" className="inline-flex items-center gap-2 text-brand-900 font-bold hover:text-brand-700">
                ចាប់ផ្តើមចុះឈ្មោះសមាជិក <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>

            <ScrollReveal animation="fade-left" delay={120} className="rounded-3xl bg-brand-950 p-8 text-white shadow-xl shadow-brand-900/10 h-full">
              <div className="inline-flex rounded-xl bg-white/10 p-3 text-brand-100 mb-5">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">អត្ថប្រយោជន៍សន្សំ និង កម្ជី</h2>
              <p className="text-brand-100 leading-7 mb-6">
                សមាជិកអាចបន្ថែមការសន្សំ ដាក់ភស្តុតាងបង់ប្រាក់ ស្នើសុំកម្ជី
                សងវិញតាម QR និង សុំរបាយការណ៍ភ្លាមៗតាមរយៈវិបផតថល។
              </p>
              <div className="space-y-3">
                {[
                  { label: 'អត្ថប្រយោជន៍សន្សំ', value: 'ការប្រាក់ ៣% ក្នុងមួយខែ' },
                  { label: 'កម្ជីសមាជិក', value: 'ដាក់ស្នើ និង តាមដានតាមវិបផតថល' },
                  { label: 'របាយការណ៍', value: 'របាយការណ៍សន្សំ និង កម្ជី' },
                  { label: 'ការទទួលយក', value: 'ដំណើរការត្រួតពិនិត្យដោយអ្នកគ្រប់គ្រង' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
                    <span className="text-brand-200 text-sm">{item.label}</span>
                    <span className="font-semibold text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      <section className="relative min-h-screen flex items-center overflow-hidden py-20 bg-brand-950 text-white">
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
              <Link href="/about" className="hover:text-white transition-colors">អំពីយើង</Link>
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
