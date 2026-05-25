import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'

const emptyForm = {
  name: '', description: '', price: '', stock: '',
  category_id: '', image_url: '', active: true
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => { fetchProductos(); fetchCategorias() }, [])

  async function fetchProductos() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, categories(id, name, parent_id)')
      .order('created_at', { ascending: false })
    setProductos(data || [])
    setLoading(false)
  }

  async function fetchCategorias() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name')
    setCategorias(data || [])
  }

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      category_id: p.category_id || '',
      image_url: p.image_url || '',
      active: p.active
    })
    setEditId(p.id)
    setImageFile(null)
    setImagePreview(p.image_url || null)
    setShowModal(true)
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage() {
    if (!imageFile) return form.image_url
    setUploadingImage(true)
    const ext = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile)
    if (error) { setUploadingImage(false); return form.image_url }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    setUploadingImage(false)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.stock) return
    setSaving(true)
    const imageUrl = await uploadImage()
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id || null,
      image_url: imageUrl,
      active: form.active
    }
    if (editId) {
      await supabase.from('products').update(payload).eq('id', editId)
    } else {
      await supabase.from('products').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchProductos()
  }

  async function handleDelete() {
    await supabase.from('products').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchProductos()
  }

  const padres = categorias.filter(c => !c.parent_id)
  const subcategorias = categorias.filter(c => c.parent_id)

  function getNombreCategoria(p) {
    if (!p.categories) return '—'
    const cat = p.categories
    if (cat.parent_id) {
      const padre = categorias.find(c => c.id === cat.parent_id)
      return padre ? `${padre.name} › ${cat.name}` : cat.name
    }
    return cat.name
  }

  // Filtrar por categoría incluyendo subcategorías del padre seleccionado
  const filtered = productos.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
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
    const matchStock = stockFilter === 'con' ? p.stock > 0 : stockFilter === 'sin' ? p.stock === 0 : true
    return matchSearch && matchCat && matchStock
  })

  function stockBadge(stock) {
    if (stock === 0) return <span className="bg-red-50 text-red-500 text-xs px-2.5 py-1 rounded-full font-medium">0</span>
    if (stock <= 5) return <span className="bg-yellow-50 text-yellow-600 text-xs px-2.5 py-1 rounded-full font-medium">{stock}</span>
    return <span className="bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium">{stock}</span>
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Productos</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{productos.length} productos en total</p>
          </div>
          <button onClick={openNew} className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition">
            + Nuevo
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5">
            <span className="text-neutral-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..." className="flex-1 text-sm text-neutral-900 outline-none" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-neutral-200 rounded-full px-4 py-2.5 text-sm text-neutral-600 bg-white outline-none">
            <option value="">Todas las categorías</option>
            {padres.map(p => (
              <optgroup key={p.id} label={p.name}>
                <option value={p.id}>Todos en {p.name}</option>
                {subcategorias.filter(s => s.parent_id === p.id).map(s => (
                  <option key={s.id} value={s.id}>  › {s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border border-neutral-200 rounded-full px-4 py-2.5 text-sm text-neutral-600 bg-white outline-none">
            <option value="">Stock</option>
            <option value="con">Con stock</option>
            <option value="sin">Sin stock</option>
          </select>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[60px_2fr_1fr_100px_80px_100px] px-5 py-3 bg-neutral-50 text-xs text-neutral-400 uppercase tracking-widest">
            <span>Foto</span><span>Producto</span><span>Categoría</span><span>Precio</span><span>Stock</span><span>Acciones</span>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-neutral-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-neutral-400">No hay productos</div>
          ) : filtered.map(p => (
            <div key={p.id} className="grid grid-cols-[60px_2fr_1fr_100px_80px_100px] px-5 py-4 border-t border-neutral-100 items-center">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-neutral-300 text-lg">📦</span>
                }
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                {!p.active && <span className="text-xs text-neutral-400">Inactivo</span>}
              </div>
              <span className="text-sm text-neutral-400">{getNombreCategoria(p)}</span>
              <span className="text-sm font-medium text-neutral-900">${Number(p.price).toLocaleString('es-AR')}</span>
              <span>{stockBadge(p.stock)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition text-xs">✏️</button>
                <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-neutral-900 tracking-tight mb-5">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Imagen</label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-36 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 transition overflow-hidden"
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center gap-2 text-neutral-300">
                        <span className="text-3xl">📷</span>
                        <span className="text-xs">Cargar imagen</span>
                      </div>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview && (
                  <button onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, image_url: ''}) }} className="text-xs text-neutral-400 hover:text-red-500 mt-1.5 transition">
                    Quitar imagen
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Nombre *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Precio *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Categoría</label>
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition bg-white">
                  <option value="">Sin categoría</option>
                  {padres.map(p => (
                    <optgroup key={p.id} label={p.name}>
                      <option value={p.id}>{p.name}</option>
                      {subcategorias.filter(s => s.parent_id === p.id).map(s => (
                        <option key={s.id} value={s.id}>  › {s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-neutral-900" />
                <span className="text-sm text-neutral-600">Producto activo (visible en tienda)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-neutral-200 text-neutral-600 text-sm font-medium py-2.5 rounded-full hover:bg-neutral-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving || uploadingImage} className="flex-1 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-neutral-700 transition disabled:opacity-50">
                {saving || uploadingImage ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🗑</div>
            <h2 className="text-lg font-medium text-neutral-900 mb-2">¿Eliminar producto?</h2>
            <p className="text-sm text-neutral-400 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-neutral-200 text-neutral-600 text-sm font-medium py-2.5 rounded-full hover:bg-neutral-50 transition">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-full hover:bg-red-600 transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}