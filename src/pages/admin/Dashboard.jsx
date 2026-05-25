import AdminLayout from '../../layouts/AdminLayout'

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-1">Dashboard</h1>
        <p className="text-sm text-neutral-400">Bienvenida, próximamente las métricas</p>
      </div>
    </AdminLayout>
  )
}