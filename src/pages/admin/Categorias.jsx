import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'

export default function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [parentId, setParentId] = useState('')
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchCategorias() }, [])

  async function fetchCategorias() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategorias(data || [])
    setLoading(false)
  }

  const padres = categorias.filter(c => !c.parent_id)
  const subcategorias = categorias.filter(c => c.parent_id)

  function getNombrePadre(parentId) {
    return categorias.find(c => c.id === parentId)?.name || ''
  }

  function openNew() {
    setNombre('')
    setParentId('')
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(c) {
    setNombre(c.name)
    setParentId(c.parent_id || '')
    setEditId(c.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const payload = { name: nombre.trim(), parent_id: parentId || null }
    if (editId) {
      await supabase.from('categories').update(payload).eq('id', editId)
    } else {
      await supabase.from('categories').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchCategorias()
  }

  async function toggleActive(c) {
    await supabase.from('categories').update({ active: !c.active }).eq('id', c.id)
    fetchCategorias()
  }

  async function handleDelete() {
    await supabase.from('categories').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchCategorias()
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Categorías</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{padres.length} categorías · {subcategorias.length} subcategorías</p>
          </div>
          <button onClick={openNew} className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition">
            + Nueva
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_100px_120px] px-5 py-3 bg-neutral-50 text-xs text-neutral-400 uppercase tracking-widest">
            <span>Nombre</span><span>Categoría padre</span><span>Estado</span><span>Acciones</span>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-neutral-400">Cargando...</div>
          ) : categorias.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-neutral-400">No hay categorías</div>
          ) : (
            <>
              {/* Categorías padre */}
              {padres.map(c => (
                <div key={c.id}>
                  <div className="grid grid-cols-[2fr_1fr_100px_120px] px-5 py-4 border-t border-neutral-100 items-center">
                    <span className="text-sm font-medium text-neutral-900">{c.name}</span>
                    <span className="text-sm text-neutral-300">—</span>
                    <span>
                      <button onClick={() => toggleActive(c)} className={`text-xs px-3 py-1 rounded-full font-medium transition ${c.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                        {c.active ? 'Activa' : 'Inactiva'}
                      </button>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition text-xs">✏️</button>
                      <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
                    </div>
                  </div>
                  {/* Subcategorías de este padre */}
                  {subcategorias.filter(s => s.parent_id === c.id).map(s => (
                    <div key={s.id} className="grid grid-cols-[2fr_1fr_100px_120px] px-5 py-3 border-t border-neutral-50 items-center bg-neutral-50/50">
                      <span className="text-sm text-neutral-600 pl-5 flex items-center gap-2">
                        <span className="text-neutral-300">└</span> {s.name}
                      </span>
                      <span className="text-sm text-neutral-400">{c.name}</span>
                      <span>
                        <button onClick={() => toggleActive(s)} className={`text-xs px-3 py-1 rounded-full font-medium transition ${s.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                          {s.active ? 'Activa' : 'Inactiva'}
                        </button>
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition text-xs">✏️</button>
                        <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-medium text-neutral-900 tracking-tight mb-5">{editId ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Nombre *</label>
                <input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition"
                  placeholder="Ej: Computadoras"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Categoría padre (opcional)</label>
                <select
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition bg-white"
                >
                  <option value="">— Es una categoría principal —</option>
                  {padres.filter(p => p.id !== editId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-neutral-200 text-neutral-600 text-sm font-medium py-2.5 rounded-full hover:bg-neutral-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-neutral-700 transition disabled:opacity-50">
                {saving ? 'Guardando...' : editId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🗑</div>
            <h2 className="text-lg font-medium text-neutral-900 mb-2">¿Eliminar categoría?</h2>
            <p className="text-sm text-neutral-400 mb-6">Si tiene subcategorías, también se eliminarán.</p>
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