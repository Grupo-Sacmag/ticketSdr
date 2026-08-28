import { Navigate } from 'react-router-dom'

function RutaProtegida({ children }) {
  const token   = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  // Sin token → al login
  if (!token) return <Navigate to="/login" replace />

  // Con contraseña temporal → forzar cambio antes de cualquier otra ruta
  if (usuario.passwordTemporal && window.location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />
  }

  return children
}

export default RutaProtegida