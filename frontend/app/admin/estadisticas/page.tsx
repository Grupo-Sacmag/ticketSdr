'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const coloresEstado: Record<string, string> = {
  ABIERTO: '#4299e1',
  'EN PROCESO': '#ed8936',
  RESUELTO: '#48bb78',
  CERRADO: '#a0aec0',
}

type Ticket = {
  id: number
  estado: string
  departamento?: string
  aplicacion: string
}

export default function AdminEstadisticasPage() {
  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/backend/tickets/todos', {
      cache: 'no-store',
    })
      .then(async response => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then(setTickets)
      .catch(error =>
        console.error(
          'Error cargando estadísticas:',
          error
        )
      )
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return (
      <div style={styles.container}>
        <Navbar />
        <p style={styles.cargando}>
          Cargando estadísticas...
        </p>
      </div>
    )
  }

  const total = tickets.length

  const sinAtender = tickets.filter(
    ticket =>
      ticket.estado === 'ABIERTO' ||
      ticket.estado === 'EN PROCESO'
  ).length

  const atendidos = tickets.filter(
    ticket =>
      ticket.estado === 'RESUELTO' ||
      ticket.estado === 'CERRADO'
  ).length

  const porEstado = [
    'ABIERTO',
    'EN PROCESO',
    'RESUELTO',
    'CERRADO',
  ].map(estado => ({
    estado,
    cantidad: tickets.filter(
      ticket => ticket.estado === estado
    ).length,
  }))

  const porDepartamento = Object.entries(
    tickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        const departamento =
          ticket.departamento || 'Sin departamento'

        acc[departamento] =
          (acc[departamento] || 0) + 1

        return acc
      },
      {}
    )
  )
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  const porAplicacion = Object.entries(
    tickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        acc[ticket.aplicacion] =
          (acc[ticket.aplicacion] || 0) + 1

        return acc
      },
      {}
    )
  )
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8)

  const maxDept =
    porDepartamento[0]?.cantidad || 1

  const maxApp =
    porAplicacion[0]?.cantidad || 1

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>
            📊 Estadísticas del sistema
          </h2>

          <p style={styles.pageSubtitle}>
            Resumen de {total} ticket
            {total !== 1 ? 's' : ''} registrados
          </p>
        </div>

        <div style={styles.resumenGrid}>
          <Resumen
            color="#1a1a2e"
            numero={total}
            label="Total de tickets"
          />

          <Resumen
            color="#e53e3e"
            numero={sinAtender}
            label="Sin resolver"
            sub="Abiertos + En proceso"
          />

          <Resumen
            color="#48bb78"
            numero={atendidos}
            label="Resueltos / Cerrados"
            sub={`${
              total > 0
                ? Math.round(
                    (atendidos / total) * 100
                  )
                : 0
            }% del total`}
          />

          <Resumen
            color="#4299e1"
            numero={
              porDepartamento[0]?.nombre || '—'
            }
            label="Área con más tickets"
            sub={`${
              porDepartamento[0]?.cantidad || 0
            } tickets asignados`}
          />
        </div>

        <div style={styles.graficasGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              📋 Tickets por estado
            </h3>

            <div style={styles.estadosGrid}>
              {porEstado.map(
                ({ estado, cantidad }) => (
                  <div
                    key={estado}
                    style={{
                      ...styles.estadoItem,
                      borderLeft: `4px solid ${coloresEstado[estado]}`,
                    }}
                    onClick={() =>
                      router.push('/admin/tickets')
                    }
                  >
                    <p
                      style={{
                        ...styles.estadoNumero,
                        color:
                          coloresEstado[estado],
                      }}
                    >
                      {cantidad}
                    </p>

                    <p style={styles.estadoLabel}>
                      {estado}
                    </p>

                    <p style={styles.estadoPct}>
                      {total > 0
                        ? Math.round(
                            (cantidad / total) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              🏢 Tickets por departamento
            </h3>

            {porDepartamento.length === 0 ? (
              <p style={styles.vacio}>
                Sin datos
              </p>
            ) : (
              <div style={styles.barraLista}>
                {porDepartamento.map(
                  ({ nombre, cantidad }) => (
                    <div
                      key={nombre}
                      style={styles.barraItem}
                    >
                      <div
                        style={styles.barraHeader}
                      >
                        <span
                          style={
                            styles.barraNombre
                          }
                        >
                          {nombre}
                        </span>

                        <span
                          style={
                            styles.barraCantidad
                          }
                        >
                          {cantidad}
                        </span>
                      </div>

                      <div
                        style={styles.barraFondo}
                      >
                        <div
                          style={{
                            ...styles.barraRelleno,
                            width: `${Math.round(
                              (cantidad /
                                maxDept) *
                                100
                            )}%`,
                            backgroundColor:
                              '#1a1a2e',
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            📦 Aplicaciones con más reportes
          </h3>

          {porAplicacion.length === 0 ? (
            <p style={styles.vacio}>
              Sin datos
            </p>
          ) : (
            <div style={styles.appGrid}>
              {porAplicacion.map(
                ({ nombre, cantidad }, index) => (
                  <div
                    key={nombre}
                    style={styles.appItem}
                  >
                    <div
                      style={{
                        ...styles.appRank,
                        backgroundColor:
                          index === 0
                            ? '#d69e2e'
                            : index === 1
                              ? '#a0aec0'
                              : index === 2
                                ? '#ed8936'
                                : '#e2e8f0',
                        color:
                          index <= 2
                            ? 'white'
                            : '#555',
                      }}
                    >
                      #{index + 1}
                    </div>

                    <div style={styles.appInfo}>
                      <p style={styles.appNombre}>
                        {nombre}
                      </p>

                      <div
                        style={styles.barraFondo}
                      >
                        <div
                          style={{
                            ...styles.barraRelleno,
                            width: `${Math.round(
                              (cantidad /
                                maxApp) *
                                100
                            )}%`,
                            backgroundColor:
                              '#4299e1',
                          }}
                        />
                      </div>
                    </div>

                    <span
                      style={
                        styles.appCantidad
                      }
                    >
                      {cantidad}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Resumen({
  color,
  numero,
  label,
  sub,
}: {
  color: string
  numero: string | number
  label: string
  sub?: string
}) {
  return (
    <div
      style={{
        ...styles.resumenCard,
        borderTop: `4px solid ${color}`,
      }}
    >
      <p
        style={{
          ...styles.resumenNumero,
          color,
        }}
      >
        {numero}
      </p>

      <p style={styles.resumenLabel}>
        {label}
      </p>

      {sub && (
        <p style={styles.resumenSub}>
          {sub}
        </p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },

  content: {
    padding: '2rem',
  },

  cargando: {
    padding: '2rem',
    color: '#666',
  },

  pageHeader: {
    marginBottom: '1.5rem',
  },

  pageTitle: {
    margin: '0 0 0.25rem',
    color: '#1a1a2e',
    fontSize: '1.5rem',
  },

  pageSubtitle: {
    margin: 0,
    color: '#666',
  },

  resumenGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },

  resumenCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow:
      '0 2px 6px rgba(0,0,0,0.08)',
  },

  resumenNumero: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0 0 0.25rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  resumenLabel: {
    fontSize: '0.85rem',
    color: '#333',
    margin: '0 0 0.15rem',
    fontWeight: '500',
  },

  resumenSub: {
    fontSize: '0.78rem',
    color: '#999',
    margin: 0,
  },

  graficasGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.08)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },

  cardTitle: {
    margin: '0 0 1.25rem',
    color: '#1a1a2e',
    fontSize: '1rem',
  },

  estadosGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(2, 1fr)',
    gap: '0.75rem',
  },

  estadoItem: {
    padding: '1rem',
    borderRadius: '6px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
  },

  estadoNumero: {
    fontSize: '2rem',
    fontWeight: '700',
    margin: '0 0 0.2rem',
  },

  estadoLabel: {
    fontSize: '0.78rem',
    color: '#555',
    margin: 0,
  },

  estadoPct: {
    fontSize: '0.82rem',
    color: '#999',
    margin: 0,
  },

  barraLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  barraItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },

  barraHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  barraNombre: {
    fontSize: '0.88rem',
    color: '#333',
  },

  barraCantidad: {
    fontSize: '0.88rem',
    color: '#666',
    fontWeight: '600',
  },

  barraFondo: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },

  barraRelleno: {
    height: '100%',
    borderRadius: '4px',
  },

  appGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  appItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },

  appRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
  },

  appInfo: {
    flex: 1,
  },

  appNombre: {
    margin: '0 0 0.3rem',
    fontSize: '0.9rem',
    color: '#333',
  },

  appCantidad: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1a1a2e',
  },

  vacio: {
    color: '#999',
    textAlign: 'center',
    padding: '1rem',
  },
}