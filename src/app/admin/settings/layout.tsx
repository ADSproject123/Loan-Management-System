import { SettingsTabs } from './SettingsTabs'

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-border bg-surface px-6 py-3 md:px-8">
        <SettingsTabs />
      </div>
      {children}
    </>
  )
}
