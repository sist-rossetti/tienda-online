import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/equipo', label: 'Equipo' },
  { to: '/admin/ventas', label: 'Ventas' },
]

export default function AdminLayout({ children }) {
  const { employee, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <aside className="w-[148px] bg-neutral-900 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="w-6 h-6 bg-neutral-700 rounded-lg flex items-center justify-center text-white text-xs">
            S
          </div>
          <span className="text-white text-xs font-medium tracking-tight">abm-shop</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-neutral-800" />

          <NavLink
            to="/admin/estetica"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`
            }
          >
            Estética
          </NavLink>
        </nav>

        <div className="px-2 pb-4">
          <div className="h-px bg-neutral-800 mb-2" />
          <div className="px-3 py-2 mb-1">
            <p className="text-neutral-400 text-xs truncate">{employee?.name}</p>
            <p className="text-neutral-600 text-xs truncate">{employee?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}