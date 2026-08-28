const BASE_URL = 'http://localhost:8080/api'

const getToken = () => localStorage.getItem('token')

const authHeader = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
})

export const obtenerTodosLosTickets = async () => {
  const res = await fetch(`${BASE_URL}/tickets/todos`, { headers: authHeader() })
  if (!res.ok) throw new Error('Error al obtener tickets')
  return res.json()
}

export const obtenerMisTickets = async () => {
  const res = await fetch(`${BASE_URL}/tickets/mis-tickets`, { headers: authHeader() })
  if (!res.ok) throw new Error('Error al obtener tus tickets')
  return res.json()
}

export const cambiarEstadoTicket = async (id, estado) => {
  const res = await fetch(`${BASE_URL}/tickets/${id}/estado`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ estado })
  })
  if (!res.ok) throw new Error('Error al cambiar estado')
  return res.json()
}

export const cambiarPrioridadTicket = async (id, prioridad) => {
  const res = await fetch(`${BASE_URL}/tickets/${id}/prioridad`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ prioridad })
  })
  if (!res.ok) throw new Error('Error al cambiar prioridad')
  return res.json()
}