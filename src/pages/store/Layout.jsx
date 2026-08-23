import { Link } from 'react-router-dom'
import { IconShoppingBag } from '@tabler/icons-react'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import { googleFontsUrl, contrastText } from '../../lib/theme'
import TopNav from '../../components/TopNav'

const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
]

export default function StoreLayout({ children, cart = [] }) {
  const { settings, loading } = useStoreSettings()

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-sm text-stone-400">Cargando...</p></div>

  const fontLink = googleFontsUrl([settings.font_family, settings.heading_font_family])
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)
  const navText = contrastText(settings.navbar_color)

  const cartLink = (
    <Link to="/carrito" className="relative transition hover:opacity-100" style={{ color: navText, opacity: 0.85 }}>
      <IconShoppingBag size={20} />
      {totalItems > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-medium" style={{ background: settings.primary_color }}>
          {totalItems}
        </span>
      )}
    </Link>
  )

  return (
    <>
      <link rel="stylesheet" href={fontLink} />
      <div className="min-h-screen flex flex-col" style={{ background: settings.secondary_color, fontFamily: settings.font_family }}>
        <TopNav settings={settings} logoTo="/" links={NAV_LINKS} right={cartLink} mobileRight={cartLink} />

        {/* Contenido */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        <footer className="mt-16" style={{ background: settings.navbar_color, borderTop: `1px solid ${navText}1a` }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm font-medium" style={{ color: navText, fontFamily: settings.heading_font_family }}>{settings.store_name}</p>
              <p className="text-xs mt-1" style={{ color: navText, opacity: 0.5 }}>{settings.address}{settings.address && settings.phone ? ' · ' : ''}{settings.phone}</p>
            </div>
            {settings.cuit && <p className="text-xs" style={{ color: navText, opacity: 0.5 }}>CUIT {settings.cuit}</p>}
          </div>
        </footer>
      </div>
    </>
  )
}
