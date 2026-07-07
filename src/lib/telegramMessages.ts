/** Shared HTML formatting for Telegram bot and notification messages. */

const TG_DIVIDER = '────────────────────'

export function escapeTelegramHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function formatTelegramTitle(title: string) {
  return `<b>${escapeTelegramHtml(title)}</b>`
}

export function formatTelegramNotification(title: string, body: string, footer?: string) {
  const parts = [formatTelegramTitle(title), TG_DIVIDER, '', body]
  if (footer) {
    parts.push('', `<i>${escapeTelegramHtml(footer)}</i>`)
  }
  return parts.join('\n')
}

export function formatTelegramField(label: string, value: string) {
  return `<b>${escapeTelegramHtml(label)}</b>  ${value}`
}

export function formatTelegramBullet(value: string) {
  return `  • ${value}`
}

export function formatTelegramBulletLabeled(label: string, value: string) {
  return formatTelegramBullet(`<b>${escapeTelegramHtml(label)}</b>  ${value}`)
}

export function formatTelegramSection(title: string, lines: string[]) {
  const body = lines.filter(Boolean).join('\n')
  return `${formatTelegramTitle(title)}\n${body}`
}

/** Structured body for admin Telegram alerts (title applied separately via notifyAdmins). */
export function tgAdminRequestBody(options: {
  memberName: string
  fields?: Array<{ label: string; value: string }>
  note?: string
}) {
  const lines = [
    formatTelegramField('សមាជិក', escapeTelegramHtml(options.memberName)),
    ...(options.fields?.map((field) => formatTelegramField(field.label, field.value)) ?? []),
  ]
  if (options.note) {
    lines.push('', options.note)
  }
  return lines.join('\n')
}

/** Structured body for member status Telegram notifications (title applied separately). */
export function tgMemberUpdateBody(options: {
  message: string
  fields?: Array<{ label: string; value: string }>
  reason?: string
}) {
  const lines: string[] = []
  if (options.fields?.length) {
    lines.push(...options.fields.map((field) => formatTelegramField(field.label, field.value)))
    lines.push('')
  }
  lines.push(options.message)
  if (options.reason) {
    lines.push('', formatTelegramField('មូលហេតុ', escapeTelegramHtml(options.reason)))
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// System / account
// ---------------------------------------------------------------------------

export const TG_WELCOME_UNLINKED = formatTelegramNotification(
  'សូមស្វាគមន៍',
  [
    'ដើម្បីភ្ជាប់គណនីរបស់អ្នក សូមប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនពីអ្នកគ្រប់គ្រង ឬចូលគណនីតាមកម្មវិធីហើយជ្រើសរើស <b>ភ្ជាប់ Telegram</b>។',
    '',
    'បន្ទាប់ពីភ្ជាប់រួច អ្នកអាចមើលសមតុល្យ និងទទួលការជូនដំណឹងតាមប្រព័ន្ធនេះ។',
  ].join('\n')
)

export const TG_ACCOUNT_NOT_LINKED = formatTelegramNotification(
  'គណនីមិនទាន់ភ្ជាប់',
  'Telegram នេះមិនទាន់ត្រូវបានភ្ជាប់ជាមួយគណនីសមាជិកទេ។ សូមប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួន ឬចូលគណនីក្នុងកម្មវិធី។'
)

export const TG_ACCOUNT_NOT_ACTIVE = formatTelegramNotification(
  'គណនីមិនទាន់សកម្ម',
  'គណនីរបស់អ្នកមិនទាន់សកម្មទេ។ សូមរង់ចាំអ្នកគ្រប់គ្រងទទួលយកគណនីមុនពេលប្រើប្រាស់មុខងារសន្សំ និងកម្ជី។'
)

export function tgLinkInvalidToken() {
  return formatTelegramNotification(
    'តំណភ្ជាប់មិនត្រឹមត្រូវ',
    'តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ។ សូមស្នើតំណថ្មីពីអ្នកគ្រប់គ្រង ឬចូលគណនីក្នុងកម្មវិធី។'
  )
}

export function tgLinkDuplicateAccount() {
  return formatTelegramNotification(
    'មិនអាចភ្ជាប់បាន',
    'គណនី Telegram នេះត្រូវបានភ្ជាប់ជាមួយសមាជិកផ្សេងរួចហើយ។'
  )
}

export function tgLinkFailed() {
  return formatTelegramNotification(
    'មានបញ្ហាក្នុងការភ្ជាប់',
    'មិនអាចភ្ជាប់គណនីបានទេ។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។'
  )
}

export function tgLinkSuccess(memberName: string) {
  return formatTelegramNotification(
    'ភ្ជាប់គណនីបានជោគជ័យ',
    [
      formatTelegramField('សមាជិក', escapeTelegramHtml(memberName)),
      '',
      'អ្នកនឹងទទួលការជូនដំណឹង និងអាចប្រើប្រាស់មុខងារតាម Telegram បានពីពេលនេះតទៅ។',
    ].join('\n')
  )
}

// ---------------------------------------------------------------------------
// Savings
// ---------------------------------------------------------------------------

export const TG_SAVINGS_EMPTY = formatTelegramNotification(
  'របាយការណ៍ការសន្សំ',
  'មិនទាន់មានកំណត់ត្រាការសន្សំទេ។'
)

export function tgSavingsReport(options: {
  memberName: string
  grandTotal: string
  verifiedTotal: string
  pendingTotal: string
  recentLines: string[]
  moreCount?: number
}) {
  const lines = [
    formatTelegramField('សមាជិក', escapeTelegramHtml(options.memberName)),
    '',
    formatTelegramSection('សរុបសមតុល្យ', [
      formatTelegramBulletLabeled('សរុប', options.grandTotal),
      formatTelegramBulletLabeled('បានផ្ទៀងផ្ទាត់', options.verifiedTotal),
      formatTelegramBulletLabeled('កំពុងរង់ចាំ', options.pendingTotal),
    ]),
    '',
    formatTelegramSection('ប្រវត្តិថ្មីៗ', options.recentLines),
  ]

  if (options.moreCount && options.moreCount > 0) {
    lines.push('', `<i>មានកំណត់ត្រាបន្ថែមទៀត ${options.moreCount}។ សូមបើកកម្មវិធីដើម្បីមើលទាំងអស់។</i>`)
  }

  return formatTelegramNotification('របាយការណ៍ការសន្សំ', lines.join('\n'))
}

export function tgSavingTransactionLine(date: string, amount: string, status: string) {
  return formatTelegramBullet(`${date}  ·  ${amount}  ·  ${status}`)
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

export const TG_LOAN_NONE_ACTIVE = formatTelegramNotification(
  'របាយការណ៍កម្ជី',
  'មិនមានកម្ជីសកម្មទេ។'
)

export function tgLoanNoneActiveWithStatus(statusLabel: string) {
  return formatTelegramNotification(
    'របាយការណ៍កម្ជី',
    [
      'មិនមានកម្ជីសកម្មទេ។',
      '',
      formatTelegramField('ស្ថានភាពពាក្យសុំចុងក្រោយ', statusLabel),
    ].join('\n')
  )
}

export function tgLoanReport(options: {
  memberName: string
  principal: string
  termMonths: number
  rate: number
  dueDate?: string
  totalPaid: string
  pendingPaid?: string
  remaining: string
  unpaidMonths: number
  scheduleLines: string[]
  scheduleMoreCount?: number
  fullyPaid: boolean
}) {
  const summary = [
    formatTelegramField('សមាជិក', escapeTelegramHtml(options.memberName)),
    '',
    formatTelegramSection('ព័ត៌មានកម្ជី', [
      formatTelegramBulletLabeled('ចំនួនដើម', options.principal),
      formatTelegramBulletLabeled('រយៈពេល', `${options.termMonths} ខែ`),
      formatTelegramBulletLabeled('អត្រាការប្រាក់', `${options.rate}% ក្នុងមួយខែ`),
      ...(options.dueDate ? [formatTelegramBulletLabeled('ថ្ងៃផុតកំណត់', options.dueDate)] : []),
    ]),
    '',
    formatTelegramSection('ស្ថានភាពបង់ប្រាក់', [
      formatTelegramBulletLabeled('បានបង់', options.totalPaid),
      ...(options.pendingPaid ? [formatTelegramBulletLabeled('កំពុងផ្ទៀងផ្ទាត់', options.pendingPaid)] : []),
      formatTelegramBulletLabeled('នៅសល់', `${options.remaining} (${options.unpaidMonths} ខែ)`),
    ]),
  ]

  if (options.fullyPaid) {
    summary.push('', '<b>កម្ជីត្រូវបានសងពេញលេញហើយ។</b>')
  } else if (options.scheduleLines.length > 0) {
    summary.push(
      '',
      formatTelegramSection('តារាបង់ប្រចាំខែ', options.scheduleLines)
    )
    if (options.scheduleMoreCount && options.scheduleMoreCount > 0) {
      summary.push(`<i>មានខែបង់បន្ថែមទៀត ${options.scheduleMoreCount}។</i>`)
    }
  }

  return formatTelegramNotification('របាយការណ៍កម្ជី', summary.join('\n'))
}

export function tgLoanScheduleLine(date: string, amount: string, status: string, paidNote?: string) {
  const paid = paidNote ? `  <i>(${paidNote})</i>` : ''
  return formatTelegramBullet(`${date}  ·  ${amount}  ·  ${status}${paid}`)
}

export const LOAN_STATUS_LABEL: Record<string, string> = {
  pending: 'រង់ចាំ',
  under_review: 'កំពុងពិនិត្យ',
  approved: 'បានអនុម័ត',
  active: 'សកម្ម',
  completed: 'បានបញ្ចប់',
  rejected: 'បានបដិសេធ',
}

export const SAVING_STATUS_LABEL: Record<string, string> = {
  pending: 'រង់ចាំ',
  verified: 'បានផ្ទៀងផ្ទាត់',
  completed: 'បានបញ្ចប់',
  refunded: 'បានសងត្រឡប់',
}

export const SCHEDULE_STATUS_LABEL: Record<string, string> = {
  paid: 'បានបង់',
  partial: 'បង់មិនពេញ',
  overdue: 'ហួសកំណត់',
  pending: 'មិនទាន់បង់',
}

// ---------------------------------------------------------------------------
// Payments & requests
// ---------------------------------------------------------------------------

export function tgPaySavingCaption() {
  return formatTelegramNotification(
    'ដាក់ស្នើការសន្សំ',
    [
      'សូមស្កេន KHQR ខាងលើដើម្បីធ្វើការបង់ប្រាក់។',
      '',
      formatTelegramTitle('ជំហានបន្ទាប់'),
      formatTelegramBullet('ផ្ញើរូបភាពបញ្ជាក់ការបង់ប្រាក់'),
      formatTelegramBullet('បញ្ជាក់ចំនួនទឹកប្រាក់ក្នុង caption ឬសារបន្ទាប់ (ឧ. <code>50</code>)'),
    ].join('\n')
  )
}

export function tgPayLoanCaption(dueAmount: string) {
  return formatTelegramNotification(
    'ដាក់ស្នើការសងកម្ជី',
    [
      formatTelegramField('ចំនួនត្រូវបង់ខែនេះ', dueAmount),
      '',
      'សូមស្កេន KHQR ខាងលើដើម្បីធ្វើការបង់ប្រាក់។',
      '',
      'បន្ទាប់មក សូមផ្ញើរូបភាពបញ្ជាក់ជាការឆ្លើយតបទៅសារនេះ។',
    ].join('\n')
  )
}

export function tgSubmissionReceived(type: 'saving' | 'loan', amount: string) {
  const title = type === 'saving' ? 'បានទទួលសំណើសន្សំ' : 'បានទទួលសំណើសងកម្ជី'
  return formatTelegramNotification(
    title,
    [
      formatTelegramField('ចំនួន', amount),
      formatTelegramField('ស្ថានភាព', 'កំពុងរង់ចាំការផ្ទៀងផ្ទាត់'),
      '',
      'អ្នកគ្រប់គ្រងនឹងពិនិត្យ និងជូនដំណឹងលទ្ធផលដល់អ្នកឆាប់ៗនេះ។',
    ].join('\n')
  )
}

export function tgLoanRequestStart(maxAmount: string) {
  return formatTelegramNotification(
    'ស្នើសុំកម្ជី',
    [
      formatTelegramField('ចំនួនអតិបរមាដែលអាចស្នើ', maxAmount),
      '',
      'សូមវាយចំនួនដែលអ្នកចង់កម្ចី (ដុល្លារ)។',
      '<i>ឧទាហរណ៍: <code>500</code></i>',
    ].join('\n')
  )
}

export function tgLoanRequestSubmitted(options: {
  amount: string
  termMonths: number
  rate: number
  purpose: string
}) {
  return formatTelegramNotification(
    'បានដាក់ស្នើសុំកម្ជី',
    [
      formatTelegramField('ចំនួន', options.amount),
      formatTelegramField('រយៈពេល', `${options.termMonths} ខែ`),
      formatTelegramField('អត្រាការប្រាក់', `${options.rate}% ក្នុងមួយខែ`),
      formatTelegramField('គោលបំណង', escapeTelegramHtml(options.purpose)),
      '',
      formatTelegramField('ស្ថានភាព', 'កំពុងពិនិត្យ'),
      '',
      'អ្នកគ្រប់គ្រងនឹងពិនិត្យពាក្យសុំរបស់អ្នកឆាប់ៗនេះ។ ប្រើ /loan ដើម្បីតាមដានស្ថានភាព។',
    ].join('\n')
  )
}

// ---------------------------------------------------------------------------
// Errors & prompts
// ---------------------------------------------------------------------------

export function tgErrorGeneric(context?: string) {
  return formatTelegramNotification(
    'មានបញ្ហាបច្ចេកទេស',
    context ?? 'មិនអាចបញ្ចប់សំណើបានទេ។ សូមព្យាយាមម្តងទៀត។'
  )
}

export function tgErrorStorage() {
  return tgErrorGeneric('មិនអាចរក្សាទុកទិន្នន័យបានទេ។ សូមព្យាយាមម្តងទៀត។')
}

export function tgErrorPhotoDownload() {
  return tgErrorGeneric('មិនអាចទាញយករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។')
}

export function tgErrorPhotoUpload() {
  return tgErrorGeneric('មិនអាចរក្សាទុករូបភាពបានទេ។')
}

export function tgErrorSession(command: string) {
  return tgErrorGeneric(`មិនអាចចាប់ផ្ទុកស្ថានភាពបានទេ។ សូមប្រើ ${command} ម្តងទៀត។`)
}

export function tgPromptAmountSaved(amount: string) {
  return formatTelegramNotification(
    'បានរក្សាទុកចំនួន',
    [
      formatTelegramField('ចំនួន', amount),
      '',
      'សូមផ្ញើរូបភាពបញ្ជាក់ការបង់ប្រាក់ជាសារបន្ទាប់។',
    ].join('\n')
  )
}

export function tgPromptPhotoSaved() {
  return formatTelegramNotification(
    'បានរក្សាទុករូបភាព',
    'សូមផ្ញើចំនួនទឹកប្រាក់ជាសារបន្ទាប់ (ឧ. <code>50</code>)។'
  )
}

export function tgPromptValidAmount() {
  return formatTelegramNotification(
    'ចំនួនមិនត្រឹមត្រូវ',
    'សូមផ្ញើចំនួនទឹកប្រាក់ជាលេខ (ឧ. <code>50</code>)។'
  )
}

export function tgPromptUsePaymentCommand() {
  return formatTelegramNotification(
    'រូបភាពបញ្ជាក់',
    'ដើម្បីដាក់ស្នើការបង់ប្រាក់ សូមប្រើ /paysaving ឬ /payloan ជាមុនសិន។'
  )
}

export function tgMinSavingAmount(min: string) {
  return formatTelegramNotification(
    'ចំនួនទាបពេក',
    `ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ ${min}។`
  )
}

export function tgLoanRequestBlocked(statusLabel: string) {
  return formatTelegramNotification(
    'មិនអាចស្នើសុំបាន',
    [
      formatTelegramField('ស្ថានភាពកម្ជីបច្ចុប្បន្ន', statusLabel),
      '',
      'ប្រើ /loan ដើម្បីមើលព័ត៌មានលម្អិត។',
    ].join('\n')
  )
}

export function tgLoanRequestNoSavings() {
  return formatTelegramNotification(
    'មិនអាចស្នើសុំបាន',
    [
      'អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលស្នើសុំកម្ជី។',
      '',
      'ប្រើ /saving ដើម្បីមើលសមតុល្យសន្សំរបស់អ្នក។',
    ].join('\n')
  )
}

export function tgVerificationCode(actionLabel: string, code: string) {
  return formatTelegramNotification(
    'លេខកូដផ្ទៀងផ្ទាត់',
    [
      formatTelegramField('ប្រភេទ', actionLabel),
      formatTelegramField('លេខកូដ', `<code>${code}</code>`),
      '',
      'លេខកូដនេះមានសុពលភាព ៥ នាទី។ សូមកុំចែករំលែកជាមួយអ្នកដទៃ។',
    ].join('\n')
  )
}

export function tgAdminAlert(title: string, body: string) {
  return formatTelegramNotification(title, body)
}
