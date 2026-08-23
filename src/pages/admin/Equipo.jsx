import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../hooks/useAuth'

const ROLES = ['admin', 'vendedor', 'lectura']
const TABS = ['Todos', 'admin', 'vendedor', 'lectura']

const emptyForm = {
  name: '', email: '', password: '', role: 'vendedor', active: true
}

export default function Equipo() {
  const { employee: currentEmployee } = useAuth()
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => { fetchEmpleados() }, [])

  async function fetchEmpleados() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('name')
    setEmpleados(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setError('')
    setShowModal(true)
  }

  function openEdit(e) {
    setForm({ name: e.name, email: e.email, password: '', role: e.role, active: e.active })
    setEditId(e.id)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.email) return
    setError('')
    setSaving(true)

    if (editId) {
      const { error } = await supabase.from('employees').update({
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active
      }).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      if (!form.password) { setError('La contraseña es requerida'); setSaving(false); return }
      const { data, error: fnError } = await supabase.functions.invoke('create-employee', {
        body: { name: form.name, email: form.email, password: form.password, role: form.role, active: form.active }
      })
      if (fnError || data?.error) { setError(data?.error || fnError.message); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    fetchEmpleados()
  }

  async function toggleActive(emp) {
    setActionError('')
    const { error } = await supabase.from('employees').update({ active: !emp.active }).eq('id', emp.id)
    if (error) { setActionError(error.message); return }
    fetchEmpleados()
  }

  async function handleDelete() {
    setDeleteError('')
    const { error } = await supabase.from('employees').delete().eq('id', deleteId)
    if (error) { setDeleteError(error.message); return }
    setDeleteId(null)
    fetchEmpleados()
  }

  const filtered = empleados.filter(e => {
    const matchTab = tab === 'Todos' ? true : e.role === tab
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  function avatar(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function rolBadge(role) {
    const styles = {
      admin: 'bg-stone-900 text-white',
      vendedor: 'bg-stone-100 text-stone-600',
      lectura: 'bg-stone-50 text-stone-400'
    }
    return <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[role]}`}>{role}</span>
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-stone-900 tracking-tight" style={{ fontFamily: 'Bricolage Grotesque' }}>Equipo</h1>
            <p className="text-sm text-stone-400 mt-0.5">{empleados.filter(e => e.active).length} miembros activos</p>
          </div>
          {currentEmployee?.role === 'admin' && (
            <button onClick={openNew} className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-stone-700 transition w-fit">
              + Nuevo
            </button>
          )}
        </div>

        {/* Tabs + búsqueda */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex gap-1 bg-stone-100 rounded-full p-1 w-fit overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition capitalize whitespace-nowrap ${tab === t ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2">
            <span className="text-stone-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="text-sm text-stone-900 outline-none w-full sm:w-40" />
          </div>
        </div>

        {actionError && <p className="text-xs text-red-500 mb-4">{actionError}</p>}

        {/* Cards */}
        {loading ? (
          <div className="py-10 text-center text-sm text-stone-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-stone-400">No hay miembros</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(emp => (
              <div key={emp.id} className={`bg-white border border-stone-200 rounded-2xl p-5 transition ${!emp.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${emp.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}>
                    {avatar(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{emp.name}</p>
                    <p className="text-xs text-stone-400 truncate">{emp.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {rolBadge(emp.role)}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleActive(emp)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${emp.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}>
                      {emp.active ? 'Activo' : 'Inactivo'}
                    </button>
                    {currentEmployee?.role === 'admin' && emp.id !== currentEmployee?.id && (
                      <>
                        <button onClick={() => openEdit(emp)} className="w-7 h-7 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-400 transition text-xs">✏️</button>
                        <button onClick={() => { setDeleteError(''); setDeleteId(emp.id) }} className="w-7 h-7 border border-stone-200 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-medium text-stone-900 tracking-tight mb-5">{editId ? 'Editar miembro' : 'Nuevo miembro'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Nombre completo *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="Ana Rossetti" />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!editId} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition disabled:bg-stone-50 disabled:text-stone-400" placeholder="ana@mitienda.com" />
              </div>
              {!editId && (
                <div>
                  <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Contraseña *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="••••••••" />
                </div>
              )}
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Rol</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition bg-white">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-stone-900" />
                <span className="text-sm text-stone-600">Miembro activo</span>
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-200 text-stone-600 text-sm font-medium py-2.5 rounded-full hover:bg-stone-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-stone-700 transition disabled:opacity-50">
                {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear miembro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">🗑</div>
            <h2 className="text-lg font-medium text-stone-900 mb-2">¿Eliminar miembro?</h2>
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