import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { googleFontsUrl } from '../lib/theme'

const fontLink = googleFontsUrl(['Bricolage Grotesque'])

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <link rel="stylesheet" href={fontLink} />
      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 w-full max-w-sm">
        <div className="w-11 h-11 bg-[#2B2119] rounded-2xl flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-medium text-stone-900 tracking-tight mb-1" style={{ fontFamily: 'Bricolage Grotesque' }}>Bienvenido</h1>
        <p className="text-sm text-stone-400 mb-7">Ingresá con tu cuenta de administrador</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@mitienda.com"
              autoComplete="username"
              required
              className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-900 outline-none focus:border-stone-400 transition"
            />
          </div>
          <div>
            <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-900 outline-none focus:border-stone-400 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2B2119] text-white rounded-full py-3 text-sm font-medium mt-1 disabled:opacity-50 transition"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión →'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-300 mt-5">¿Problemas para ingresar? Contactá al administrador</p>
      </div>
    </div>
  )
}