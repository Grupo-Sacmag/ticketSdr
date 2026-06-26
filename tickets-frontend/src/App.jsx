import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ReportarTicket from './pages/ReportarTicket'
import MisTickets from './pages/MisTickets'
import AdminTickets from './pages/AdminTickets'
import AdminUsuarios from './pages/AdminUsuarios'
import RutaProtegida from './components/RutaProtegida'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" />} />
            <Route path="/reportar" element={
                <RutaProtegida><ReportarTicket /></RutaProtegida>
            } />
            <Route path="/mis-tickets" element={
                <RutaProtegida><MisTickets /></RutaProtegida>
            } />
            <Route path="/admin/tickets" element={
                <RutaProtegida><AdminTickets /></RutaProtegida>
            } />
            <Route path="/admin/usuarios" element={
                <RutaProtegida><AdminUsuarios /></RutaProtegida>
            } />
            <Route path="/dashboard" element={<Navigate to="/reportar" />} />
        </Routes>
    )
}

export default App