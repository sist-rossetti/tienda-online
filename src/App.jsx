import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Productos from './pages/admin/Productos'
import Categorias from './pages/admin/Categorias'
import Equipo from './pages/admin/Equipo'
import Ventas from './pages/admin/Ventas'
import Cupones from './pages/admin/Cupones'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/admin/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
      <Route path="/admin/categorias" element={<PrivateRoute><Categorias /></PrivateRoute>} />
      <Route path="/admin/equipo" element={<PrivateRoute><Equipo /></PrivateRoute>} />
      <Route path="/admin/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
      <Route path="/admin/cupones" element={<PrivateRoute><Cupones /></PrivateRoute>} />
      <Route path="/" element={<div className="p-8 text-neutral-900 font-medium">Tienda pública — próximamente</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}