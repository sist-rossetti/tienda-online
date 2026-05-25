import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <div className="p-8 text-neutral-900 font-medium">Panel admin — próximamente</div>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<div className="p-8 text-neutral-900 font-medium">Tienda pública — próximamente</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}