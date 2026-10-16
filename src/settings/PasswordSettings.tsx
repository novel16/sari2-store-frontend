import SettingsForm from './SettingsForm'
import { settingsApi } from './api'

export default function PasswordSettings({
  onBusy,
  onSaved,
}: {
  onBusy: (value: boolean) => void
  onSaved: () => void
}) {
  return (
    <SettingsForm
      title="Password"
      description="Use 8–72 bytes. Other devices are signed out and old reset links are invalidated; this session stays active."
      onBusy={onBusy}
      onSaved={onSaved}
      save={async (data) => {
        await settingsApi.password({
          current_password: String(data.get('current_password')),
          password: String(data.get('password')),
          password_confirmation: String(data.get('password_confirmation')),
        })
      }}
    >
      <label className="field">
        <span>Current password</span>
        <input
          type="password"
          name="current_password"
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </label>
      <label className="field">
        <span>New password</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
        />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input
          type="password"
          name="password_confirmation"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
        />
      </label>
    </SettingsForm>
  )
}
