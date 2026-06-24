'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Pencil, Percent, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { adminFieldClassName, AdminActionsMenu, AdminActionsMenuItem, adminTable } from '@/components/admin'
import { deleteLoanInterestPlan, saveLoanInterestPlan } from '@/app/actions/admin'
import { showError } from '@/lib/toast'
import { MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import type { LoanInterestPlan } from '@/lib/loanInterestPlans'
import type { MemberRole } from '@/types/database'

const ROLE_OPTIONS: MemberRole[] = ['founder', 'comember', 'member']

type LoanInterestPlansManagerProps = {
  plans: LoanInterestPlan[]
  globalMonthlyLoanInterestRate: number
}

type DraftPlan = {
  planId: string | null
  name: string
  monthlyRate: string
  description: string
  isActive: boolean
  appliesToRole: MemberRole | ''
}

const emptyDraft = (): DraftPlan => ({
  planId: null,
  name: '',
  monthlyRate: '',
  description: '',
  isActive: true,
  appliesToRole: '',
})

export function LoanInterestPlansManager({
  plans,
  globalMonthlyLoanInterestRate,
}: LoanInterestPlansManagerProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<DraftPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startCreate = () => setDraft(emptyDraft())

  const startEdit = (plan: LoanInterestPlan) => {
    setDraft({
      planId: plan.id,
      name: plan.name,
      monthlyRate: String(plan.monthlyRate),
      description: plan.description ?? '',
      isActive: plan.isActive,
      appliesToRole: plan.appliesToRole ?? '',
    })
  }

  const submitDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return

    setLoading(true)
    const payload = new FormData()
    if (draft.planId) payload.append('plan_id', draft.planId)
    payload.append('name', draft.name)
    payload.append('monthly_rate', draft.monthlyRate)
    payload.append('description', draft.description)
    payload.append('is_active', draft.isActive ? 'true' : 'false')
    payload.append('applies_to_role', draft.appliesToRole)

    const result = await saveLoanInterestPlan(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។')
      return
    }

    setDraft(null)
    router.refresh()
  }

  const handleDelete = async (planId: string) => {
    setDeletingId(planId)
    const payload = new FormData()
    payload.append('id', planId)
    const result = await deleteLoanInterestPlan(payload)
    setDeletingId(null)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចលុបបានទេ។')
      return
    }

    router.refresh()
  }

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">អត្រាកម្ជីជាក្រុម</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              បង្កើតអត្រាកម្ជីច្រើន ហើយចាត់ចែងទៅសមាជិកផ្សេងៗ។ សមាជិកដែលមិនត្រូវបានចាត់ចែងនឹងប្រើអត្រាទូទៅ (
              {globalMonthlyLoanInterestRate}% ប្រចាំខែ)។
            </p>
          </div>
        </div>
        {!draft && (
          <Button type="button" size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            បង្កើតអត្រា
          </Button>
        )}
      </div>

      {draft ? (
        <form onSubmit={submitDraft} className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            {draft.planId ? 'កែប្រែអត្រាកម្ជី' : 'បង្កើតអត្រាកម្ជីថ្មី'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="plan-name">
                ឈ្មោះអត្រា
              </label>
              <input
                id="plan-name"
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="ឧ. សមាជិក VIP"
                className={`${adminFieldClassName} mt-2 w-full px-3 py-2.5`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="plan-rate">
                អត្រា (% ប្រចាំខែ)
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Percent className="h-4 w-4" />
                </span>
                <input
                  id="plan-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={draft.monthlyRate}
                  onChange={(event) => setDraft({ ...draft, monthlyRate: event.target.value })}
                  onWheel={(event) => event.currentTarget.blur()}
                  className={`${adminFieldClassName} w-full py-2.5 pl-10 pr-4`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="plan-role">
                អនុវត្តសម្រាប់តួនាទី
              </label>
              <select
                id="plan-role"
                value={draft.appliesToRole}
                onChange={(event) =>
                  setDraft({ ...draft, appliesToRole: event.target.value as MemberRole | '' })
                }
                className={`${adminFieldClassName} mt-2 w-full px-3 py-2.5`}
              >
                <option value="">ទាំងអស់</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {MEMBER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                ជ្រើស «ទាំងអស់» ដើម្បីអនុញ្ញាតឱ្យចាត់ចែងទៅគ្រប់តួនាទី។
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="plan-description">
              ការពិពណ៌នា (ជម្រើស)
            </label>
            <textarea
              id="plan-description"
              rows={2}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className={`${adminFieldClassName} mt-2 w-full px-3 py-2.5`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            />
            អត្រានេះសកម្ម (អាចចាត់ចែងទៅសមាជិក)
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={loading} size="sm">
              រក្សាទុក
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft(null)}>
              បោះបង់
            </Button>
          </div>
        </form>
      ) : null}

      {plans.length === 0 ? (
        <p className="text-sm text-slate-500">មិនទាន់មានអត្រាកម្ជីជាក្រុមទេ។ ចុច «បង្កើតអត្រា» ដើម្បីបង្កើត។</p>
      ) : (
        <div className={`${adminTable.wrap} rounded-xl border border-border`}>
          <table className={adminTable.table}>
            <thead className={adminTable.thead}>
              <tr className={adminTable.thRow}>
                <th className={adminTable.th}>ឈ្មោះ</th>
                <th className={adminTable.th}>អត្រា</th>
                <th className={adminTable.th}>តួនាទី</th>
                <th className={adminTable.th}>ការពិពណ៌នា</th>
                <th className={adminTable.th}>ស្ថានភាព</th>
                <th className={adminTable.thLast}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className={adminTable.tbody}>
              {plans.map((plan) => (
                <tr key={plan.id} className={adminTable.tr}>
                  <td className={adminTable.td}>
                    <p className={adminTable.namePrimary}>{plan.name}</p>
                  </td>
                  <td className={`${adminTable.td} tabular-nums text-foreground`}>{plan.monthlyRate}%</td>
                  <td className={adminTable.td}>
                    {plan.appliesToRole ? MEMBER_ROLE_LABELS[plan.appliesToRole] : 'ទាំងអស់'}
                  </td>
                  <td className={`max-w-xs ${adminTable.tdMuted}`}>
                    {plan.description || '—'}
                  </td>
                  <td className={adminTable.td}>
                    <span className={plan.isActive ? 'text-sm font-medium text-emerald-600' : 'text-sm text-muted'}>
                      {plan.isActive ? 'សកម្ម' : 'មិនសកម្ម'}
                    </span>
                  </td>
                  <td className={adminTable.tdLast}>
                    <AdminActionsMenu align="left">
                      <AdminActionsMenuItem icon={Pencil} label="កែ" onClick={() => startEdit(plan)} />
                      <AdminActionsMenuItem
                        icon={Trash2}
                        label="លុប"
                        destructive
                        disabled={deletingId === plan.id}
                        onClick={() => handleDelete(plan.id)}
                      />
                    </AdminActionsMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
