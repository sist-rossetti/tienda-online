import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { IconDownload } from '@tabler/icons-react'

const ESTADOS = ['completada', 'pendiente', 'cancelada']

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [settings, setSettings] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchVentas()
    supabase.from('store_settings').select('*').single().then(({ data }) => setSettings(data))
  }, [])

  async function fetchVentas() {
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('*, employees(name), sale_items(*, products(name))')
      .order('created_at', { ascending: false })
    setVentas(data || [])
    setLoading(false)
  }

  async function updateEstado(id, status) {
    setActionError('')
    // Cancelar repone el stock reservado en el checkout, así que pasa por
    // una función del servidor en vez de un update directo.
    const { error } = status === 'cancelada'
      ? await supabase.rpc('cancel_sale', { p_sale_id: id })
      : await supabase.from('sales').update({ status }).eq('id', id)
    if (error) { setActionError(error.message); return }
    fetchVentas()
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  async function handleGenerarTicket(venta) {
    setGenerando(true)
    const { generarTicket } = await import('../../utils/generarTicket')
    await generarTicket(venta, settings || {})
    setGenerando(false)
  }

  const filtered = ventas.filter(v => {
    const matchSearch =
      v.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      v.order_number.toLowerCase().includes(search.toLowerCase())
    const matchEstado = estadoFilter ? v.status === estadoFilter : true
    return matchSearch && matchEstado
  })

  const totalVendido = ventas.filter(v => v.status === 'completada').reduce((acc, v) => acc + Number(v.total), 0)
  const totalOrdenes = ventas.length
  const completadas = ventas.filter(v => v.status === 'completada')
  const ticketProm = completadas.length > 0 ? totalVendido / completadas.length : 0

  function estadoBadge(status) {
    const styles = {
      completada: 'bg-green-50 text-green-600',
      pendiente: 'bg-yellow-50 text-yellow-600',
      cancelada: 'bg-red-50 text-red-500'
    }
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status]}`}>{status}</span>
  }

  function formatFecha(ts) {
    return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-stone-900 tracking-tight" style={{ fontFamily: 'Bricolage Grotesque' }}>Ventas</h1>
            <p className="text-sm text-stone-400 mt-0.5">{totalOrdenes} órdenes en total</p>
          </div>
          <button
            onClick={() => {
              const csv = [
                ['Orden', 'Cliente', 'Email', 'DNI', 'Empleado', 'Total', 'Descuento', 'Pago', 'Estado', 'Fecha'],
                ...ventas.map(v => [
                  v.order_number, v.customer_name, v.customer_email || '', v.customer_doc || '',
                  v.employees?.name || '', v.total, v.discount || 0, v.payment_method, v.status,
                  formatFecha(v.created_at)
                ])
              ].map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'ventas.csv'; a.click()
            }}
            className="border border-stone-200 text-stone-600 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-stone-50 transition flex items-center gap-2 w-fit"
          >
            <IconDownload size={15} /> Exportar CSV
          </button>
        </div>

        {actionError && <p className="text-xs text-red-500 mb-4">{actionError}</p>}

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total vendido', value: `$${totalVendido.toLocaleString('es-AR')}` },
            { label: 'Órdenes', value: totalOrdenes },
            { label: 'Ticket promedio', value: `$${Math.round(ticketProm).toLocaleString('es-AR')}` },
            { label: 'Canceladas', value: ventas.filter(v => v.status === 'cancelada').length }
          ].map(m => (
            <div key={m.label} className="bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-xl font-medium text-stone-900">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2.5">
            <span className="text-stone-300 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente u orden..." className="flex-1 text-sm text-stone-900 outline-none" />
          </div>
          <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="border border-stone-200 rounded-full px-4 py-2.5 text-sm text-stone-600 bg-white outline-none">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden overflow-x-auto">
          <div className="min-w-[640px]">
          <div className="grid grid-cols-[90px_1fr_1fr_100px_90px_110px] px-5 py-3 bg-stone-50 text-xs text-stone-400 uppercase tracking-widest">
            <span>Orden</span><span>Cliente</span><span>Empleado</span><span>Total</span><span>Estado</span><span>Acciones</span>
          </div>
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-stone-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-400">No hay ventas</div>
          ) : filtered.map(v => (
            <div key={v.id} className="grid grid-cols-[90px_1fr_1fr_100px_90px_110px] px-5 py-4 border-t border-stone-100 items-center hover:bg-stone-50 transition cursor-pointer" onClick={() => setSelected(v)}>
              <span className="text-sm font-medium text-stone-900">{v.order_number}</span>
              <div>
                <p className="text-sm font-medium text-stone-900">{v.customer_name}</p>
                <p className="text-xs text-stone-400">{formatFecha(v.created_at)}</p>
              </div>
              <span className="text-sm text-stone-400">{v.employees?.name || '—'}</span>
              <span className="text-sm font-medium text-stone-900">${Number(v.total).toLocaleString('es-AR')}</span>
              <span>{estadoBadge(v.status)}</span>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                {ESTADOS.filter(s => s !== v.status).map(s => (
                  <button key={s} onClick={() => updateEstado(v.id, s)} className="text-xs text-stone-400 hover:text-stone-900 underline capitalize">{s}</button>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Detalle de venta */}
      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'1rem'}}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-stone-900 tracking-tight">Orden {selected.order_number}</h2>
              <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-900 text-xl">✕</button>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {[
                { label: 'Cliente', value: selected.customer_name },
                { label: 'Email', value: selected.customer_email || '—' },
                { label: 'DNI/CUIT', value: selected.customer_doc || '—' },
                { label: 'Empleado', value: selected.employees?.name || '—' },
                { label: 'Pago', value: selected.payment_method },
                { label: 'Fecha', value: formatFecha(selected.created_at) },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-stone-400">{f.label}</span>
                  <span className="text-stone-900 font-medium">{f.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-4 mb-4">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Productos</p>
              {selected.sale_items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-stone-50">
                  <span className="text-stone-900">{item.product_name} <span className="text-stone-400">x{item.quantity}</span></span>
                  <span className="font-medium text-stone-900">${Number(item.subtotal).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 mb-5">
              <div className="flex justify-between text-sm"><span className="text-stone-400">Subtotal</span><span>${Number(Number(selected.total) + Number(selected.discount || 0)).toLocaleString('es-AR')}</span></div>
              {selected.discount > 0 && <div className="flex justify-between text-sm"><span className="text-stone-400">Descuento</span><span className="text-green-600">−${Number(selected.discount).toLocaleString('es-AR')}</span></div>}
              <div className="flex justify-between text-base font-medium"><span>Total</span><span>${Number(selected.total).toLocaleString('es-AR')}</span></div>
            </div>

            <div className="flex gap-2 mb-3">
              {ESTADOS.map(s => (
                <button
                  key={s}
                  onClick={() => updateEstado(selected.id, s)}
                  className={`flex-1 text-xs py-2 rounded-full font-medium transition border ${selected.status === s ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerarTicket(selected)}
              disabled={generando}
              className="w-full flex items-center justify-center gap-2 border border-stone-200 text-stone-600 text-sm font-medium py-2.5 rounded-full hover:bg-stone-50 transition disabled:opacity-50"
            >
              <IconDownload size={15} />
              {generando ? 'Generando...' : 'Descargar ticket PDF'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}