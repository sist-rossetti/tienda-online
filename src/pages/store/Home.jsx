import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPackage, IconArrowRight } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import StoreLayout from './Layout'

function WaveDivider({ color }) {
  return (
    <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="block w-full h-8 sm:h-12" aria-hidden="true">
      <path d="M0,24 C240,48 480,0 720,16 C960,32 1200,0 1440,20 L1440,48 L0,48 Z" fill={color} />
    </svg>
  )
}

export default function Home({ cart, setCart }) {
  const { settings } = useStoreSettings()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    supabase.from('products').select('*, categories(name)').eq('active', true).gt('stock', 0).limit(6).order('created_at', { ascending: false }).then(({ data }) => setProductos(data || []))
    supabase.from('categories').select('*').eq('active', true).is('parent_id', null).then(({ data }) => setCategorias(data || []))
  }, [])

  function addToCart(producto) {
    setCart(prev => {
      const existing = prev.find(i => i.id === producto.id)
      if (existing) return prev.map(i => i.id === producto.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...producto, quantity: 1 }]
    })
  }

  if (!settings) return null

  return (
    <StoreLayout cart={cart}>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-10 sm:pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] font-medium text-stone-900 mb-4 tracking-tight" style={{ fontFamily: settings.heading_font_family, color: settings.price_color }}>
              {settings.hero_title}
            </h1>
            <p className="text-base text-stone-500 mb-8 max-w-md">{settings.hero_subtitle}</p>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest px-6 py-3 transition hover:text-white"
              style={{ border: `1.5px solid ${settings.primary_color}`, color: settings.primary_color, borderRadius: Math.min(settings.card_radius, 6) }}
              onMouseEnter={e => { e.currentTarget.style.background = settings.primary_color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {settings.hero_btn_text} <IconArrowRight size={15} />
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <div className="aspect-[4/3] overflow-hidden" style={{ borderRadius: settings.card_radius }}>
              {settings.hero_image_url
                ? <img src={settings.hero_image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center" style={{ background: `${settings.primary_color}14` }}>
                    <IconPackage size={56} style={{ color: settings.primary_color, opacity: 0.35 }} />
                  </div>
              }
            </div>
          </div>
        </div>
      </section>

      <WaveDivider color={`${settings.primary_color}26`} />

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-medium text-stone-900" style={{ fontFamily: settings.heading_font_family }}>Categorías</h2>
            <Link to="/catalogo" className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-600 transition flex items-center gap-1">Ver todas <IconArrowRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {categorias.slice(0, 4).map(cat => (
              <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="bg-white p-5 text-center transition hover:opacity-70" style={{ borderRadius: settings.card_radius, border: '1px solid rgba(0,0,0,0.08)' }}>
                <p className="text-sm font-medium text-stone-900" style={{ fontFamily: settings.heading_font_family }}>{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Productos destacados */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-stone-900" style={{ fontFamily: settings.heading_font_family }}>Destacados</h2>
          <Link to="/catalogo" className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-600 transition flex items-center gap-1">Ver todos <IconArrowRight size={12} /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-4 sm:gap-6" style={{ '--cols': settings.product_columns }}>
          {productos.map(p => (
            <div key={p.id} className="flex flex-col">
              <div className="aspect-square bg-stone-100 overflow-hidden mb-3" style={{ borderRadius: settings.card_radius }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><IconPackage size={32} className="text-stone-300" /></div>
                }
              </div>
              <p className="text-xs uppercase tracking-wide text-stone-400 mb-1">{p.categories?.name}</p>
              <p className="text-sm font-medium text-stone-900 mb-1" style={{ fontFamily: settings.heading_font_family }}>{p.name}</p>
              <p className="text-sm mb-3" style={{ color: settings.price_color }}>${Number(p.price).toLocaleString('es-AR')}</p>
              <button
                onClick={() => addToCart(p)}
                className="mt-auto w-full text-xs font-medium uppercase tracking-widest py-2.5 transition hover:text-white"
                style={{ border: `1px solid ${settings.primary_color}`, color: settings.primary_color, borderRadius: Math.min(settings.card_radius, 6) }}
                onMouseEnter={e => { e.currentTarget.style.background = settings.primary_color }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      </section>
    </StoreLayout>
  )
}
