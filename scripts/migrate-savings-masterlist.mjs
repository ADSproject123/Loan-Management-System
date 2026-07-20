/**
 * One-time migration: import the real historical savings-group roster and
 * monthly ledger from documentation/Saving Masterlist 2026.xlsx into Supabase.
 *
 * The workbook has one sheet per month (Oct 2022 -> Jul 2026). Each row is a
 * running ledger: CAPITAL (balance carried from last month) + SAVING (new
 * deposit) + INTEREST (this month's interest) - WITHDRAWAL = TOTAL (next
 * month's CAPITAL). Only SAVING / INTEREST / WITHDRAWAL are new facts per
 * month; CAPITAL/BALANCE/TOTAL are derived and not stored directly.
 *
 * People are identified across sheets in two passes:
 *   1) exact (normalized) name string match
 *   2) numeric bridge: if a name's group has no row in the immediately
 *      preceding sheet, look for another still-open group whose carried
 *      total/balance matches this row's CAPITAL almost exactly. This is what
 *      lets the same person be tracked across a Khmer<->Latin spelling
 *      change or a mid-history typo, without merging two different people
 *      who simply share a round starting balance (guarded: a merge is
 *      rejected if it would give one person two rows in the same month).
 *
 * This reconciliation was validated interactively before this script was
 * written: 104 canonical people, 27 automatic name bridges (all unique
 * matches, zero left ambiguous), and 9 genuine zero-balance departures.
 * One founder (PAO VORN / វន់ ពៅ) has a real $670.46 balance with no
 * continuation after Jul-2025 in the source data; per instruction he is
 * kept 'active' with that balance rather than marked withdrawn.
 *
 * Usage:
 *   node scripts/migrate-savings-masterlist.mjs --dry-run   # preview only, no writes
 *   node scripts/migrate-savings-masterlist.mjs             # perform the import
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Re-running is safe: any previously imported rows (identified by the
 * @legacy.sansam.kh email domain) are removed and re-created from scratch.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import XLSX from 'xlsx'

const DRY_RUN = process.argv.includes('--dry-run')
const LEGACY_EMAIL_DOMAIN = '@legacy.sansam.kh'
const LEGACY_PASSWORD = 'LegacyImport2026!'
const WORKBOOK_PATH = './documentation/Saving Masterlist 2026.xlsx'

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
// One row per sheet, in workbook order: [sheetName, year, month, fallbackSavingDate, fallbackInterestDate]
// Fallback dates are used only when a row's own SAVING DATE cell is blank.
// The rolling 2026 cycles (non-calendar-month sheets) use their literal date range.
// ---------------------------------------------------------------------------
const MONTH_TABLE = [
  ['Saving monthly Oct-2022', 2022, 10, '2022-10-05', '2022-10-31'],
  ['Saving monthly November-22', 2022, 11, '2022-11-05', '2022-11-30'],
  ['Saving monthly December-22', 2022, 12, '2022-12-05', '2022-12-31'],
  ['Saving monthly Jan-23', 2023, 1, '2023-01-05', '2023-01-31'],
  ['Saving monthly Feb-23', 2023, 2, '2023-02-05', '2023-02-28'],
  ['Saving monthly Mar-23', 2023, 3, '2023-03-05', '2023-03-31'],
  ['Saving monthly Apr-23', 2023, 4, '2023-04-05', '2023-04-30'],
  ['Saving monthly May-23', 2023, 5, '2023-05-05', '2023-05-31'],
  ['Saving monthly Jun-23', 2023, 6, '2023-06-05', '2023-06-30'],
  ['Saving Monthly Jul-23', 2023, 7, '2023-07-05', '2023-07-31'],
  ['Saving Monthly Aug-23', 2023, 8, '2023-08-05', '2023-08-31'],
  ['Saving Monthly Sep-23', 2023, 9, '2023-09-05', '2023-09-30'],
  ['Saving Monthly Oct-23', 2023, 10, '2023-10-05', '2023-10-31'],
  ['Saving Monthly Nov-23', 2023, 11, '2023-11-05', '2023-11-30'],
  ['Saving Monthly Dec-23', 2023, 12, '2023-12-05', '2023-12-31'],
  ['Saving Monthly Jan-24', 2024, 1, '2024-01-05', '2024-01-31'],
  ['Saving Monthly Feb-24', 2024, 2, '2024-02-05', '2024-02-29'],
  ['March-24', 2024, 3, '2024-03-05', '2024-03-31'],
  ['April-24', 2024, 4, '2024-04-05', '2024-04-30'],
  ['May-24', 2024, 5, '2024-05-05', '2024-05-31'],
  ['Jun-24', 2024, 6, '2024-06-05', '2024-06-30'],
  ['Jul-24', 2024, 7, '2024-07-05', '2024-07-31'],
  ['Aug-24', 2024, 8, '2024-08-05', '2024-08-31'],
  ['Sep-24', 2024, 9, '2024-09-05', '2024-09-30'],
  ['Oct-24', 2024, 10, '2024-10-05', '2024-10-31'],
  ['Nov-24', 2024, 11, '2024-11-05', '2024-11-30'],
  ['Dec-24', 2024, 12, '2024-12-05', '2024-12-31'],
  ['Jan-2025', 2025, 1, '2025-01-05', '2025-01-31'],
  ['Feb-2025', 2025, 2, '2025-02-05', '2025-02-28'],
  ['Mar-2025 ', 2025, 3, '2025-03-05', '2025-03-31'],
  ['April-2025', 2025, 4, '2025-04-05', '2025-04-30'],
  ['May-2025', 2025, 5, '2025-05-05', '2025-05-31'],
  ['Jun-2025', 2025, 6, '2025-06-05', '2025-06-30'],
  ['Jul-2025', 2025, 7, '2025-07-05', '2025-07-31'],
  ['Aug-2025', 2025, 8, '2025-08-05', '2025-08-31'],
  ['Sep-2025', 2025, 9, '2025-09-05', '2025-09-30'],
  ['Oct-2025', 2025, 10, '2025-10-05', '2025-10-31'],
  ['Nov-2025', 2025, 11, '2025-11-05', '2025-11-30'],
  ['Dec-2025', 2025, 12, '2025-12-05', '2025-12-31'],
  ['Jan-2026', 2026, 1, '2026-01-05', '2026-01-31'],
  ['Feb-2026', 2026, 2, '2026-02-05', '2026-02-28'],
  ['Mar-2026', 2026, 3, '2026-03-05', '2026-03-31'],
  ['16Mar-20Apr2026', 2026, 4, '2026-03-16', '2026-04-20'],
  ['21Apr-25May2026', 2026, 5, '2026-04-21', '2026-05-25'],
  ['26May-25Jun2026', 2026, 6, '2026-05-26', '2026-06-25'],
  ['26Jun-25Jul2026', 2026, 7, '2026-06-26', '2026-07-25'],
]
const MONTH_META = new Map(MONTH_TABLE.map(([name, year, month, savingFallback, interestFallback]) => [
  name,
  { year, month, savingFallback, interestFallback },
]))

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------
function normHeader(cell) {
  return (cell ?? '').toString().trim()
}

function classifyHeader(cells) {
  const map = {}
  cells.forEach((raw, idx) => {
    const c = normHeader(raw)
    const cl = c.toLowerCase()
    if (c === 'ល.រ' || cl === 'no') map.no = idx
    else if (c.includes('ឈ្មោះ') || cl.includes('name')) map.name = idx
    else if (c === 'ភេទ' || cl === 'sex') map.sex = idx
    else if (c.includes('តួនាទី') || cl.includes('role')) map.role = idx
    else if (c.includes('ថ្ងៃខែ') || cl.includes('date')) map.date = idx
    else if (cl.includes('team leader')) map.teamleader = idx
    else if (c === 'ប្រាក់ដើម' || cl === 'capital') map.capital = idx
    else if (c === 'ប្រាក់ដាក់សន្សំ' || cl === 'saving') map.saving = idx
    else if (c.includes('ការប្រាក់') || cl.includes('interest')) map.interest = idx
    else if (c === 'សមតុល្យ​សាច់ប្រាក់' || cl === 'balance') map.balance = idx
    else if (c === 'ប្រាក់បានដក' || cl === 'withdrawal') map.withdrawal = idx
    else if (c.includes('ក្រោយដក') || cl === 'total') map.total = idx
  })
  return map
}

function findHeaderIdx(rows) {
  return rows.findIndex((r) => {
    const c0 = normHeader(r[0])
    return c0 === 'ល.រ' || c0.toLowerCase() === 'no'
  })
}

function excelSerialToISO(serial) {
  if (serial == null || typeof serial !== 'number') return null
  const ms = Math.round((serial - 25569) * 86400 * 1000)
  return new Date(ms).toISOString().slice(0, 10)
}

function parseWorkbook() {
  const wb = XLSX.readFile(WORKBOOK_PATH)
  const sheets = []
  wb.SheetNames.forEach((sheetName, sheetIdx) => {
    const meta = MONTH_META.get(sheetName)
    if (!meta) throw new Error(`Sheet "${sheetName}" is not in MONTH_TABLE - update the table before running.`)

    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false })
    const headerIdx = findHeaderIdx(rows)
    if (headerIdx === -1) throw new Error(`No header row found in sheet "${sheetName}"`)
    const colMap = classifyHeader(rows[headerIdx])

    const records = []
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i]
      const name = colMap.name != null ? normHeader(r[colMap.name]) : ''
      if (!name || name.toLowerCase() === 'name') continue
      records.push({
        rawName: name,
        role: colMap.role != null ? normHeader(r[colMap.role]) : null,
        dateISO: colMap.date != null ? excelSerialToISO(r[colMap.date]) : null,
        capital: colMap.capital != null ? r[colMap.capital] : null,
        saving: colMap.saving != null ? r[colMap.saving] : null,
        interest: colMap.interest != null ? r[colMap.interest] : null,
        balance: colMap.balance != null ? r[colMap.balance] : null,
        withdrawal: colMap.withdrawal != null ? r[colMap.withdrawal] : null,
        total: colMap.total != null ? r[colMap.total] : null,
      })
    }
    sheets.push({ sheetName, sheetIdx, meta, records })
  })
  return sheets
}

function normName(name) {
  return name.split('/')[0].replace(/\s+/g, ' ').trim().toUpperCase()
}

// ---------------------------------------------------------------------------
// Identity reconciliation (validated: 104 identities, 27 bridges, 0 ambiguous)
// ---------------------------------------------------------------------------
function reconcileIdentities(sheets) {
  const groups = new Map()
  let groupSeq = 1
  for (const sheet of sheets) {
    for (const rec of sheet.records) {
      const key = normName(rec.rawName)
      if (!groups.has(key)) {
        groups.set(key, { id: groupSeq++, key, displayNames: new Set(), roles: [], monthsByIdx: new Map() })
      }
      const g = groups.get(key)
      g.displayNames.add(rec.rawName)
      if (rec.role) g.roles.push({ sheetIdx: sheet.sheetIdx, role: rec.role })
      g.monthsByIdx.set(sheet.sheetIdx, { sheetName: sheet.sheetName, sheetIdx: sheet.sheetIdx, ...rec })
    }
  }
  const groupList = [...groups.values()]

  const parent = new Map(groupList.map((g) => [g.id, g.id]))
  function find(x) {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)))
      x = parent.get(x)
    }
    return x
  }

  const rootMonthIdxs = new Map(groupList.map((g) => [g.id, new Set(g.monthsByIdx.keys())]))
  function overlaps(rootA, rootB) {
    const a = rootMonthIdxs.get(rootA)
    const b = rootMonthIdxs.get(rootB)
    for (const idx of a) if (b.has(idx)) return true
    return false
  }
  function unionGuarded(a, b) {
    const ra = find(a)
    const rb = find(b)
    if (ra === rb) return true
    if (overlaps(ra, rb)) return false
    const merged = new Set([...rootMonthIdxs.get(ra), ...rootMonthIdxs.get(rb)])
    parent.set(ra, rb)
    rootMonthIdxs.set(rb, merged)
    return true
  }

  const TOL = 0.05
  const MAX_LOOKBACK = 3
  const bridgeLog = []

  for (let i = 1; i < sheets.length; i++) {
    const sheet = sheets[i]
    for (const rec of sheet.records) {
      if (rec.capital == null) continue
      const g = groups.get(normName(rec.rawName))
      if (g.monthsByIdx.has(i - 1)) continue

      for (let back = 1; back <= MAX_LOOKBACK && i - back >= 0; back++) {
        const candidates = []
        for (const g2 of groupList) {
          if (find(g2.id) === find(g.id)) continue
          if (overlaps(find(g.id), find(g2.id))) continue
          const prevRec = g2.monthsByIdx.get(i - back)
          if (!prevRec) continue
          const carry = prevRec.total ?? prevRec.balance
          if (carry == null) continue
          if (Math.abs(carry - rec.capital) < TOL) candidates.push({ g2, prevRec })
        }
        if (candidates.length === 1) {
          unionGuarded(g.id, candidates[0].g2.id)
          bridgeLog.push({ confidence: 'HIGH', from: [...candidates[0].g2.displayNames].join('|'), to: rec.rawName, toSheet: sheet.sheetName })
          break
        } else if (candidates.length > 1) {
          bridgeLog.push({ confidence: 'AMBIGUOUS', to: rec.rawName, toSheet: sheet.sheetName })
          break
        }
      }
    }
  }

  const canonical = new Map()
  for (const g of groupList) {
    const root = find(g.id)
    if (!canonical.has(root)) {
      canonical.set(root, { id: root, displayNames: new Set(), roles: [], monthsByIdx: new Map() })
    }
    const c = canonical.get(root)
    for (const n of g.displayNames) c.displayNames.add(n)
    c.roles.push(...g.roles)
    for (const [idx, rec] of g.monthsByIdx) c.monthsByIdx.set(idx, rec)
  }

  const ambiguous = bridgeLog.filter((b) => b.confidence === 'AMBIGUOUS')
  if (ambiguous.length > 0) {
    throw new Error(
      `Reconciliation produced ${ambiguous.length} ambiguous bridge(s) that were previously resolved to 0 - the source file may have changed. Re-run the analysis before proceeding.\n` +
        JSON.stringify(ambiguous, null, 2)
    )
  }

  return { identities: [...canonical.values()], bridgeCount: bridgeLog.length, finalSheetIdx: sheets.length - 1 }
}

// ---------------------------------------------------------------------------
// Derive member fields from a canonical identity
// ---------------------------------------------------------------------------
const KHMER_RE = /[ក-៿]/

function pickNames(displayNames) {
  const cleaned = [...displayNames].map((n) => n.split('/')[0].trim()).filter(Boolean)
  const khmer = cleaned.find((n) => KHMER_RE.test(n)) || null
  const latinCandidates = cleaned.filter((n) => !KHMER_RE.test(n))
  const latin = latinCandidates[latinCandidates.length - 1] || khmer || cleaned[0]
  return { khmer, latin }
}

function mapRole(roleStr) {
  if (!roleStr) return 'member'
  const s = roleStr.toLowerCase()
  if (roleStr.includes('ស្ថាបនិក') || s.includes('founder')) return 'founder'
  if (s.includes('co member') || s.includes('comember') || s.includes('co-member')) return 'comember'
  return 'member'
}

function slugify(latinName) {
  return latinName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'member'
}

function summarizeIdentity(identity, finalSheetIdx, usedSlugs) {
  const idxs = [...identity.monthsByIdx.keys()].sort((a, b) => a - b)
  const firstRec = identity.monthsByIdx.get(idxs[0])
  const lastRec = identity.monthsByIdx.get(idxs[idxs.length - 1])
  const { khmer, latin } = pickNames(identity.displayNames)

  const lastRole = identity.roles.length ? identity.roles.sort((a, b) => a.sheetIdx - b.sheetIdx).slice(-1)[0].role : null
  const role = mapRole(lastRole)

  const closing = lastRec.total ?? lastRec.balance ?? 0
  const presentAtEnd = idxs[idxs.length - 1] === finalSheetIdx
  const status = presentAtEnd || Math.abs(closing) >= 0.05 ? 'active' : 'withdrawn'

  let slug = slugify(latin)
  if (usedSlugs.has(slug)) {
    let n = 2
    while (usedSlugs.has(`${slug}${n}`)) n++
    slug = `${slug}${n}`
  }
  usedSlugs.add(slug)

  const firstMonthMeta = MONTH_META.get(firstRec.sheetName)
  const joinedAt = firstRec.dateISO || firstMonthMeta.savingFallback

  return {
    khmerName: khmer,
    latinName: latin,
    fullName: khmer ? `${khmer} | ${latin}` : latin,
    email: `${slug}${LEGACY_EMAIL_DOMAIN}`,
    role,
    status,
    joinedAt,
    months: idxs.map((idx) => identity.monthsByIdx.get(idx)),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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
  throw new Error('No active admin member found. Create an admin account before running this migration.')
}

async function cleanupPreviousImport() {
  const { data: members, error } = await admin.from('members').select('id, auth_user_id').like('email', `%${LEGACY_EMAIL_DOMAIN}`)
  if (error) throw error
  if (!members?.length) return

  const ids = members.map((m) => m.id)
  await admin.from('members').update({ referee_id: null }).in('referee_id', ids)
  await admin.from('savings').update({ verified_by: null, refunded_by: null }).in('verified_by', ids)
  await admin.from('savings').update({ refunded_by: null }).in('refunded_by', ids)
  await admin.from('saving_interest_payments').update({ verified_by: null }).in('verified_by', ids)

  const { error: deleteError } = await admin.from('members').delete().in('id', ids)
  if (deleteError) throw deleteError

  for (const m of members) {
    if (m.auth_user_id) await admin.auth.admin.deleteUser(m.auth_user_id)
  }
  console.log(`Removed ${members.length} previously imported legacy member(s).`)
}

async function insertBatched(table, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize)
    const { error } = await admin.from(table).insert(chunk)
    if (error) throw new Error(`Insert into ${table} failed at row ${i}: ${error.message}`)
  }
}

async function main() {
  console.log(DRY_RUN ? 'Running in --dry-run mode (no database writes)\n' : 'Migrating savings masterlist into Supabase...\n')

  const sheets = parseWorkbook()
  const { identities, bridgeCount, finalSheetIdx } = reconcileIdentities(sheets)
  console.log(`Parsed ${sheets.length} monthly sheets, reconciled ${identities.length} distinct people (${bridgeCount} name bridges applied).`)

  const usedSlugs = new Set()
  const summaries = identities.map((idn) => summarizeIdentity(idn, finalSheetIdx, usedSlugs))

  const totalSavingRows = summaries.reduce((sum, s) => sum + s.months.filter((m) => m.saving > 0).length, 0)
  const totalWithdrawalRows = summaries.reduce((sum, s) => sum + s.months.filter((m) => m.withdrawal > 0).length, 0)
  const totalInterestRows = summaries.reduce((sum, s) => sum + s.months.filter((m) => m.interest > 0).length, 0)
  const activeCount = summaries.filter((s) => s.status === 'active').length
  const withdrawnCount = summaries.filter((s) => s.status === 'withdrawn').length

  console.log(`People: ${summaries.length} (${activeCount} active, ${withdrawnCount} withdrawn)`)
  console.log(`Rows to insert: ${totalSavingRows} deposits, ${totalWithdrawalRows} withdrawals (as refunded), ${totalInterestRows} interest payments`)

  if (DRY_RUN) {
    console.log('\nSample of first 5 people:')
    for (const s of summaries.slice(0, 5)) {
      console.log(`  ${s.fullName}  <${s.email}>  role=${s.role} status=${s.status} joined=${s.joinedAt} months=${s.months.length}`)
    }
    console.log('\nDry run complete - no data was written.')
    return
  }

  await cleanupPreviousImport()
  const adminId = await resolveAdminId()

  const memberIdByLatinName = new Map()
  const savingRows = []
  const interestRows = []

  for (const s of summaries) {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: s.email,
      password: LEGACY_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: s.fullName, full_name_kh: s.khmerName, full_name_en: s.latinName },
    })
    if (authError) throw new Error(`auth.createUser failed for ${s.email}: ${authError.message}`)

    const { data: memberRow, error: memberError } = await admin
      .from('members')
      .insert({
        auth_user_id: authData.user.id,
        full_name: s.fullName,
        full_name_kh: s.khmerName,
        full_name_en: s.latinName,
        email: s.email,
        status: s.status,
        role: s.role,
        is_admin: false,
        referee_verified: false,
        joined_at: s.joinedAt,
        created_at: s.joinedAt,
      })
      .select('id')
      .single()
    if (memberError) throw new Error(`members insert failed for ${s.email}: ${memberError.message}`)

    memberIdByLatinName.set(s.email, memberRow.id)

    for (const m of s.months) {
      const meta = MONTH_META.get(m.sheetName)
      const savingDate = m.dateISO || meta.savingFallback
      const interestDate = m.dateISO || meta.interestFallback

      if (m.saving > 0) {
        savingRows.push({
          member_id: memberRow.id,
          amount: m.saving,
          currency: 'USD',
          saving_date: savingDate,
          status: 'verified',
          verified_by: adminId,
          verified_at: savingDate,
          created_at: savingDate,
          notes: `Imported from monthly ledger: ${m.sheetName}`,
        })
      }
      if (m.withdrawal > 0) {
        savingRows.push({
          member_id: memberRow.id,
          amount: m.withdrawal,
          currency: 'USD',
          saving_date: savingDate,
          status: 'refunded',
          refund_reason: `Historical withdrawal recorded in monthly ledger: ${m.sheetName}`,
          refunded_at: savingDate,
          refunded_by: adminId,
          created_at: savingDate,
          notes: `Imported from monthly ledger: ${m.sheetName}`,
        })
      }
      if (m.interest > 0) {
        interestRows.push({
          member_id: memberRow.id,
          period_year: meta.year,
          period_month: meta.month,
          amount: m.interest,
          currency: 'USD',
          interest_date: interestDate,
          status: 'completed',
          verified_by: adminId,
          verified_at: interestDate,
          created_at: interestDate,
        })
      }
    }
  }

  await insertBatched('savings', savingRows)
  await insertBatched('saving_interest_payments', interestRows)

  console.log('\n========================================')
  console.log(' Savings masterlist migration completed')
  console.log('========================================')
  console.log(`Imported ${summaries.length} members, ${savingRows.length} savings rows, ${interestRows.length} interest rows.`)
  console.log(`Legacy accounts use password: ${LEGACY_PASSWORD}`)
  console.log(`Legacy accounts are identifiable by the ${LEGACY_EMAIL_DOMAIN} email domain.`)
  console.log('========================================\n')
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message ?? error)
  process.exit(1)
})
