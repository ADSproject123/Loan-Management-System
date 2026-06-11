/**
 * Demo seed for client presentations.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * All demo accounts use password: Demo1234!
 * Emails end with @demo.savings.kh — re-running removes and recreates them.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DEMO_PASSWORD = 'Demo1234!'
const DEMO_EMAIL_DOMAIN = '@demo.savings.kh'

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

const DEMO_MEMBERS = [
  {
    key: 'admin',
    email: `admin${DEMO_EMAIL_DOMAIN}`,
    is_admin: true,
    status: 'active',
    full_name_kh: 'សួន រដ្ឋា',
    full_name_en: 'Suon Ratha',
    phone: '012900001',
    date_of_birth: '1985-03-12',
    address: 'ផ្ទះលេខ ១២៣ ផ្លូវ ២៧១ រាជធានីភ្នំពេញ',
    id_number: '010285001',
    resident_book_number: 'PP-001234',
    joined_days_ago: 400,
  },
  {
    key: 'sokha',
    email: `sokha${DEMO_EMAIL_DOMAIN}`,
    status: 'active',
    full_name_kh: 'គឹម សុខា',
    full_name_en: 'Kim Sokha',
    phone: '012345678',
    date_of_birth: '1992-07-18',
    address: 'ផ្ទះលេខ ៤៥ ផ្លូវ ៣១០ ខណ្ឌចំការមន',
    id_number: '010592018',
    resident_book_number: 'PP-045678',
    referee_key: 'bopha',
    referee_verified: true,
    joined_days_ago: 320,
  },
  {
    key: 'dara',
    email: `dara${DEMO_EMAIL_DOMAIN}`,
    status: 'active',
    full_name_kh: 'ហេង ដារ៉ា',
    full_name_en: 'Heng Dara',
    phone: '077888999',
    date_of_birth: '1990-11-02',
    address: 'ផ្ទះលេខ ៨៨ ផ្លូវ ៤៣៦ ខណ្ឌឫស្សីកែវ',
    id_number: '011090022',
    resident_book_number: 'PP-088999',
    referee_key: 'bopha',
    referee_verified: true,
    joined_days_ago: 280,
  },
  {
    key: 'bopha',
    email: `bopha${DEMO_EMAIL_DOMAIN}`,
    status: 'active',
    full_name_kh: 'អ៊ុំ បុប្ផា',
    full_name_en: 'Om Bopha',
    phone: '096112233',
    date_of_birth: '1988-01-25',
    address: 'ផ្ទះលេខ ១៥ ផ្លូវ ១៣៨ ខណ្ឌដូនពេញ',
    id_number: '010188025',
    resident_book_number: 'PP-015138',
    joined_days_ago: 500,
  },
  {
    key: 'chann',
    email: `chann${DEMO_EMAIL_DOMAIN}`,
    status: 'pending',
    full_name_kh: 'លី ចាន់',
    full_name_en: 'Ly Chann',
    phone: '015667788',
    date_of_birth: '1995-05-09',
    address: 'ផ្ទះលេខ ៧១ ផ្លូវ ២២០ ភ្នំពេញ',
    id_number: '010595009',
    resident_book_number: 'PP-071220',
    referee_key: 'sokha',
    referee_verified: false,
    joined_days_ago: 3,
  },
  {
    key: 'vanna',
    email: `vanna${DEMO_EMAIL_DOMAIN}`,
    status: 'pending',
    full_name_kh: 'សារុន វណ្ណា',
    full_name_en: 'Sarun Vanna',
    phone: '089445566',
    date_of_birth: '1993-09-14',
    address: 'ផ្ទះលេខ ៣៣ ផ្លូវ ៤៧០ ខណ្ឌមានជ័យ',
    id_number: '010993014',
    resident_book_number: 'PP-033470',
    joined_days_ago: 5,
  },
  {
    key: 'meas',
    email: `meas${DEMO_EMAIL_DOMAIN}`,
    status: 'suspended',
    full_name_kh: 'ផាន់ មាស',
    full_name_en: 'Phan Meas',
    phone: '070334455',
    date_of_birth: '1987-12-30',
    address: 'ផ្ទះលេខ ៥៦ ផ្លូវ ១៩៦ ខណ្ឌពោធិ៍សែនជ័យ',
    id_number: '010687030',
    resident_book_number: 'PP-056196',
    suspension_reason: 'មិនបានសន្សំប្រចាំខែ ៣ ខែជាប់គ្នា។',
    suspended_days_ago: 14,
    joined_days_ago: 200,
  },
  {
    key: 'srey',
    email: `srey${DEMO_EMAIL_DOMAIN}`,
    status: 'rejected',
    full_name_kh: 'ចន់ ស្រី',
    full_name_en: 'Chhorn Srey',
    phone: '088221133',
    date_of_birth: '1994-04-21',
    address: 'ផ្ទះលេខ ៩០ ផ្លូវ ៣៣៣ ខណ្ឌឫស្សីកែវ',
    id_number: '010494021',
    resident_book_number: 'PP-090333',
    joined_days_ago: 20,
  },
]

async function cleanupDemoUsers() {
  const { data: members, error: membersError } = await admin
    .from('members')
    .select('id, auth_user_id, email')
    .like('email', `%${DEMO_EMAIL_DOMAIN}`)

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
  await admin.from('capital_requests').update({ approved_by: null }).in('approved_by', memberIds)

  const { error: deleteMembersError } = await admin.from('members').delete().in('id', memberIds)
  if (deleteMembersError) throw deleteMembersError

  for (const authUserId of authUserIds) {
    const { error } = await admin.auth.admin.deleteUser(authUserId)
    if (error) throw error
  }

  console.log(`Removed ${members.length} existing demo account(s).`)
}

async function createAuthUser(email, fullNameKh, fullNameEn) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
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

async function seedMembers() {
  const ids = {}

  for (const member of DEMO_MEMBERS) {
    const authUserId = await createAuthUser(member.email, member.full_name_kh, member.full_name_en)
    const fullName = `${member.full_name_kh} | ${member.full_name_en}`

    const row = {
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
      status: member.status,
      is_admin: member.is_admin ?? false,
      referee_verified: member.referee_verified ?? false,
      joined_at: daysAgo(member.joined_days_ago),
      created_at: daysAgo(member.joined_days_ago),
      id_document_url: `member-documents/${authUserId}/demo-id-card.pdf`,
      resident_book_url: `member-documents/${authUserId}/demo-resident-book.pdf`,
    }

    if (member.suspension_reason) {
      row.suspension_reason = member.suspension_reason
      row.suspended_at = daysAgo(member.suspended_days_ago ?? 1)
    }

    const { data, error } = await admin.from('members').insert(row).select('id').single()
    if (error) throw error
    ids[member.key] = data.id
  }

  for (const member of DEMO_MEMBERS) {
    if (!member.referee_key) continue
    const memberId = ids[member.key]
    const refereeId = ids[member.referee_key]
    if (!memberId || !refereeId) continue

    const { error } = await admin
      .from('members')
      .update({ referee_id: refereeId })
      .eq('id', memberId)

    if (error) throw error
  }

  return ids
}

async function seedSavings(ids, adminId) {
  const rows = [
    // Sokha — verified savings across 12 months for chart
    ...Array.from({ length: 12 }, (_, index) => ({
      member_id: ids.sokha,
      amount: 120 + index * 15,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(11 - index),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(320 - index * 25),
      created_at: daysAgo(320 - index * 25),
    })),
    ...Array.from({ length: 8 }, (_, index) => ({
      member_id: ids.sokha,
      amount: 180 + index * 25,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(7 - index),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(240 - index * 20),
      created_at: daysAgo(240 - index * 20),
    })),
    {
      member_id: ids.sokha,
      amount: 150,
      currency: 'USD',
      saving_date: dateDaysAgo(2),
      status: 'pending',
      created_at: daysAgo(2),
    },
    // Dara
    {
      member_id: ids.dara,
      amount: 850,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(4),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(130),
      created_at: daysAgo(130),
    },
    {
      member_id: ids.dara,
      amount: 800,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(3),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(100),
      created_at: daysAgo(100),
    },
    {
      member_id: ids.dara,
      amount: 200,
      currency: 'USD',
      saving_date: dateDaysAgo(5),
      status: 'pending',
      created_at: daysAgo(5),
    },
    // Bopha
    {
      member_id: ids.bopha,
      amount: 2400,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(6),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(190),
      created_at: daysAgo(190),
    },
    {
      member_id: ids.bopha,
      amount: 1300,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(5),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(160),
      created_at: daysAgo(160),
    },
    {
      member_id: ids.bopha,
      amount: 100,
      currency: 'USD',
      saving_date: monthStartMonthsAgo(1),
      status: 'refunded',
      refund_reason: 'ដកប្រាក់ខុសគណនី — សងប្រាក់វិញតាមសំណើសមាជិក។',
      refunded_at: daysAgo(20),
      refunded_by: adminId,
      verified_by: adminId,
      verified_at: daysAgo(35),
      created_at: daysAgo(35),
    },
  ]

  const { error } = await admin.from('savings').insert(rows)
  if (error) throw error
}

async function seedLoans(ids, adminId) {
  const loanDefs = [
    {
      key: 'sokhaActive',
      member_id: ids.sokha,
      amount: 2500,
      currency: 'USD',
      purpose: 'ពង្រីកអាជីវកម្មការធានាអាហារតូច',
      term_months: 12,
      status: 'active',
      referee_id: ids.bopha,
      referee_verified: true,
      approved_by: adminId,
      approved_at: daysAgo(90),
      disbursed_at: daysAgo(88),
      due_date: dateDaysAgo(-275),
      created_at: daysAgo(95),
    },
    {
      key: 'daraActive',
      member_id: ids.dara,
      amount: 1000,
      currency: 'USD',
      purpose: 'ទិញសម្ភារៈសម្រាប់ហាងទំនិញ',
      term_months: 18,
      status: 'active',
      referee_id: ids.bopha,
      referee_verified: true,
      approved_by: adminId,
      approved_at: daysAgo(60),
      disbursed_at: daysAgo(58),
      due_date: dateDaysAgo(-490),
      created_at: daysAgo(65),
    },
    {
      key: 'bophaReview',
      member_id: ids.bopha,
      amount: 1200,
      currency: 'USD',
      purpose: 'ជួសជុលផ្ទះ',
      term_months: 10,
      status: 'under_review',
      created_at: daysAgo(4),
    },
    {
      key: 'sokhaApproved',
      member_id: ids.sokha,
      amount: 500,
      currency: 'USD',
      purpose: 'ថ្លៃសិក្សាកូន',
      term_months: 6,
      status: 'approved',
      approved_by: adminId,
      approved_at: daysAgo(2),
      created_at: daysAgo(6),
    },
    {
      key: 'daraCompleted',
      member_id: ids.dara,
      amount: 600,
      currency: 'USD',
      purpose: 'ទិញម៉ូតូប្រើប្រាស់',
      term_months: 8,
      status: 'completed',
      approved_by: adminId,
      approved_at: daysAgo(300),
      disbursed_at: daysAgo(298),
      due_date: dateDaysAgo(40),
      created_at: daysAgo(305),
    },
    {
      key: 'measRejected',
      member_id: ids.meas,
      amount: 3000,
      currency: 'USD',
      purpose: 'វិធានការមិនច្បាស់',
      term_months: 12,
      status: 'rejected',
      created_at: daysAgo(35),
    },
  ]

  const loanIds = {}

  for (const def of loanDefs) {
    const { key, ...row } = def
    const { data, error } = await admin.from('loans').insert(row).select('id').single()
    if (error) throw new Error(`loan ${key}: ${error.message}`)
    loanIds[key] = data.id
  }

  return loanIds
}

async function seedRepayments(ids, loanIds, adminId) {
  const rows = [
    {
      loan_id: loanIds.sokhaActive,
      member_id: ids.sokha,
      amount: 250,
      currency: 'USD',
      payment_date: dateDaysAgo(60),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(58),
      created_at: daysAgo(60),
    },
    {
      loan_id: loanIds.sokhaActive,
      member_id: ids.sokha,
      amount: 250,
      currency: 'USD',
      payment_date: dateDaysAgo(30),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(28),
      created_at: daysAgo(30),
    },
    {
      loan_id: loanIds.sokhaActive,
      member_id: ids.sokha,
      amount: 250,
      currency: 'USD',
      payment_date: dateDaysAgo(1),
      status: 'pending',
      created_at: daysAgo(1),
    },
    {
      loan_id: loanIds.daraActive,
      member_id: ids.dara,
      amount: 125,
      currency: 'USD',
      payment_date: dateDaysAgo(25),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(23),
      created_at: daysAgo(25),
    },
    {
      loan_id: loanIds.daraActive,
      member_id: ids.dara,
      amount: 125,
      currency: 'USD',
      payment_date: dateDaysAgo(3),
      status: 'pending',
      created_at: daysAgo(3),
    },
    {
      loan_id: loanIds.daraCompleted,
      member_id: ids.dara,
      amount: 600,
      currency: 'USD',
      payment_date: dateDaysAgo(45),
      status: 'verified',
      verified_by: adminId,
      verified_at: daysAgo(43),
      created_at: daysAgo(45),
    },
  ]

  const { error } = await admin.from('loan_repayments').insert(rows)
  if (error) throw error
}

async function seedCapitalRequests(ids, adminId) {
  const rows = [
    {
      member_id: ids.sokha,
      amount: 500,
      currency: 'USD',
      reason: 'ចាំបាច់ប្រើប្រាក់សន្សំសម្រាប់ពិនិត្យសុខភាព',
      continue_saving: true,
      remove_membership: false,
      status: 'pending',
      created_at: daysAgo(2),
    },
    {
      member_id: ids.dara,
      amount: 500,
      currency: 'USD',
      reason: 'ដកដើមទុនបន្តិចដើម្បីបន្តសន្សំ',
      continue_saving: true,
      remove_membership: false,
      status: 'approved',
      approved_by: adminId,
      approved_at: daysAgo(15),
      created_at: daysAgo(20),
    },
    {
      member_id: ids.bopha,
      amount: 800,
      currency: 'USD',
      reason: 'ស្នើដកទាំងអស់',
      continue_saving: false,
      remove_membership: true,
      status: 'rejected',
      created_at: daysAgo(12),
    },
  ]

  for (const [index, row] of rows.entries()) {
    const { error } = await admin.from('capital_requests').insert(row)
    if (error) throw new Error(`capital request ${index}: ${error.message}`)
  }
}

async function seedReportRequests(ids) {
  const rows = [
    {
      member_id: ids.sokha,
      report_type: 'saving',
      period_from: monthStartMonthsAgo(5),
      period_to: dateDaysAgo(1),
      status: 'pending',
      sent_to_telegram: false,
      created_at: daysAgo(1),
    },
    {
      member_id: ids.dara,
      report_type: 'loan',
      period_from: monthStartMonthsAgo(8),
      period_to: dateDaysAgo(1),
      status: 'pending',
      sent_to_telegram: false,
      created_at: daysAgo(2),
    },
    {
      member_id: ids.bopha,
      report_type: 'saving',
      period_from: monthStartMonthsAgo(11),
      period_to: monthStartMonthsAgo(1),
      status: 'sent',
      sent_to_telegram: true,
      telegram_sent_at: daysAgo(7),
      created_at: daysAgo(8),
    },
    {
      member_id: ids.sokha,
      report_type: 'loan',
      period_from: monthStartMonthsAgo(6),
      period_to: monthStartMonthsAgo(2),
      status: 'failed',
      sent_to_telegram: false,
      created_at: daysAgo(10),
    },
  ]

  const { error } = await admin.from('report_requests').insert(rows)
  if (error) throw error
}

async function seedNotifications(ids) {
  const rows = [
    {
      member_id: ids.sokha,
      title: 'ការសន្សំត្រូវបានផ្ទៀងផ្ទាត់',
      message: 'ការដាក់សន្សំ $150 USD របស់អ្នកកំពុងរង់ចាំ — យើងនឹងជូនដំណឹងនៅពេលបញ្ចប់។',
      type: 'info',
      read: false,
      created_at: daysAgo(2),
    },
    {
      member_id: ids.sokha,
      title: 'ការសងកម្ជីទទួលបាន',
      message: 'បានទទួលការសង $250 USD — កំពុងផ្ទៀងផ្ទាត់។',
      type: 'success',
      read: false,
      created_at: daysAgo(1),
    },
    {
      member_id: ids.dara,
      title: 'កម្ជីថ្មីបានទទួល',
      message: 'ពាក្យសុំកម្ជី $1,000 USD របស់អ្នកកំពុងសកម្ម។',
      type: 'info',
      read: true,
      created_at: daysAgo(58),
    },
    {
      member_id: ids.bopha,
      title: 'របាយការណ៍ត្រូវបានផ្ញើ',
      message: 'របាយការណ៍សន្សំត្រូវបានផ្ញើតាម Telegram រួចរាល់។',
      type: 'success',
      read: true,
      created_at: daysAgo(7),
    },
    {
      member_id: ids.chann,
      title: 'ពាក្យសុំកំពុងពិនិត្យ',
      message: 'គណនីរបស់អ្នកកំពុងរង់ចាំការទទួលពីអ្នកគ្រប់គ្រង។',
      type: 'info',
      read: false,
      created_at: daysAgo(3),
    },
  ]

  const { error } = await admin.from('notifications').insert(rows)
  if (error) throw error
}

function printSummary() {
  console.log('\n========================================')
  console.log(' Demo seed completed successfully')
  console.log('========================================')
  console.log(`Password for all accounts: ${DEMO_PASSWORD}\n`)
  console.log('Admin (admin console):')
  console.log(`  ${`admin${DEMO_EMAIL_DOMAIN}`}\n`)
  console.log('Active members (member dashboard):')
  console.log(`  ${`sokha${DEMO_EMAIL_DOMAIN}`}  — savings, active loan, pending items`)
  console.log(`  ${`dara${DEMO_EMAIL_DOMAIN}`}   — USD savings, active USD loan`)
  console.log(`  ${`bopha${DEMO_EMAIL_DOMAIN}`}  — senior member / referee\n`)
  console.log('Pending approval queue:')
  console.log(`  ${`chann${DEMO_EMAIL_DOMAIN}`}, ${`vanna${DEMO_EMAIL_DOMAIN}`}\n`)
  console.log('Edge cases:')
  console.log(`  ${`meas${DEMO_EMAIL_DOMAIN}`}    — suspended`)
  console.log(`  ${`srey${DEMO_EMAIL_DOMAIN}`}    — rejected\n`)
  console.log('Admin demo paths:')
  console.log('  /admin              — dashboard + chart')
  console.log('  /admin/members/requests')
  console.log('  /admin/savings/requests')
  console.log('  /admin/loans/requests')
  console.log('  /admin/loans/payments')
  console.log('  /admin/savings/capital')
  console.log('  /admin/reports/savings')
  console.log('  /admin/reports/loans')
  console.log('========================================\n')
}

async function main() {
  console.log('Seeding demo data...\n')

  await cleanupDemoUsers()
  const ids = await seedMembers()
  const adminId = ids.admin

  await seedSavings(ids, adminId)
  const loanIds = await seedLoans(ids, adminId)
  await seedRepayments(ids, loanIds, adminId)
  await seedCapitalRequests(ids, adminId)
  await seedReportRequests(ids)
  await seedNotifications(ids)

  printSummary()
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error)
  process.exit(1)
})
