import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import type { AuthStore, AuthUser } from '../../auth/types'
import { useAuth } from '../../auth/useAuth'
import SettingsForm from '../../settings/SettingsForm'
import PasswordSettings from '../../settings/PasswordSettings'
import { settingsApi } from '../../settings/api'

export default function SettingsWorkspace({ user, store }: { user: AuthUser; store: AuthStore }) {
  const [tab, setTab] = useState('Store details')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const { replaceUser } = useAuth()
  const saved = () => setNotice(`${tab} saved.`)
  return (
    <>
      <PageHeader
        eyebrow="MAKE YOURSELF AT HOME"
        title="Store settings"
        description="Keep your saved store details and account up to date."
      />
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-forest"
        >
          {notice}
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="panel flex flex-wrap gap-2 p-2 lg:flex-col">
          {['Store details', 'Profile', 'Password'].map((value) => (
            <button
              key={value}
              disabled={busy}
              aria-current={tab === value ? 'page' : undefined}
              onClick={() => {
                setTab(value)
                setNotice('')
              }}
              className={`rounded-lg px-4 py-3 text-left text-sm ${tab === value ? 'bg-forest/7 font-semibold text-forest' : 'text-stone-500'}`}
            >
              {value}
            </button>
          ))}
        </nav>
        {tab === 'Store details' && (
          <SettingsForm
            title="Store details"
            description="New sales use these details. Existing saved summaries keep their original store information."
            onBusy={setBusy}
            onSaved={saved}
            save={async (data) =>
              replaceUser(
                (
                  await settingsApi.store(store.id, {
                    name: String(data.get('name')).trim(),
                    address: String(data.get('address')).trim(),
                    phone: String(data.get('phone')).trim(),
                  })
                ).data,
              )
            }
          >
            <label className="field">
              <span>Store name</span>
              <input
                name="name"
                autoComplete="organization"
                defaultValue={store.name}
                required
                maxLength={120}
              />
            </label>
            <label className="field">
              <span>Store address</span>
              <input
                name="address"
                autoComplete="street-address"
                defaultValue={store.address ?? ''}
                maxLength={255}
              />
            </label>
            <label className="field">
              <span>Store phone</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={store.phone ?? ''}
                maxLength={30}
              />
            </label>
            <p className="text-xs text-stone-500">Currency: PHP · Business timezone: Asia/Manila</p>
          </SettingsForm>
        )}
        {tab === 'Profile' && (
          <SettingsForm
            title="Profile"
            description="Changing your sign-in email requires your current password and signs out other devices."
            onBusy={setBusy}
            onSaved={saved}
            save={async (data) =>
              replaceUser(
                (
                  await settingsApi.profile({
                    name: String(data.get('name')).trim(),
                    email: String(data.get('email')).trim(),
                    current_password: String(data.get('current_password')),
                  })
                ).data,
              )
            }
          >
            <label className="field">
              <span>Your full name</span>
              <input
                name="name"
                autoComplete="name"
                defaultValue={user.name}
                required
                maxLength={120}
              />
            </label>
            <label className="field">
              <span>Sign-in email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user.email}
                required
                maxLength={254}
              />
            </label>
            <label className="field">
              <span>Current password (required when changing email)</span>
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                maxLength={72}
              />
            </label>
          </SettingsForm>
        )}
        {tab === 'Password' && (
          <PasswordSettings
            onBusy={setBusy}
            onSaved={() => setNotice('Password updated. Other devices have been signed out.')}
          />
        )}
      </div>
    </>
  )
}
