import { Link, useLocation } from 'react-router-dom'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { contrastText } from '../lib/theme'

// Clases con el breakpoint fijo en el string literal (Tailwind necesita verlas
// completas en el código fuente, no puede resolver un prefijo armado en runtime).
const BP = {
  sm: { row: 'hidden sm:flex', toggleRow: 'flex sm:hidden', toggle: 'sm:hidden', menu: 'sm:hidden' },
  lg: { row: 'hidden lg:flex', toggleRow: 'flex lg:hidden', toggle: 'lg:hidden', menu: 'lg:hidden' },
}

export default function TopNav({ settings, logoTo, links, right, mobileRight, mobileExtra, breakpoint = 'sm' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navText = contrastText(settings.navbar_color)
  const bp = BP[breakpoint]

  function isActive(link) {
    return link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
  }

  return (
    <nav className="sticky top-0 z-40" style={{ background: settings.navbar_color, borderBottom: `1px solid ${navText}1a` }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
        <Link to={logoTo} className="flex items-center gap-2.5 min-w-0">
          {settings.logo_url
            ? <img src={settings.logo_url} alt="logo" className="h-7 w-auto object-contain flex-shrink-0" />
            : <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ background: `${navText}26`, color: navText }}>{settings.store_name[0]}</div>
          }
          <span className="text-base font-medium tracking-tight truncate" style={{ color: navText, fontFamily: settings.heading_font_family }}>{settings.store_name}</span>
        </Link>

        <div className={`${bp.row} items-center gap-6`}>
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs uppercase tracking-widest transition hover:opacity-100 whitespace-nowrap"
              style={{ color: navText, opacity: isActive(link) ? 1 : 0.6, fontWeight: isActive(link) ? 600 : 500 }}
            >
              {link.label}
            </Link>
          ))}
          {right}
        </div>

        <div className={`${bp.toggleRow} items-center gap-4`}>
          {mobileRight}
          <button onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} style={{ color: navText }}>
            {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={`${bp.menu} px-5 pb-4 flex flex-col gap-3`} style={{ borderTop: `1px solid ${navText}1a` }}>
          {links.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest pt-3" style={{ color: navText, opacity: isActive(link) ? 1 : 0.7 }}>
              {link.label}
            </Link>
          ))}
          {mobileExtra}
        </div>
      )}
    </nav>
  )
}
