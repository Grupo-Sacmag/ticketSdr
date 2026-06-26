// Centralizamos la URL base aquí para no repetirla en cada componente.
// Si el día de mañana cambias el puerto o el host, solo cambias esta línea.
const BASE_URL = 'http://localhost:8080/api'

// Helper interno: lee el token de localStorage
const getToken = () => localStorage.getItem('token')

// Helper interno: construye el header Authorization que el backend espera
const authHeader = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
})

// Todos los tickets (solo ADMIN/SOPORTE)
export const obtenerTodosLosTickets = async () => {
    const res = await fetch(`${BASE_URL}/tickets/todos`, { headers: authHeader() })
    if (!res.ok) throw new Error('Error al obtener tickets')
    return res.json()
}

// Tickets del usuario autenticado
export const obtenerMisTickets = async () => {
    const res = await fetch(`${BASE_URL}/tickets/mis-tickets`, { headers: authHeader() })
    if (!res.ok) throw new Error('Error al obtener tus tickets')
    return res.json()
}

// Cambiar estado de un ticket
export const cambiarEstadoTicket = async (id, estado) => {
    const res = await fetch(`${BASE_URL}/tickets/${id}/estado`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ estado })
    })
    if (!res.ok) throw new Error('Error al cambiar estado')
    return res.json()
}

// Cambiar prioridad de un ticket
export const cambiarPrioridadTicket = async (id, prioridad) => {
    const res = await fetch(`${BASE_URL}/tickets/${id}/prioridad`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ prioridad })
    })
    if (!res.ok) throw new Error('Error al cambiar prioridad')
    return res.json()
}