import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconPackage, IconSearch, IconArrowRight } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import StoreLayout from './Layout'

export default function Catalogo({ cart, setCart }) {
  const { settings } = useStoreSettings()
  const [searchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(searchParams.get('cat') || '')
  const [precioMax, setPrecioMax] = useState(200000)
  const [soloStock, setSoloStock] = useState(true)
  const [orden, setOrden] = useState('reciente')

  useEffect(() => {
    supabase.from('categories').select('*').eq('active', true).then(({ data }) => setCategorias(data || []))
    fetchProductos()
  }, [])

  async function fetchProductos() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, categories(id, name, parent_id)').eq('active', true)
    setProductos(data || [])
    setLoading(false)
  }

  function addToCart(producto) {
    setCart(prev => {
      const existing = prev.find(i => i.id === producto.id)
      if (existing) return prev.map(i => i.id === producto.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...producto, quantity: 1 }]
    })
  }

  const padres = categorias.filter(c => !c.parent_id)
  const subcategorias = categorias.filter(c => c.parent_id)

  const filtered = productos
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchStock = soloStock ? p.stock > 0 : true
      const matchPrecio = Number(p.price) <= precioMax
      let matchCat = true
      if (catFilter) {
        const esPadre = padres.find(c => c.id === catFilter)
        if (esPadre) {
          const hijos = subcategorias.filter(s => s.parent_id === catFilter).map(s => s.id)
          matchCat = p.category_id === catFilter || hijos.includes(p.category_id)
        } else {
          matchCat = p.category_id === catFilter
        }
      }
      return matchSearch && matchStock && matchPrecio && matchCat
    })
    .sort((a, b) => {
      if (orden === 'precio_asc') return Number(a.price) - Number(b.price)
      if (orden === 'precio_desc') return Number(b.price) - Number(a.price)
      return new Date(b.created_at) - new Date(a.created_at)
    })

  if (!settings) return null

  return (
    <StoreLayout cart={cart}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-52 flex-shrink-0">
            <h2 className="text-sm font-medium text-neutral-900 mb-5" style={{ fontFamily: settings.font_family }}>Filtros</h2>
            <div className="mb-5">
              <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-3 py-2">
                <IconSearch size={14} className="text-neutral-300 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="flex-1 text-sm text-neutral-900 outline-none bg-transparent" />
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Categoría</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cat" value="" checked={catFilter === ''} onChange={() => setCatFilter('')} className="accent-neutral-900" />
                  <span className="text-sm text-neutral-600">Todas</span>
                </label>
                {padres.map(p => (
                  <div key={p.id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cat" value={p.id} checked={catFilter === p.id} onChange={() => setCatFilter(p.id)} className="accent-neutral-900" />
                      <span className="text-sm text-neutral-700 font-medium">{p.name}</span>
                    </label>
                    {subcategorias.filter(s => s.parent_id === p.id).map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer ml-4 mt-1">
                        <input type="radio" name="cat" value={s.id} checked={catFilter === s.id} onChange={() => setCatFilter(s.id)} className="accent-neutral-900" />
                        <span className="text-sm text-neutral-400">{s.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Precio máx. — ${precioMax.toLocaleString('es-AR')}</p>
              <input type="range" min="0" max="500000" step="1000" value={precioMax} onChange={e => setPrecioMax(Number(e.target.value))} className="w-full accent-neutral-900" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={soloStock} onChange={e => setSoloStock(e.target.checked)} className="w-4 h-4 accent-neutral-900" />
                <span className="text-sm text-neutral-600">Solo con stock</span>
              </label>
            </div>
          </aside>

          {/* Productos */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-neutral-400">{filtered.length} productos</p>
              <select value={orden} onChange={e => setOrden(e.target.value)} className="border border-neutral-200 rounded-full px-4 py-2 text-sm text-neutral-600 bg-white outline-none">
                <option value="reciente">Más reciente</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
              </select>
            </div>
            {loading ? (
              <div className="py-20 text-center text-sm text-neutral-400">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-sm text-neutral-400">No hay productos con estos filtros</div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.product_columns}, 1fr)` }}>
                {filtered.map(p => (
                  <div key={p.id} className="bg-white border border-neutral-200 overflow-hidden hover:border-neutral-400 transition" style={{ borderRadius: settings.card_radius }}>
                    <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        : <IconPackage size={40} className="text-neutral-300" />
                      }
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-neutral-400 mb-1">{p.categories?.name}</p>
                      <p className="text-sm font-medium text-neutral-900 mb-1" style={{ fontFamily: settings.font_family }}>{p.name}</p>
                      {p.description && <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{p.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-base font-medium" style={{ color: settings.price_color }}>${Number(p.price).toLocaleString('es-AR')}</p>
                        {p.stock > 0
                          ? <button onClick={() => addToCart(p)} className="text-xs font-medium px-3 py-1.5 rounded-full text-white transition hover:opacity-80" style={{ background: settings.primary_color }}>+ Agregar</button>
                          : <span className="text-xs text-neutral-400">Sin stock</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}