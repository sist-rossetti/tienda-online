import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStoreSettings } from '../hooks/useStoreSettings'
import { googleFontsUrl, contrastText } from '../lib/theme'
import TopNav from '../components/TopNav'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/equipo', label: 'Equipo' },
  { to: '/admin/ventas', label: 'Ventas' },
  { to: '/admin/cupones', label: 'Cupones' },
  { to: '/admin/estetica', label: 'Estética' },
]

export default function AdminLayout({ children }) {
  const { employee, signOut } = useAuth()
  const { settings, loading } = useStoreSettings()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  if (loading || !settings) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-sm text-stone-400">Cargando...</p></div>
  }

  const fontLink = googleFontsUrl([settings.font_family, settings.heading_font_family])
  const navText = contrastText(settings.navbar_color)

  const account = (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <p className="text-xs" style={{ color: navText }}>{employee?.name}</p>
        <p className="text-[10px] capitalize" style={{ color: navText, opacity: 0.5 }}>{employee?.role}</p>
      </div>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="text-xs uppercase tracking-widest hover:opacity-100 transition"
        style={{ color: navText, opacity: 0.7 }}
      >
        {signingOut ? '...' : 'Salir'}
      </button>
    </div>
  )

  return (
    <>
      <link rel="stylesheet" href={fontLink} />
      <div className="min-h-screen flex flex-col" style={{ background: settings.secondary_color, fontFamily: settings.font_family }}>
        <TopNav settings={settings} logoTo="/admin" links={navItems} right={account} mobileExtra={account} breakpoint="lg" />
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
