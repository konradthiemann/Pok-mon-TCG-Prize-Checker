import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Drawer } from './Drawer'
import { I18nProvider } from '../i18n'

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, configured: false, signOut: vi.fn() }),
}))

function renderDrawer(open: boolean) {
  render(
    <I18nProvider>
      <Drawer
        open={open}
        theme="light"
        onClose={() => {}}
        onToggleTheme={() => {}}
        onLogin={() => {}}
        onAccount={() => {}}
        onLegal={() => {}}
      />
    </I18nProvider>,
  )
}

beforeEach(() => localStorage.setItem('pc_lang_v1', 'de'))
afterEach(cleanup)

describe('Drawer', () => {
  it('ist geschlossen unsichtbar, damit Tab-Fokus nicht im versteckten Menü landet', () => {
    renderDrawer(false)
    expect(screen.getByText('English')).not.toBeVisible()
  })

  it('ist geöffnet sichtbar', () => {
    renderDrawer(true)
    expect(screen.getByRole('button', { name: 'English' })).toBeVisible()
  })
})
