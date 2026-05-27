import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { IconTrendingUp, IconShoppingCart, IconAlertTriangle, IconReceipt } from '@tabler/icons-react'

export default function Dashboard() {
  const { employee } = useAuth()
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('semana')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('sales').select('*, employees(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('active', true)
    ])
    setVentas(v || [])
    setProductos(p || [])
    setLoading(false)
  }

  function filtrarPorPeriodo(ventas) {
    const ahora = new Date()
    return ventas.filter(v => {
      const fecha = new Date(v.created_at)
      if (periodo === 'hoy') return fecha.toDateString() === ahora.toDateString()
      if (periodo === 'semana') return (ahora - fecha) <= 7 * 24 * 60 * 60 * 1000
      if (periodo === 'mes') return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
      return true
    })
  }

  const ventasFiltradas = filtrarPorPeriodo(ventas)
  const completadas = ventasFiltradas.filter(v => v.status === 'completada')
  const totalVendido = completadas.reduce((acc, v) => acc + Number(v.total), 0)
  const ticketProm = completadas.length > 0 ? totalVendido / completadas.length : 0
  const stockCritico = productos.filter(p => p.stock <= 5)

  // Ventas por día para el gráfico (últimos 7 días)
  function ventasPorDia() {
    const dias = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    const resultado = Array(7).fill(0)
    const ahora = new Date()
    ventas.filter(v => (ahora - new Date(v.created_at)) <= 7 * 24 * 60 * 60 * 1000).forEach(v => {
      const dia = new Date(v.created_at).getDay()
      resultado[dia] += Number(v.total)
    })
    const max = Math.max(...resultado, 1)
    return resultado.map((val, i) => ({ dia: dias[i], val, pct: Math.round((val / max) * 100) }))
  }

  const barras = ventasPorDia()

  function estadoBadge(status) {
    const styles = {
      completada: 'bg-green-50 text-green-600',
      pendiente: 'bg-yellow-50 text-yellow-600',
      cancelada: 'bg-red-50 text-red-500'
    }
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status]}`}>{status}</span>
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-0.5">Bienvenida, {employee?.name?.split(' ')[0]}</p>
          </div>
          <div className="flex gap-1 bg-neutral-100 rounded-full p-1">
            {['hoy', 'semana', 'mes'].map(p => (
              <button key={p} onClick={() => setPeriodo(p)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition capitalize ${periodo === p ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}>
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Total vendido</p>
              <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
                <IconTrendingUp size={16} className="text-neutral-400" />
              </div>
            </div>
            <p className="text-2xl font-medium text-neutral-900">${totalVendido.toLocaleString('es-AR')}</p>
            <p className="text-xs text-neutral-400 mt-1">{completadas.length} ventas completadas</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Órdenes</p>
              <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
                <IconShoppingCart size={16} className="text-neutral-400" />
              </div>
            </div>
            <p className="text-2xl font-medium text-neutral-900">{ventasFiltradas.length}</p>
            <p className="text-xs text-neutral-400 mt-1">{ventasFiltradas.filter(v => v.status === 'pendiente').length} pendientes</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Ticket prom.</p>
              <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center">
                <IconReceipt size={16} className="text-neutral-400" />
              </div>
            </div>
            <p className="text-2xl font-medium text-neutral-900">${Math.round(ticketProm).toLocaleString('es-AR')}</p>
            <p className="text-xs text-neutral-400 mt-1">por orden completada</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Stock crítico</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stockCritico.length > 0 ? 'bg-red-50' : 'bg-neutral-50'}`}>
                <IconAlertTriangle size={16} className={stockCritico.length > 0 ? 'text-red-400' : 'text-neutral-400'} />
              </div>
            </div>
            <p className={`text-2xl font-medium ${stockCritico.length > 0 ? 'text-red-500' : 'text-neutral-900'}`}>{stockCritico.length}</p>
            <p className="text-xs text-neutral-400 mt-1">productos con stock ≤ 5</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6 mb-6">
          {/* Gráfico de barras */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-neutral-900">Ventas por día</h2>
              <span className="text-xs text-neutral-400">Últimos 7 días</span>
            </div>
            <div className="flex items-end gap-3 h-32">
              {barras.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-neutral-900 transition-all" style={{ height: `${Math.max(b.pct, 4)}%`, opacity: b.pct > 0 ? 0.7 + (b.pct / 100) * 0.3 : 0.15 }}></div>
                  <span className="text-xs text-neutral-400">{b.dia}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock crítico */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-neutral-900 mb-4">Stock crítico</h2>
            {stockCritico.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">Todo el stock está bien</div>
            ) : (
              <div className="flex flex-col gap-2">
                {stockCritico.slice(0, 6).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-neutral-50">
                    <p className="text-sm text-neutral-900 truncate flex-1">{p.name}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-3 flex-shrink-0 ${p.stock === 0 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                      {p.stock === 0 ? 'Sin stock' : `${p.stock} restantes`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimas ventas */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-900">Últimas ventas</h2>
          </div>
          <div className="grid grid-cols-[90px_1fr_1fr_100px_90px] px-6 py-3 bg-neutral-50 text-xs text-neutral-400 uppercase tracking-widest">
            <span>Orden</span><span>Cliente</span><span>Empleado</span><span>Total</span><span>Estado</span>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-400">Cargando...</div>
          ) : ventas.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-400">No hay ventas todavía</div>
          ) : ventas.slice(0, 8).map(v => (
            <div key={v.id} className="grid grid-cols-[90px_1fr_1fr_100px_90px] px-6 py-4 border-t border-neutral-100 items-center">
              <span className="text-sm font-medium text-neutral-900">{v.order_number}</span>
              <div>
                <p className="text-sm font-medium text-neutral-900">{v.customer_name}</p>
                <p className="text-xs text-neutral-400">{new Date(v.created_at).toLocaleDateString('es-AR')}</p>
              </div>
              <span className="text-sm text-neutral-400">{v.employees?.name || '—'}</span>
              <span className="text-sm font-medium text-neutral-900">${Number(v.total).toLocaleString('es-AR')}</span>
              <span>{estadoBadge(v.status)}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}