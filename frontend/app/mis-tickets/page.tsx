'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

type Ticket = {
  id: number
  folio: string
  aplicacion: string
  problema: string
  prioridad: string
  estado: string
  fechaCreacion?: string
}

const coloresPrioridad: Record<string, string> = {
  Baja: '#48bb78',
  Media: '#ed8936',
  Alta: '#e53e3e',
  Crítica: '#742a2a',
}

const coloresEstado: Record<string, string> = {
  ABIERTO: '#4299e1',
  'EN PROCESO': '#ed8936',
  RESUELTO: '#48bb78',
  CERRADO: '#a0aec0',
}

const filtros = [
  'TODOS',
  'ABIERTO',
  'EN PROCESO',
  'RESUELTO',
  'CERRADO',
]

export default function MisTicketsPage() {
  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await fetch(
          '/api/backend/tickets/mis-tickets',
          { cache: 'no-store' }
        )

        if (!response.ok) {
          throw new Error('Error cargando tickets')
        }

        const data = await response.json()
        setTickets(data)
      } catch (error) {
        console.error('Error cargando tickets:', error)
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [])

  const ticketsFiltrados = useMemo(() => {
    if (filtro === 'TODOS') {
      return tickets
    }

    return tickets.filter(
      ticket => ticket.estado === filtro
    )
  }, [tickets, filtro])

  const contar = (estado: string) => {
    if (estado === 'TODOS') return tickets.length

    return tickets.filter(
      ticket => ticket.estado === estado
    ).length
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Mis tickets</h2>
            <p style={styles.subtitle}>
              Consulta el estado de tus solicitudes.
            </p>
          </div>

          <button
            style={styles.nuevoBtn}
            onClick={() => router.push('/reportar')}
          >
            + Nuevo ticket
          </button>
        </div>

        <div style={styles.stats}>
          {filtros.map(item => (
            <button
              key={item}
              onClick={() => setFiltro(item)}
              style={{
                ...styles.statCard,
                borderColor:
                  filtro === item
                    ? '#1a1a2e'
                    : '#e2e8f0',
              }}
            >
              <span style={styles.statNumero}>
                {contar(item)}
              </span>

              <span style={styles.statLabel}>
                {item}
              </span>
            </button>
          ))}
        </div>

        {cargando ? (
          <div style={styles.mensaje}>
            Cargando tickets...
          </div>
        ) : ticketsFiltrados.length === 0 ? (
          <div style={styles.mensaje}>
            No hay tickets para mostrar.
          </div>
        ) : (
          <div style={styles.lista}>
            {ticketsFiltrados.map(ticket => (
              <div
                key={ticket.id}
                style={styles.ticketCard}
                onClick={() =>
                  router.push(`/tickets/${ticket.id}`)
                }
              >
                <div style={styles.ticketHeader}>
                  <span style={styles.folio}>
                    {ticket.folio}
                  </span>

                  <span
                    style={{
                      ...styles.estado,
                      backgroundColor:
                        coloresEstado[ticket.estado] ||
                        '#718096',
                    }}
                  >
                    {ticket.estado}
                  </span>
                </div>

                <h3 style={styles.aplicacion}>
                  {ticket.aplicacion}
                </h3>

                <p style={styles.problema}>
                  {ticket.problema}
                </p>

                <div style={styles.footer}>
                  <span
                    style={{
                      ...styles.prioridad,
                      color:
                        coloresPrioridad[
                          ticket.prioridad
                        ] || '#666',
                    }}
                  >
                    ● {ticket.prioridad}
                  </span>

                  {ticket.fechaCreacion && (
                    <span style={styles.fecha}>
                      {new Date(
                        ticket.fechaCreacion
                      ).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },

  content: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },

  title: {
    color: '#1a1a2e',
    margin: 0,
  },

  subtitle: {
    color: '#666',
    marginTop: '0.3rem',
  },

  nuevoBtn: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.7rem 1rem',
    cursor: 'pointer',
  },

  stats: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },

  statCard: {
    backgroundColor: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  statNumero: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#1a1a2e',
  },

  statLabel: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.25rem',
  },

  lista: {
    display: 'grid',
    gap: '1rem',
  },

  ticketCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
  },

  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  folio: {
    fontWeight: '700',
    color: '#1a1a2e',
  },

  estado: {
    color: 'white',
    borderRadius: '12px',
    padding: '0.2rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },

  aplicacion: {
    margin: '0.8rem 0 0.4rem',
    color: '#1a1a2e',
  },

  problema: {
    color: '#666',
    lineHeight: 1.5,
    margin: 0,
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
  },

  prioridad: {
    fontSize: '0.85rem',
    fontWeight: '600',
  },

  fecha: {
    fontSize: '0.8rem',
    color: '#999',
  },

  mensaje: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666',
  },
}