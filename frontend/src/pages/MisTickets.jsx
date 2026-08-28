import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [tickets, setTickets]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro]     = useState('TODOS')

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get('http://localhost:8080/api/tickets/mis-tickets', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTickets(data)
      } catch (err) {
        console.error('Error cargando tickets:', err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const ticketsFiltrados = filtro === 'TODOS'
    ? tickets
    : tickets.filter(t => t.estado === filtro)

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>

        {/* Resumen por estado */}
        <div style={styles.statsRow}>
          {['ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO'].map(estado => (
            <div key={estado} style={{
              ...styles.statCard,
              borderTop: `4px solid ${coloresEstado[estado]}`,
              cursor: 'pointer',
              outline: filtro === estado ? `2px solid ${coloresEstado[estado]}` : 'none'
            }} onClick={() => setFiltro(filtro === estado ? 'TODOS' : estado)}>
              <p style={styles.statNumero}>
                {tickets.filter(t => t.estado === estado).length}
              </p>
              <p style={styles.statLabel}>{estado}</p>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🎫 Mis tickets</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {filtro !== 'TODOS' && (
                <button style={styles.btnLimpiar} onClick={() => setFiltro('TODOS')}>
                  ✕ Quitar filtro
                </button>
              )}
              <button style={styles.btnNuevo} onClick={() => navigate('/reportar')}>
                ➕ Nuevo ticket
              </button>
            </div>
          </div>

          {cargando ? (
            <p style={styles.vacio}>Cargando tus tickets...</p>
          ) : ticketsFiltrados.length === 0 ? (
            <div style={styles.vacioCentro}>
              <p style={{ fontSize: '2rem' }}>📭</p>
              <p style={{ color: '#666' }}>
                {filtro === 'TODOS'
                  ? 'Aún no tienes tickets. ¿Necesitas reportar algo?'
                  : `No tienes tickets en estado "${filtro}"`}
              </p>
              {filtro === 'TODOS' && (
                <button style={styles.btnNuevo} onClick={() => navigate('/reportar')}>
                  Reportar un problema
                </button>
              )}
            </div>
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
                    <th style={styles.th}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsFiltrados.map(ticket => (
                    <tr key={ticket.folio} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ color: '#1a1a2e' }}>{ticket.folio}</strong>
                      </td>
                      <td style={styles.td}>{ticket.aplicacion}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresPrioridad[ticket.prioridad] || '#888'
                        }}>
                          {ticket.prioridad}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresEstado[ticket.estado] || '#888'
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
                      <td style={styles.td}>
                        <button
                          style={styles.btnDetalle}
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          Ver detalle →
                        </button>
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
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem', marginBottom: '1.5rem'
  },
  statCard: {
    backgroundColor: 'white', borderRadius: '8px',
    padding: '1rem', textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    transition: 'transform 0.15s'
  },
  statNumero: { fontSize: '2rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' },
  statLabel: { fontSize: '0.78rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
  card: {
    backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem'
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'
  },
  cardTitle: { margin: 0, color: '#1a1a2e' },
  vacio: { color: '#666', textAlign: 'center', padding: '2rem' },
  vacioCentro: { textAlign: 'center', padding: '3rem 2rem', color: '#666' },
  tableContainer: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: {
    backgroundColor: '#f0f2f5', padding: '0.75rem 1rem',
    textAlign: 'left', fontWeight: '600', color: '#333',
    borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap'
  },
  tr: { borderBottom: '1px solid #f0f2f5' },
  td: { padding: '0.75rem 1rem', color: '#444' },
  badge: {
    color: 'white', padding: '0.2rem 0.6rem',
    borderRadius: '12px', fontSize: '0.78rem',
    fontWeight: '500', whiteSpace: 'nowrap'
  },
  btnDetalle: {
    background: 'transparent', border: '1px solid #1a1a2e',
    color: '#1a1a2e', padding: '0.3rem 0.7rem',
    borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem'
  },
  btnNuevo: {
    backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', padding: '0.5rem 1rem',
    borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'
  },
  btnLimpiar: {
    backgroundColor: 'transparent', border: '1px solid #ccc',
    color: '#666', padding: '0.5rem 0.75rem',
    borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
  }
}

export default MisTickets