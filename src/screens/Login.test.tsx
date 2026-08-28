import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Login } from './Login'
import { I18nProvider } from '../i18n'

// signInWithGoogle "succeeds" the same way it does for a real aborted OAuth
// redirect: Supabase resolves without an error because the redirect was
// *initiated*, not because the user ended up authenticated. The page never
// actually navigates away in this scenario (user hits back, or the redirect
// itself gets interrupted) — the SPA stays mounted with `loading` stuck.
const signInWithGoogle = vi.fn().mockResolvedValue({})

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle,
    sendReset: vi.fn(),
  }),
}))

vi.mock('../auth/supabase', () => ({
  googleEnabled: true,
}))

function renderLogin() {
  return render(
    <I18nProvider>
      <Login onBack={() => {}} onDone={() => {}} />
    </I18nProvider>,
  )
}

describe('Login — Google-Button nach abgebrochenem Redirect', () => {
  beforeEach(() => {
    signInWithGoogle.mockClear()
  })

  it('bleibt nicht dauerhaft deaktiviert, wenn die Seite per bfcache wiederhergestellt wird', async () => {
    renderLogin()
    const button = screen.getByRole('button', { name: /google/i })

    fireEvent.click(button)
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(button).toBeDisabled())

    // Browser stellt die Seite aus dem bfcache wieder her (z. B. Zurück-Button
    // nach Abbruch auf der Google-Seite) — kein neuer Page-Load, React-State
    // bleibt wie er war.
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }))

    await waitFor(() => expect(button).not.toBeDisabled())
  })
})
