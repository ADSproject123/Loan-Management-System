/**
 * One-time migration: import real loan contracts and repayment history from
 * documentation/Payment Schedule Masterlist.xlsx into Supabase.
 *
 * Unlike the savings masterlist, this workbook has one sheet per LOAN
 * CONTRACT (amortization schedule: Contract No / Value date / Maturity date
 * / Rate / Current outstanding, then a No./Date/Payment/Principle/Interest/
 * Balance/Payment-Month/Saving-Month row table). The "Saving/Month" column
 * duplicates deposits already imported by migrate-savings-masterlist.mjs, so
 * it is intentionally ignored here - only loan + actual-repayment data is new.
 *
 * This does NOT create new members. Every loan here is attached to a member
 * already created by migrate-savings-masterlist.mjs (matched by name via the
 * @legacy.sansam.kh accounts) - run that script first.
 *
 * The workbook has several duplicate/superseded sheets per person (stale
 * copies, speculative future-fill copies, loan restructures). LOAN_PLAN below
 * is the reviewed, human-confirmed resolution:
 *   - Nop Vy: 3 conflicting copies of one contract -> confirmed to use the
 *     copy reflecting a real ~$12,494 top-up around 2026-05. Since the
 *     source's own header still says the original $24,000 and only the
 *     running balance reflects the top-up, `amount` is reconciled here as
 *     (last known real balance + repayments already made) so the app's
 *     amount-minus-repayments math matches the real current balance.
 *   - Tum Sokraksa: 3 sheets, zero real repayments on any -> confirmed to
 *     use the newest draft ($9,614.56) as his one current loan.
 *   - Kruy Bopha / Ul Vann / Hong Reaksmey: each restructured mid-history
 *     (old loan's tracked balance rolls exactly into a new contract's
 *     principal). Modeled as two sequential loans: the old one 'completed'
 *     (closed out via restructure, whether or not real repayments exist for
 *     it), the new one 'active'.
 *
 * Usage:
 *   node scripts/migrate-payment-schedule.mjs --dry-run
 *   node scripts/migrate-payment-schedule.mjs
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Re-running is safe: for each planned loan, any existing loan row for the
 * same member with the same start_date + amount is removed (repayments
 * cascade-delete via FK) before re-inserting.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import XLSX from 'xlsx'

const DRY_RUN = process.argv.includes('--dry-run')
const LEGACY_EMAIL_DOMAIN = '@legacy.sansam.kh'
const WORKBOOK_PATH = './documentation/Payment Schedule Masterlist.xlsx'
const TODAY = '2026-07-20'

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!DRY_RUN && (!url || !serviceRoleKey)) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = url && serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// ---------------------------------------------------------------------------
// Reviewed, human-confirmed sheet -> loan resolution (see header comment)
// ---------------------------------------------------------------------------
const LOAN_PLAN = [
  { sheet: 'Copy of Nop Vy (Nov-22)', customer: 'NOP VY', status: 'active', amountOverride: 19995.73 },
  { sheet: 'Tuy Sythieng (Apr-24)', customer: 'TUY SYTHIENG', status: 'active' },
  { sheet: 'Ou Tep Phallin', customer: 'OU TEP PHALLIN', status: 'active' },
  { sheet: 'Chun Sokthoutheareach (May-24)', customer: 'CHUN SOKTHOUTHEAREACH', status: 'active' },
  { sheet: 'Ket Soksila (Aug-24)', customer: 'KET SOKSILA', status: 'active' },
  { sheet: 'New Tum Sokraksa (Jun 2026)', customer: 'TUM SOKRAKSA', status: 'active' },
  { sheet: 'Phal Chantha (Mar-25)', customer: 'PHAL CHANTHA', status: 'active' },
  { sheet: 'Kruy Bopha (July-25)', customer: 'KRUY BOPHA', status: 'completed' },
  { sheet: 'New Kruy Bopha (Apr-26)', customer: 'KRUY BOPHA', status: 'active' },
  { sheet: 'Ul Vann(Sep-25)', customer: 'UL VANN', status: 'completed' },
  { sheet: 'New Ul Vann(Apr-26)', customer: 'UL VANN', status: 'active' },
  { sheet: 'Chea Sopheap (Nov-25)', customer: 'CHEA SOPHEAP', status: 'active' },
  { sheet: 'Pech Pisey (Dec-25)', customer: 'PECH PISEY', status: 'active' },
  { sheet: 'Ath Thorn (Dec-25)', customer: 'ATH THORN', status: 'active' },
  { sheet: 'Hong Reaksmey (Jan-26)', customer: 'HONG REAKSMEY', status: 'completed' },
  { sheet: 'New Hong Reaksmey (Mar-26)', customer: 'HONG REAKSMEY', status: 'active' },
  { sheet: 'Yean Reaksmey (Jan-26)', customer: 'YEAN REAKSMEY', status: 'active' },
  { sheet: 'Chhan Channy (May-26)', customer: 'CHHAN CHANNY', status: 'active' },
  { sheet: 'Chhut Syneet', customer: 'CHHUT SYNEET', status: 'active' },
]

function excelSerialToISO(serial) {
  if (serial == null || typeof serial !== 'number') return null
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  return new Date(ms).toISOString().slice(0, 10)
}

function addMonths(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

function extractLoan(wb, plan) {
  const ws = wb.Sheets[plan.sheet]
  if (!ws) throw new Error(`Sheet "${plan.sheet}" not found in workbook`)
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false })

  const valueDateRow = rows.find((r) => (r[0] || '').toString().includes('Value date'))
  const rateRow = rows.find((r) => (r[0] || '').toString().includes('Rate'))
  const outstandingRow = rows.find((r) => (r[0] || '').toString().includes('Current outstanding'))
  const headerIdx = rows.findIndex((r) => (r[0] || '').toString().trim() === 'No.')
  if (headerIdx === -1) throw new Error(`No installment table found in sheet "${plan.sheet}"`)
  const data = rows.slice(headerIdx + 1).filter((r) => r[0] != null)

  const valueDate = valueDateRow ? excelSerialToISO(valueDateRow[1]) : null
  const rate = rateRow ? rateRow[1] : null
  const principal = outstandingRow ? outstandingRow[2] : null
  const termMonths = data.length

  const repayments = data
    .map((r) => ({ date: excelSerialToISO(r[1]), amount: r[6] }))
    .filter((r) => typeof r.amount === 'number' && r.date && r.date <= TODAY)

  return {
    ...plan,
    valueDate,
    rate,
    principal,
    termMonths,
    repayments,
    amount: plan.amountOverride ?? principal,
  }
}

async function findLegacyMemberByName(customerKey) {
  const { data, error } = await admin
    .from('members')
    .select('id, full_name_en')
    .like('email', `%${LEGACY_EMAIL_DOMAIN}`)
    .ilike('full_name_en', customerKey)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

async function cleanupExistingLoan(memberId, startDate, amount) {
  const { data: existing, error } = await admin
    .from('loans')
    .select('id')
    .eq('member_id', memberId)
    .eq('start_date', startDate)
    .eq('amount', amount)
  if (error) throw error
  if (!existing?.length) return
  const { error: deleteError } = await admin.from('loans').delete().in('id', existing.map((l) => l.id))
  if (deleteError) throw deleteError
}

async function resolveAdminId() {
  const { data, error } = await admin
    .from('members')
    .select('id')
    .eq('is_admin', true)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data?.id) throw new Error('No active admin member found.')
  return data.id
}

async function main() {
  console.log(DRY_RUN ? 'Running in --dry-run mode (no database writes)\n' : 'Migrating payment schedule masterlist into Supabase...\n')

  const wb = XLSX.readFile(WORKBOOK_PATH)
  const loans = LOAN_PLAN.map((plan) => extractLoan(wb, plan))

  const totalRepayRows = loans.reduce((sum, l) => sum + l.repayments.length, 0)
  const totalRepayAmount = loans.reduce((sum, l) => sum + l.repayments.reduce((s, r) => s + r.amount, 0), 0)
  console.log(`Parsed ${loans.length} loans across ${new Set(loans.map((l) => l.customer)).size} people.`)
  console.log(`Repayment rows: ${totalRepayRows}, totaling $${totalRepayAmount.toFixed(2)}`)

  if (DRY_RUN) {
    console.log('\nPlanned loans:')
    for (const l of loans) {
      console.log(
        `  ${l.customer.padEnd(24)} ${l.sheet.padEnd(30)} amount=$${l.amount}  rate=${(l.rate * 100).toFixed(2)}%  status=${l.status}  repayments=${l.repayments.length}`
      )
    }
    console.log('\nDry run complete - no data was written.')
    return
  }

  const adminId = await resolveAdminId()
  let importedLoans = 0
  let importedRepayments = 0

  for (const l of loans) {
    const member = await findLegacyMemberByName(l.customer)
    if (!member) {
      throw new Error(`No legacy member found matching "${l.customer}" - run migrate-savings-masterlist.mjs first, or check spelling.`)
    }

    const startDate = l.valueDate
    const endDate = addMonths(startDate, l.termMonths)
    const monthlyInterestRate = Math.round(l.rate * 100 * 100) / 100

    await cleanupExistingLoan(member.id, startDate, l.amount)

    const { data: loanRow, error: loanError } = await admin
      .from('loans')
      .insert({
        member_id: member.id,
        amount: l.amount,
        currency: 'USD',
        term_months: l.termMonths,
        monthly_interest_rate: monthlyInterestRate,
        status: l.status,
        referee_verified: false,
        approved_by: adminId,
        approved_at: startDate,
        disbursed_at: startDate,
        start_date: startDate,
        end_date: endDate,
        due_date: endDate,
        created_at: startDate,
      })
      .select('id')
      .single()
    if (loanError) throw new Error(`loans insert failed for ${l.customer} (${l.sheet}): ${loanError.message}`)
    importedLoans++

    if (l.repayments.length > 0) {
      const repaymentRows = l.repayments.map((r) => ({
        loan_id: loanRow.id,
        member_id: member.id,
        amount: r.amount,
        currency: 'USD',
        payment_date: r.date,
        status: 'verified',
        verified_by: adminId,
        verified_at: r.date,
        created_at: r.date,
      }))
      const { error: repayError } = await admin.from('loan_repayments').insert(repaymentRows)
      if (repayError) throw new Error(`loan_repayments insert failed for ${l.customer} (${l.sheet}): ${repayError.message}`)
      importedRepayments += repaymentRows.length
    }
  }

  console.log('\n========================================')
  console.log(' Payment schedule migration completed')
  console.log('========================================')
  console.log(`Imported ${importedLoans} loans, ${importedRepayments} repayment rows.`)
  console.log('========================================\n')
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message ?? error)
  process.exit(1)
})
