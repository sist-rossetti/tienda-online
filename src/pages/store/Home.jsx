import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPackage, IconArrowRight } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import StoreLayout from './Layout'

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
      <section className="relative min-h-[420px] flex items-center" style={{ background: settings.hero_image_url ? 'transparent' : '#222' }}>
        {settings.hero_image_url && <img src={settings.hero_image_url} alt="hero" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.15))' }}></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <h1 className="text-4xl font-medium text-white mb-3 tracking-tight" style={{ fontFamily: settings.font_family }}>{settings.hero_title}</h1>
          <p className="text-lg text-white/60 mb-8">{settings.hero_subtitle}</p>
          <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-full text-white transition hover:opacity-90" style={{ background: settings.primary_color }}>
            {settings.hero_btn_text} <IconArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-neutral-900" style={{ fontFamily: settings.font_family }}>Categorías</h2>
            <Link to="/catalogo" className="text-sm text-neutral-400 hover:text-neutral-600 transition flex items-center gap-1">Ver todas <IconArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {categorias.slice(0, 4).map(cat => (
              <Link key={cat.id} to={`/catalogo?cat=${cat.id}`} className="bg-white border border-neutral-200 rounded-2xl p-5 text-center hover:border-neutral-400 transition" style={{ borderRadius: settings.card_radius }}>
                <p className="text-sm font-medium text-neutral-900" style={{ fontFamily: settings.font_family }}>{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Productos destacados */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-neutral-900" style={{ fontFamily: settings.font_family }}>Destacados</h2>
          <Link to="/catalogo" className="text-sm text-neutral-400 hover:text-neutral-600 transition flex items-center gap-1">Ver todos <IconArrowRight size={14} /></Link>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.product_columns}, 1fr)` }}>
          {productos.map(p => (
            <div key={p.id} className="bg-white border border-neutral-200 overflow-hidden hover:border-neutral-400 transition" style={{ borderRadius: settings.card_radius }}>
              <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <IconPackage size={40} className="text-neutral-300" />
                }
              </div>
              <div className="p-4">
                <p className="text-xs text-neutral-400 mb-1">{p.categories?.name}</p>
                <p className="text-sm font-medium text-neutral-900 mb-3" style={{ fontFamily: settings.font_family }}>{p.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium" style={{ color: settings.price_color }}>${Number(p.price).toLocaleString('es-AR')}</p>
                  <button onClick={() => addToCart(p)} className="text-xs font-medium px-3 py-1.5 rounded-full text-white transition hover:opacity-80" style={{ background: settings.primary_color }}>
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </StoreLayout>
  )
}