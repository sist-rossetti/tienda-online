import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'

const emptyForm = {
  code: '', discount_percent: '', max_uses: '', active: true, expires_at: ''
}

export default function Cupones() {
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => { fetchCupones() }, [])

  async function fetchCupones() {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCupones(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(c) {
    setForm({
      code: c.code,
      discount_percent: c.discount_percent,
      max_uses: c.max_uses || '',
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : ''
    })
    setEditId(c.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.code || !form.discount_percent) return
    setError('')
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_percent: Number(form.discount_percent),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null
    }
    if (editId) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('coupons').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchCupones()
  }

  async function toggleActive(c) {
    setActionError('')
    const { error } = await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id)
    if (error) { setActionError(error.message); return }
    fetchCupones()
  }

  async function handleDelete() {
    setDeleteError('')
    const { error } = await supabase.from('coupons').delete().eq('id', deleteId)
    if (error) { setDeleteError(error.message); return }
    setDeleteId(null)
    fetchCupones()
  }

  function isExpired(c) {
    if (!c.expires_at) return false
    return new Date(c.expires_at) < new Date()
  }

  function isAgotado(c) {
    if (!c.max_uses) return false
    return c.uses >= c.max_uses
  }

  function estadoBadge(c) {
    if (!c.active) return <span className="bg-stone-100 text-stone-400 text-xs px-2.5 py-1 rounded-full font-medium">Inactivo</span>
    if (isExpired(c)) return <span className="bg-red-50 text-red-500 text-xs px-2.5 py-1 rounded-full font-medium">Vencido</span>
    if (isAgotado(c)) return <span className="bg-yellow-50 text-yellow-600 text-xs px-2.5 py-1 rounded-full font-medium">Agotado</span>
    return <span className="bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium">Activo</span>
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-stone-900 tracking-tight" style={{ fontFamily: 'Bricolage Grotesque' }}>Cupones</h1>
            <p className="text-sm text-stone-400 mt-0.5">{cupones.length} cupones en total</p>
          </div>
          <button onClick={openNew} className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-stone-700 transition w-fit">
            + Nuevo
          </button>
        </div>

        {actionError && <p className="text-xs text-red-500 mb-3">{actionError}</p>}

        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden overflow-x-auto">
          <div className="min-w-[600px]">
          <div className="grid grid-cols-[1fr_80px_80px_100px_100px_100px] px-5 py-3 bg-stone-50 text-xs text-stone-400 uppercase tracking-widest">
            <span>Código</span><span>Descuento</span><span>Usos</span><span>Vencimiento</span><span>Estado</span><span>Acciones</span>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-stone-400">Cargando...</div>
          ) : cupones.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-400">No hay cupones</div>
          ) : cupones.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_80px_80px_100px_100px_100px] px-5 py-4 border-t border-stone-100 items-center">
              <span className="text-sm font-mono font-medium text-stone-900">{c.code}</span>
              <span className="text-sm font-medium text-stone-900">{c.discount_percent}%</span>
              <span className="text-sm text-stone-500">{c.uses}{c.max_uses ? `/${c.max_uses}` : ''}</span>
              <span className="text-sm text-stone-400">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-AR') : '—'}</span>
              <span>{estadoBadge(c)}</span>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(c)} className="w-8 h-8 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-400 transition text-xs">
                  {c.active ? '⏸' : '▶'}
                </button>
                <button onClick={() => openEdit(c)} className="w-8 h-8 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-400 transition text-xs">✏️</button>
                <button onClick={() => { setDeleteError(''); setDeleteId(c.id) }} className="w-8 h-8 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-medium text-stone-900 tracking-tight mb-5">{editId ? 'Editar cupón' : 'Nuevo cupón'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Código *</label>
                <input
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm font-mono outline-none focus:border-stone-400 transition"
                  placeholder="VERANO10"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Descuento (%) *</label>
                <input
                  type="number"
                  min="1" max="100"
                  value={form.discount_percent}
                  onChange={e => setForm({...form, discount_percent: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Usos máximos (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={e => setForm({...form, max_uses: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition"
                  placeholder="Sin límite"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Fecha de vencimiento (opcional)</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm({...form, expires_at: e.target.value})}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition"
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-stone-900" />
                <span className="text-sm text-stone-600">Cupón activo</span>
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-200 text-stone-600 text-sm font-medium py-2.5 rounded-full hover:bg-stone-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-stone-700 transition disabled:opacity-50">
                {saving ? 'Guardando...' : editId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🗑</div>
            <h2 className="text-lg font-medium text-stone-900 mb-2">¿Eliminar cupón?</h2>
            <p className="text-sm text-stone-400 mb-4">Esta acción no se puede deshacer.</p>
            {deleteError && <p className="text-xs text-red-500 mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-stone-200 text-stone-600 text-sm font-medium py-2.5 rounded-full hover:bg-stone-50 transition">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-full hover:bg-red-600 transition">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}