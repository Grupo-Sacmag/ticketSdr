import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const coloresPrioridad = {
  'Baja': '#48bb78', 'Media': '#ed8936',
  'Alta': '#e53e3e', 'Crítica': '#742a2a'
}

const coloresEstado = {
  'ABIERTO': '#4299e1', 'EN PROCESO': '#ed8936',
  'RESUELTO': '#48bb78', 'CERRADO': '#a0aec0'
}
function MisTickets() {
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  useEffect(() => {
    const cargarTickets = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:8080/api/tickets/mis-tickets', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTickets(response.data)
      } catch (err) {
        console.error('Error cargando tickets:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarTickets()
  }, [])

  const ticketsFiltrados = filtroEstado === 'TODOS'
    ? tickets
    : tickets.filter(t => t.estado === filtroEstado)

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🎫 Mis tickets</h3>

            {/* Filtros por estado */}
            <div style={styles.filtros}>
              {['TODOS', 'ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  style={{
                    ...styles.filtroBtn,
                    backgroundColor: filtroEstado === estado ? '#1a1a2e' : '#f0f2f5',
                    color: filtroEstado === estado ? 'white' : '#333'
                  }}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <p style={styles.mensaje}>Cargando tickets...</p>
          ) : ticketsFiltrados.length === 0 ? (
            <p style={styles.mensaje}>
              {filtroEstado === 'TODOS'
                ? 'No has reportado ningún ticket aún.'
                : `No tienes tickets en estado "${filtroEstado}".`}
            </p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.th}>Folio</th>
                    <th style={styles.th}>Aplicación</th>
                    <th style={styles.th}>Prioridad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsFiltrados.map(ticket => (
                    <tr key={ticket.folio} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{ticket.folio}</strong>
                      </td>
                      <td style={styles.td}>{ticket.aplicacion}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresPrioridad[ticket.prioridad]
                        }}>
                          {ticket.prioridad}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresEstado[ticket.estado]
                        }}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(ticket.fechaCreacion).toLocaleDateString('es-MX', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ ...styles.td, maxWidth: '200px' }}>
                        <span style={styles.descripcion}>{ticket.problema}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  content: { padding: '2rem' },
  card: {
    backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem'
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.5rem',
    flexWrap: 'wrap', gap: '1rem'
  },
  cardTitle: { margin: 0, color: '#1a1a2e' },
  filtros: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  filtroBtn: {
    padding: '0.35rem 0.75rem', borderRadius: '20px',
    border: 'none', cursor: 'pointer',
    fontSize: '0.8rem', fontWeight: '500',
    transition: 'all 0.2s'
  },
  mensaje: { textAlign: 'center', color: '#666', padding: '2rem' },
  tableContainer: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: {
    backgroundColor: '#f0f2f5', padding: '0.75rem 1rem',
    textAlign: 'left', fontWeight: '600', color: '#333',
    borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap'
  },
  tr: { transition: 'background-color 0.15s' },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0', color: '#444'
  },
  badge: {
    color: 'white', padding: '0.2rem 0.6rem',
    borderRadius: '12px', fontSize: '0.78rem',
    fontWeight: '500', whiteSpace: 'nowrap'
  },
  descripcion: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    fontSize: '0.85rem'
  }
}

export default MisTickets