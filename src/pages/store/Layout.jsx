import { Link } from 'react-router-dom'
import { IconShoppingBag, IconMenu2, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useStoreSettings } from '../../hooks/useStoreSettings'

export default function StoreLayout({ children, cart = [] }) {
  const { settings, loading } = useStoreSettings()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center"><p className="text-sm text-neutral-400">Cargando...</p></div>

  const fontLink = `https://fonts.googleapis.com/css2?family=${settings.font_family.replace(/ /g, '+')}:wght@400;500&display=swap`
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <>
      <link rel="stylesheet" href={fontLink} />
      <div className="min-h-screen" style={{ background: settings.secondary_color, fontFamily: settings.font_family }}>
        {/* Navbar */}
        <nav className="sticky top-0 z-40 border-b border-white/10" style={{ background: settings.navbar_color }}>
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              {settings.logo_url
                ? <img src={settings.logo_url} alt="logo" className="h-7 w-auto object-contain" />
                : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ background: 'rgba(255,255,255,0.15)' }}>{settings.store_name[0]}</div>
              }
              <span className="text-white text-sm font-medium">{settings.store_name}</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-white/70 hover:text-white text-sm transition">Inicio</Link>
              <Link to="/catalogo" className="text-white/70 hover:text-white text-sm transition">Catálogo</Link>
              <Link to="/carrito" className="relative text-white/70 hover:text-white transition">
                <IconShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-medium" style={{ background: settings.primary_color }}>
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>

        {/* Contenido */}
        {children}

        {/* Footer */}
        <footer className="border-t border-white/10 mt-16" style={{ background: settings.navbar_color }}>
          <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{settings.store_name}</p>
              <p className="text-white/40 text-xs mt-1">{settings.address}{settings.address && settings.phone ? ' · ' : ''}{settings.phone}</p>
            </div>
            {settings.cuit && <p className="text-white/40 text-xs">CUIT {settings.cuit}</p>}
          </div>
        </footer>
      </div>
    </>
  )
}