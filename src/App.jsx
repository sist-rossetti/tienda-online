import { Routes, Route, Navigate } from 'react-router-dom'
import { useCart } from './hooks/useCart'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Productos from './pages/admin/Productos'
import Categorias from './pages/admin/Categorias'
import Equipo from './pages/admin/Equipo'
import Ventas from './pages/admin/Ventas'
import Cupones from './pages/admin/Cupones'
import Estetica from './pages/admin/Estetica'
import Home from './pages/store/Home'
import Catalogo from './pages/store/Catalogo'
import Carrito from './pages/store/Carrito'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  const [cart, setCart] = useCart()

  return (
    <Routes>
      {/* Tienda pública */}
      <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
      <Route path="/catalogo" element={<Catalogo cart={cart} setCart={setCart} />} />
      <Route path="/carrito" element={<Carrito cart={cart} setCart={setCart} />} />

      {/* Admin */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/admin/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
      <Route path="/admin/categorias" element={<PrivateRoute><Categorias /></PrivateRoute>} />
      <Route path="/admin/equipo" element={<PrivateRoute><Equipo /></PrivateRoute>} />
      <Route path="/admin/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
      <Route path="/admin/cupones" element={<PrivateRoute><Cupones /></PrivateRoute>} />
      <Route path="/admin/estetica" element={<PrivateRoute><Estetica /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}