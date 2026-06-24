/**
 * Seed 10 active members — each with verified savings and an active loan.
 *
 * Usage:
 *   npm run seed:10
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * All accounts use password: Seed1234!
 * Emails: member01@seed10.savings.kh … member10@seed10.savings.kh
 * Re-running removes and recreates seed10 accounts.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SEED_PASSWORD = 'Seed1234!'
const SEED_EMAIL_DOMAIN = '@seed10.savings.kh'

function loadEnvFile(relativePath) {
  const filePath = resolve(process.cwd(), relativePath)
  if (!existsSync(filePath)) return

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function dateDaysAgo(days) {
  return daysAgo(days).slice(0, 10)
}

function monthStartMonthsAgo(months) {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - months)
  return date.toISOString().slice(0, 10)
}

const SEED_MEMBERS = [
  {
    key: 'm01',
    email: `member01${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'គឹម សុខា',
    full_name_en: 'Kim Sokha',
    phone: '012100001',
    date_of_birth: '1990-03-15',
    address: 'ផ្ទះលេខ ១២ ផ្លូវ ២៧១ ភ្នំពេញ',
    id_number: '010390015',
    resident_book_number: 'PP-012271',
    joined_days_ago: 365,
    savings: [500, 450, 400],
    loan: { amount: 1800, term_months: 12, purpose: 'ពង្រីកហាងទំនិញ', disbursed_days_ago: 120 },
  },
  {
    key: 'm02',
    email: `member02${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'ហេង ដារ៉ា',
    full_name_en: 'Heng Dara',
    phone: '012100002',
    date_of_birth: '1988-07-22',
    address: 'ផ្ទះលេខ ៤៥ ផ្លូវ ៣១០ ខណ្ឌចំការមន',
    id_number: '010788022',
    resident_book_number: 'PP-045310',
    joined_days_ago: 340,
    savings: [600, 550],
    loan: { amount: 2200, term_months: 18, purpose: 'ទិញឧបករណ៍ការងារ', disbursed_days_ago: 90 },
  },
  {
    key: 'm03',
    email: `member03${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'អ៊ុំ បុប្ផា',
    full_name_en: 'Om Bopha',
    phone: '012100003',
    date_of_birth: '1985-11-08',
    address: 'ផ្ទះលេខ ៨៨ ផ្លូវ ៤៣៦ ខណ្ឌឫស្សីកែវ',
    id_number: '010585008',
    resident_book_number: 'PP-088436',
    joined_days_ago: 400,
    savings: [800, 700, 650],
    loan: { amount: 3000, term_months: 24, purpose: 'ជួសជុលផ្ទះ', disbursed_days_ago: 150 },
  },
  {
    key: 'm04',
    email: `member04${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'លី ចាន់',
    full_name_en: 'Ly Chann',
    phone: '012100004',
    date_of_birth: '1992-01-30',
    address: 'ផ្ទះលេខ ២១ ផ្លូវ ១៣៨ ខណ្ឌដូនពេញ',
    id_number: '010192030',
    resident_book_number: 'PP-021138',
    joined_days_ago: 280,
    savings: [400, 380],
    loan: { amount: 1500, term_months: 12, purpose: 'ថ្លៃសិក្សាកូន', disbursed_days_ago: 60 },
  },
  {
    key: 'm05',
    email: `member05${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'សារុន វណ្ណា',
    full_name_en: 'Sarun Vanna',
    phone: '012100005',
    date_of_birth: '1993-05-14',
    address: 'ផ្ទះលេខ ៣៣ ផ្លូវ ៤៧០ ខណ្ឌមានជ័យ',
    id_number: '010593014',
    resident_book_number: 'PP-033470',
    joined_days_ago: 260,
    savings: [550, 500, 480],
    loan: { amount: 2000, term_months: 15, purpose: 'ទិញម៉ូតូប្រើប្រាស់', disbursed_days_ago: 75 },
  },
  {
    key: 'm06',
    email: `member06${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'ផាន់ មាស',
    full_name_en: 'Phan Meas',
    phone: '012100006',
    date_of_birth: '1987-09-19',
    address: 'ផ្ទះលេខ ៥៦ ផ្លូវ ១៩៦ ខណ្ឌពោធិ៍សែនជ័យ',
    id_number: '010687019',
    resident_book_number: 'PP-056196',
    joined_days_ago: 310,
    savings: [700, 650],
    loan: { amount: 2500, term_months: 12, purpose: 'ពង្រីកអាជីវកម្មតូច', disbursed_days_ago: 100 },
  },
  {
    key: 'm07',
    email: `member07${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'ចន់ ស្រីពេញ',
    full_name_en: 'Chhorn Srey Pich',
    phone: '012100007',
    date_of_birth: '1994-12-03',
    address: 'ផ្ទះលេខ ៧១ ផ្លូវ ២២០ ភ្នំពេញ',
    id_number: '010494003',
    resident_book_number: 'PP-071220',
    joined_days_ago: 220,
    savings: [450, 420],
    loan: { amount: 1600, term_months: 10, purpose: 'ទិញសម្ភារៈហាង', disbursed_days_ago: 45 },
  },
  {
    key: 'm08',
    email: `member08${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'វង្ស ពិសាច',
    full_name_en: 'Vong Pisach',
    phone: '012100008',
    date_of_birth: '1991-06-27',
    address: 'ផ្ទះលេខ ៩០ ផ្លូវ ៣៣៣ ខណ្ឌឫស្សីកែវ',
    id_number: '010691027',
    resident_book_number: 'PP-090333',
    joined_days_ago: 200,
    savings: [900, 850],
    loan: { amount: 3500, term_months: 18, purpose: 'វិធានការកសិកម្ម', disbursed_days_ago: 130 },
  },
  {
    key: 'm09',
    email: `member09${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'រស់ សុភា',
    full_name_en: 'Ros Sophea',
    phone: '012100009',
    date_of_birth: '1989-04-11',
    address: 'ផ្ទះលេខ ១៥ ផ្លូវ ៥១៥ ខណ្ឌសែនសុខ',
    id_number: '010489011',
    resident_book_number: 'PP-015515',
    joined_days_ago: 180,
    savings: [350, 320, 300],
    loan: { amount: 1200, term_months: 12, purpose: 'ថ្លៃពិនិត្យសុខភាព', disbursed_days_ago: 30 },
  },
  {
    key: 'm10',
    email: `member10${SEED_EMAIL_DOMAIN}`,
    full_name_kh: 'ជា វិចិត្រ',
    full_name_en: 'Chea Vichet',
    phone: '012100010',
    date_of_birth: '1996-08-25',
    address: 'ផ្ទះលេខ ៦៧ ផ្លូវ ៦០០ ខណ្ឌច្បារអំពៅ',
    id_number: '010696025',
    resident_book_number: 'PP-067600',
    joined_days_ago: 150,
    savings: [500, 480, 460],
    loan: { amount: 1900, term_months: 12, purpose: 'បើកហាងកាហ្វេ', disbursed_days_ago: 55 },
  },
]

async function resolveAdminId() {
  const { data: existing, error } = await admin
    .from('members')
    .select('id')
    .eq('is_admin', true)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (existing?.id) return existing.id

  const email = `admin${SEED_EMAIL_DOMAIN}`
  const authUserId = await createAuthUser(email, 'អ្នកគ្រប់គ្រង', 'Admin Seed')
  const { data, error: insertError } = await admin
    .from('members')
    .insert({
      auth_user_id: authUserId,
      full_name: 'អ្នកគ្រប់គ្រង | Admin Seed',
      full_name_kh: 'អ្នកគ្រប់គ្រង',
      full_name_en: 'Admin Seed',
      email,
      phone: '012900000',
      status: 'active',
      is_admin: true,
      referee_verified: false,
      joined_at: daysAgo(500),
      created_at: daysAgo(500),
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return data.id
}

async function cleanupSeedUsers() {
  const { data: members, error: membersError } = await admin
    .from('members')
    .select('id, auth_user_id, email')
    .like('email', `%${SEED_EMAIL_DOMAIN}`)

  if (membersError) throw membersError
  if (!members?.length) return

  const memberIds = members.map((member) => member.id)
  const authUserIds = members.map((member) => member.auth_user_id).filter(Boolean)

  await admin.from('members').update({ referee_id: null }).in('referee_id', memberIds)
  await admin.from('savings').update({ verified_by: null, refunded_by: null }).in('verified_by', memberIds)
  await admin.from('savings').update({ refunded_by: null }).in('refunded_by', memberIds)
  await admin.from('loans').update({ approved_by: null, referee_id: null }).in('approved_by', memberIds)
  await admin.from('loans').update({ referee_id: null }).in('referee_id', memberIds)
  await admin.from('loan_repayments').update({ verified_by: null }).in('verified_by', memberIds)

  const { error: deleteMembersError } = await admin.from('members').delete().in('id', memberIds)
  if (deleteMembersError) throw deleteMembersError

  for (const authUserId of authUserIds) {
    const { error } = await admin.auth.admin.deleteUser(authUserId)
    if (error) throw error
  }

  console.log(`Removed ${members.length} existing seed10 account(s).`)
}

async function createAuthUser(email, fullNameKh, fullNameEn) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: `${fullNameKh} | ${fullNameEn}`,
      full_name_kh: fullNameKh,
      full_name_en: fullNameEn,
    },
  })

  if (error) throw error
  if (!data.user) throw new Error(`Failed to create auth user for ${email}`)
  return data.user.id
}

async function seedMembers(adminId) {
  const ids = {}

  for (const member of SEED_MEMBERS) {
    const authUserId = await createAuthUser(member.email, member.full_name_kh, member.full_name_en)
    const fullName = `${member.full_name_kh} | ${member.full_name_en}`

    const { data, error } = await admin
      .from('members')
      .insert({
        auth_user_id: authUserId,
        full_name: fullName,
        full_name_kh: member.full_name_kh,
        full_name_en: member.full_name_en,
        email: member.email,
        phone: member.phone,
        date_of_birth: member.date_of_birth,
        address: member.address,
        id_number: member.id_number,
        resident_book_number: member.resident_book_number,
        status: 'active',
        role: 'member',
        is_admin: false,
        referee_id: adminId,
        referee_verified: true,
        joined_at: daysAgo(member.joined_days_ago),
        created_at: daysAgo(member.joined_days_ago),
      })
      .select('id')
      .single()

    if (error) throw error
    ids[member.key] = data.id
  }

  return ids
}

async function seedSavings(ids, adminId) {
  const rows = []

  for (const member of SEED_MEMBERS) {
    member.savings.forEach((amount, index) => {
      const monthsAgo = member.savings.length - index + 2
      const verifiedDaysAgo = member.joined_days_ago - index * 20
      rows.push({
        member_id: ids[member.key],
        amount,
        currency: 'USD',
        saving_date: monthStartMonthsAgo(monthsAgo),
        status: 'verified',
        verified_by: adminId,
        verified_at: daysAgo(verifiedDaysAgo),
        created_at: daysAgo(verifiedDaysAgo),
      })
    })
  }

  const { error } = await admin.from('savings').insert(rows)
  if (error) throw error
}

async function seedLoans(ids, adminId) {
  const loanIds = {}

  for (const member of SEED_MEMBERS) {
    const { amount, term_months, purpose, disbursed_days_ago } = member.loan
    const disbursedAt = daysAgo(disbursed_days_ago)
    const startDate = dateDaysAgo(disbursed_days_ago)

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + term_months)

    const { data, error } = await admin
      .from('loans')
      .insert({
        member_id: ids[member.key],
        amount,
        currency: 'USD',
        purpose,
        term_months,
        monthly_interest_rate: 2,
        status: 'active',
        referee_id: adminId,
        referee_verified: true,
        approved_by: adminId,
        approved_at: daysAgo(disbursed_days_ago + 3),
        disbursed_at: disbursedAt,
        start_date: startDate,
        end_date: endDate.toISOString().slice(0, 10),
        due_date: endDate.toISOString().slice(0, 10),
        created_at: daysAgo(disbursed_days_ago + 5),
      })
      .select('id')
      .single()

    if (error) throw new Error(`loan ${member.key}: ${error.message}`)
    loanIds[member.key] = data.id
  }

  return loanIds
}

async function seedRepayments(ids, loanIds, adminId) {
  const rows = []

  for (const member of SEED_MEMBERS) {
    const loanId = loanIds[member.key]
    const memberId = ids[member.key]
    const monthlyPayment = Math.round((member.loan.amount / member.loan.term_months) * 100) / 100
    const paidMonths = Math.min(2, Math.floor(member.loan.disbursed_days_ago / 30))

    for (let index = 0; index < paidMonths; index += 1) {
      const paymentDaysAgo = member.loan.disbursed_days_ago - (index + 1) * 28
      rows.push({
        loan_id: loanId,
        member_id: memberId,
        amount: monthlyPayment,
        currency: 'USD',
        payment_date: dateDaysAgo(paymentDaysAgo),
        status: 'verified',
        verified_by: adminId,
        verified_at: daysAgo(paymentDaysAgo - 1),
        created_at: daysAgo(paymentDaysAgo),
      })
    }
  }

  if (rows.length === 0) return

  const { error } = await admin.from('loan_repayments').insert(rows)
  if (error) throw error
}

function printSummary() {
  console.log('\n========================================')
  console.log(' Seed 10 members completed successfully')
  console.log('========================================')
  console.log(`Password for all accounts: ${SEED_PASSWORD}\n`)
  console.log('Each member has:')
  console.log('  - 2–3 verified savings (USD)')
  console.log('  - 1 active loan with some repayments\n')
  console.log('Accounts:')
  for (const member of SEED_MEMBERS) {
    const totalSavings = member.savings.reduce((sum, amount) => sum + amount, 0)
    console.log(
      `  ${member.email.padEnd(32)} savings $${totalSavings}  loan $${member.loan.amount}`
    )
  }
  console.log('\nAdmin paths to verify:')
  console.log('  /admin/savings')
  console.log('  /admin/savings/interest')
  console.log('  /admin/loans/payments')
  console.log('========================================\n')
}

async function main() {
  console.log('Seeding 10 members with savings and loans...\n')

  await cleanupSeedUsers()
  const adminId = await resolveAdminId()
  const ids = await seedMembers(adminId)
  await seedSavings(ids, adminId)
  const loanIds = await seedLoans(ids, adminId)
  await seedRepayments(ids, loanIds, adminId)

  printSummary()
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error)
  process.exit(1)
})
