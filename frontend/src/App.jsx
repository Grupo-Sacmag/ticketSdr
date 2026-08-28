import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ReportarTicket from './pages/ReportarTicket'
import MisTickets from './pages/MisTickets'
import AdminTickets from './pages/AdminTickets'
import AdminUsuarios from './pages/AdminUsuarios'
import TicketDetalle from './pages/TicketDetalle'
import RutaProtegida from './components/RutaProtegida'
import CambiarPassword from './pages/CambiarPassword'
import AdminCatalogos from './pages/AdminCatalogos'
import AdminEstadisticas from './pages/AdminEstadisticas'

function App() {
  return (
    <Routes>
      <Route path="/"         element={<Navigate to="/login" />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />  {/* ← corregido */}
      <Route path="/reportar" element={<RutaProtegida><ReportarTicket /></RutaProtegida>} />
      <Route path="/mis-tickets" element={<RutaProtegida><MisTickets /></RutaProtegida>} />
      <Route path="/admin/tickets" element={<RutaProtegida><AdminTickets /></RutaProtegida>} />
      <Route path="/admin/usuarios" element={<RutaProtegida><AdminUsuarios /></RutaProtegida>} />
      <Route path="/tickets/:id" element={<RutaProtegida><TicketDetalle /></RutaProtegida>} />
      <Route path="/dashboard" element={<Navigate to="/reportar" />} />
      <Route path="/cambiar-password" element={<RutaProtegida><CambiarPassword /></RutaProtegida>} />
      <Route path="/admin/catalogos" element={<RutaProtegida><AdminCatalogos /></RutaProtegida> } />
      <Route path="/admin/estadisticas" element={<RutaProtegida><AdminEstadisticas /></RutaProtegida>} />
    </Routes>
  )
}

export default App