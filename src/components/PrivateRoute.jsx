import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, roles = [] }) {
  const { user, employee, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  if (roles.length > 0 && employee && !roles.includes(employee.role)) {
    return <Navigate to="/admin" replace />
  }

  return children
}