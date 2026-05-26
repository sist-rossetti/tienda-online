import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../context/AuthContext'

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
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true
      })
      if (authError) { setError('Error al crear usuario: ' + authError.message); setSaving(false); return }
      await supabase.from('employees').insert({
        user_id: data.user.id,
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active
      })
    }

    setSaving(false)
    setShowModal(false)
    fetchEmpleados()
  }

  async function toggleActive(emp) {
    await supabase.from('employees').update({ active: !emp.active }).eq('id', emp.id)
    fetchEmpleados()
  }

  async function handleDelete() {
    await supabase.from('employees').delete().eq('id', deleteId)
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
      admin: 'bg-neutral-900 text-white',
      vendedor: 'bg-neutral-100 text-neutral-600',
      lectura: 'bg-neutral-50 text-neutral-400'
    }
    return <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[role]}`}>{role}</span>
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Equipo</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{empleados.filter(e => e.active).length} miembros activos</p>
          </div>
          {currentEmployee?.role === 'admin' && (
            <button onClick={openNew} className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition">
              + Nuevo
            </button>
          )}
        </div>

        {/* Tabs + búsqueda */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-neutral-100 rounded-full p-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition capitalize ${tab === t ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2">
            <span className="text-neutral-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="text-sm text-neutral-900 outline-none w-40" />
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">No hay miembros</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(emp => (
              <div key={emp.id} className={`bg-white border border-neutral-200 rounded-2xl p-5 transition ${!emp.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${emp.role === 'admin' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {avatar(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{emp.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{emp.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {rolBadge(emp.role)}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleActive(emp)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${emp.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                      {emp.active ? 'Activo' : 'Inactivo'}
                    </button>
                    {currentEmployee?.role === 'admin' && emp.id !== currentEmployee?.id && (
                      <>
                        <button onClick={() => openEdit(emp)} className="w-7 h-7 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition text-xs">✏️</button>
                        <button onClick={() => setDeleteId(emp.id)} className="w-7 h-7 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition text-xs">🗑</button>
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
            <h2 className="text-lg font-medium text-neutral-900 tracking-tight mb-5">{editId ? 'Editar miembro' : 'Nuevo miembro'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Nombre completo *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="Ana Rossetti" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!editId} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition disabled:bg-neutral-50 disabled:text-neutral-400" placeholder="ana@mitienda.com" />
              </div>
              {!editId && (
                <div>
                  <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Contraseña *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="••••••••" />
                </div>
              )}
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Rol</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition bg-white">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-neutral-900" />
                <span className="text-sm text-neutral-600">Miembro activo</span>
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-neutral-200 text-neutral-600 text-sm font-medium py-2.5 rounded-full hover:bg-neutral-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-full hover:bg-neutral-700 transition disabled:opacity-50">
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
            <h2 className="text-lg font-medium text-neutral-900 mb-2">¿Eliminar miembro?</h2>
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