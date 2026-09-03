'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ESTADOS = ['ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

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

type Ticket = {
  id: number
  folio: string
  creadoPor: string
  correoUsuario: string
  aplicacion: string
  departamento?: string
  prioridad: string
  estado: string
  fechaCreacion: string
  problema: string
  rutaImagen?: string | null
  asignadoA?: string
  asignadoId?: number
}

type Departamento = {
  id: number
  nombre: string
}

type UsuarioAsignable = {
  id: number
  nombre: string
  rol: string
  departamento?: string
}

export default function AdminTicketsPage() {
  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)

  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS')
  const [filtroDepartamento, setFiltroDepartamento] = useState('TODOS')

  const [departamentos, setDepartamentos] = useState<Departamento[]>([])

  const [ticketSeleccionado, setTicketSeleccionado] =
    useState<Ticket | null>(null)

  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')

  const [usuariosAsignables, setUsuariosAsignables] =
    useState<UsuarioAsignable[]>([])

  const [asignadoId, setAsignadoId] = useState('')

  const [actualizando, setActualizando] = useState(false)
  const [asignando, setAsignando] = useState(false)

  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [cargandoImagen, setCargandoImagen] = useState(false)

  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)

  const mostrarMensaje = (
    tipo: 'exito' | 'error',
    texto: string
  ) => {
    setMensaje({ tipo, texto })

    setTimeout(() => {
      setMensaje(null)
    }, 3000)
  }

  const cargarTickets = async () => {
    try {
      const response = await fetch(
        '/api/backend/tickets/todos',
        { cache: 'no-store' }
      )

      if (!response.ok) throw new Error()

      setTickets(await response.json())
    } catch (error) {
      console.error('Error cargando tickets:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarTickets()

    fetch('/api/backend/catalogos/departamentos', {
      cache: 'no-store',
    })
      .then(response => response.json())
      .then(setDepartamentos)
      .catch(error =>
        console.error(
          'Error cargando departamentos:',
          error
        )
      )
  }, [])

  const handleSeleccionar = async (ticket: Ticket) => {
    setTicketSeleccionado(ticket)

    setNuevoEstado(ticket.estado)
    setNuevaPrioridad(ticket.prioridad)
    setAsignadoId(ticket.asignadoId?.toString() || '')

    if (imagenUrl) {
      URL.revokeObjectURL(imagenUrl)
    }

    setImagenUrl(null)

    try {
      const response = await fetch(
        '/api/backend/tickets/asignables',
        { cache: 'no-store' }
      )

      if (response.ok) {
        setUsuariosAsignables(await response.json())
      }
    } catch (error) {
      console.error(
        'Error cargando usuarios asignables:',
        error
      )
    }

    if (ticket.rutaImagen) {
      setCargandoImagen(true)

      try {
        const response = await fetch(
          `/api/backend/tickets/${ticket.id}/imagen`,
          { cache: 'no-store' }
        )

        if (response.ok) {
          const blob = await response.blob()

          setImagenUrl(
            URL.createObjectURL(blob)
          )
        }
      } catch (error) {
        console.error(
          'Error cargando imagen:',
          error
        )
      } finally {
        setCargandoImagen(false)
      }
    }
  }

  const actualizar = async (
    endpoint: string,
    body: unknown,
    mensajeExito: string,
    mensajeError: string
  ) => {
    setActualizando(true)

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error()

      mostrarMensaje('exito', mensajeExito)

      await cargarTickets()
    } catch {
      mostrarMensaje('error', mensajeError)
    } finally {
      setActualizando(false)
    }
  }

  const handleCambiarEstado = async () => {
    if (!ticketSeleccionado || !nuevoEstado) return

    await actualizar(
      `/api/backend/tickets/${ticketSeleccionado.id}/estado`,
      { estado: nuevoEstado },
      `Estado actualizado a "${nuevoEstado}"`,
      'Error al actualizar el estado'
    )

    setTicketSeleccionado(prev =>
      prev
        ? {
            ...prev,
            estado: nuevoEstado,
          }
        : prev
    )
  }

  const handleCambiarPrioridad = async () => {
    if (!ticketSeleccionado || !nuevaPrioridad) return

    await actualizar(
      `/api/backend/tickets/${ticketSeleccionado.id}/prioridad`,
      { prioridad: nuevaPrioridad },
      `Prioridad actualizada a "${nuevaPrioridad}"`,
      'Error al actualizar la prioridad'
    )

    setTicketSeleccionado(prev =>
      prev
        ? {
            ...prev,
            prioridad: nuevaPrioridad,
          }
        : prev
    )
  }

  const handleAsignar = async () => {
    if (!ticketSeleccionado || !asignadoId) return

    setAsignando(true)

    try {
      const response = await fetch(
        `/api/backend/tickets/${ticketSeleccionado.id}/asignar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuarioId: Number(asignadoId),
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        'Ticket asignado correctamente'
      )

      await cargarTickets()

      const asignado = usuariosAsignables.find(
        usuario => usuario.id === Number(asignadoId)
      )

      setTicketSeleccionado(prev =>
        prev
          ? {
              ...prev,
              asignadoA: asignado?.nombre || '',
              asignadoId: Number(asignadoId),
            }
          : prev
      )
    } catch {
      mostrarMensaje(
        'error',
        'Error al asignar el ticket'
      )
    } finally {
      setAsignando(false)
    }
  }

  const cerrarPanel = () => {
    if (imagenUrl) {
      URL.revokeObjectURL(imagenUrl)
    }

    setTicketSeleccionado(null)
    setNuevoEstado('')
    setNuevaPrioridad('')
    setAsignadoId('')
    setImagenUrl(null)
  }

  const ticketsFiltrados = tickets
    .filter(
      ticket =>
        filtroEstado === 'TODOS' ||
        ticket.estado === filtroEstado
    )
    .filter(
      ticket =>
        filtroPrioridad === 'TODAS' ||
        ticket.prioridad === filtroPrioridad
    )
    .filter(
      ticket =>
        filtroDepartamento === 'TODOS' ||
        ticket.departamento === filtroDepartamento
    )

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.statsRow}>
          {ESTADOS.map(estado => (
            <div
              key={estado}
              style={{
                ...styles.statCard,
                borderTop: `4px solid ${coloresEstado[estado]}`,
                outline:
                  filtroEstado === estado
                    ? `2px solid ${coloresEstado[estado]}`
                    : 'none',
              }}
              onClick={() =>
                setFiltroEstado(
                  filtroEstado === estado
                    ? 'TODOS'
                    : estado
                )
              }
            >
              <p style={styles.statNumero}>
                {
                  tickets.filter(
                    ticket => ticket.estado === estado
                  ).length
                }
              </p>

              <p style={styles.statLabel}>
                {estado}
              </p>
            </div>
          ))}
        </div>

        {mensaje && (
          <div
            style={{
              ...styles.mensajeBox,
              backgroundColor:
                mensaje.tipo === 'exito'
                  ? '#c6f6d5'
                  : '#fed7d7',
              color:
                mensaje.tipo === 'exito'
                  ? '#276749'
                  : '#9b2c2c',
            }}
          >
            {mensaje.tipo === 'exito' ? '✅' : '❌'}{' '}
            {mensaje.texto}
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              📊 Todos los tickets
            </h3>

            <div style={styles.filtrosContainer}>
              <Filtro
                label="Estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
              >
                <option value="TODOS">Todos</option>

                {ESTADOS.map(estado => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </Filtro>

              <Filtro
                label="Prioridad"
                value={filtroPrioridad}
                onChange={setFiltroPrioridad}
              >
                <option value="TODAS">Todas</option>

                {PRIORIDADES.map(prioridad => (
                  <option
                    key={prioridad}
                    value={prioridad}
                  >
                    {prioridad}
                  </option>
                ))}
              </Filtro>

              <Filtro
                label="Departamento"
                value={filtroDepartamento}
                onChange={setFiltroDepartamento}
              >
                <option value="TODOS">Todos</option>
                <option value="Sin departamento">
                  Sin departamento
                </option>

                {departamentos.map(departamento => (
                  <option
                    key={departamento.id}
                    value={departamento.nombre}
                  >
                    {departamento.nombre}
                  </option>
                ))}
              </Filtro>

              {(filtroEstado !== 'TODOS' ||
                filtroPrioridad !== 'TODAS' ||
                filtroDepartamento !== 'TODOS') && (
                <button
                  style={styles.btnLimpiar}
                  onClick={() => {
                    setFiltroEstado('TODOS')
                    setFiltroPrioridad('TODAS')
                    setFiltroDepartamento('TODOS')
                  }}
                >
                  ✕ Limpiar filtros
                </button>
              )}

              <p style={styles.totalTickets}>
                {ticketsFiltrados.length} ticket(s)
              </p>
            </div>
          </div>

          {cargando ? (
            <p style={styles.mensajeVacio}>
              Cargando tickets...
            </p>
          ) : ticketsFiltrados.length === 0 ? (
            <p style={styles.mensajeVacio}>
              No hay tickets con los filtros seleccionados.
            </p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.th}>Folio</th>
                    <th style={styles.th}>Empleado</th>
                    <th style={styles.th}>Aplicación</th>
                    <th style={styles.th}>Departamento</th>
                    <th style={styles.th}>Prioridad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {ticketsFiltrados.map(ticket => (
                    <tr
                      key={ticket.id}
                      style={{
                        backgroundColor:
                          ticketSeleccionado?.id ===
                          ticket.id
                            ? '#ebf8ff'
                            : 'white',
                      }}
                    >
                      <td style={styles.td}>
                        <strong>{ticket.folio}</strong>
                      </td>

                      <td style={styles.td}>
                        <div>{ticket.creadoPor}</div>
                        <div style={styles.correoSmall}>
                          {ticket.correoUsuario}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {ticket.aplicacion}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.deptBadge}>
                          {ticket.departamento ||
                            'Sin departamento'}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              coloresPrioridad[
                                ticket.prioridad
                              ],
                          }}
                        >
                          {ticket.prioridad}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              coloresEstado[
                                ticket.estado
                              ],
                          }}
                        >
                          {ticket.estado}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {new Date(
                          ticket.fechaCreacion
                        ).toLocaleDateString('es-MX')}
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.accionBtn}
                          onClick={() =>
                            void handleSeleccionar(ticket)
                          }
                        >
                          ✏️ Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {ticketSeleccionado && (
          <div style={styles.card}>
            <div style={styles.panelHeader}>
              <h3 style={styles.cardTitle}>
                ✏️ Gestionar — {ticketSeleccionado.folio}
              </h3>

              <button
                onClick={cerrarPanel}
                style={styles.cerrarBtn}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={styles.detalleGrid}>
              <Detalle
                label="Empleado"
                value={ticketSeleccionado.creadoPor}
              />

              <Detalle
                label="Aplicación"
                value={ticketSeleccionado.aplicacion}
              />

              <Detalle
                label="Departamento"
                value={
                  ticketSeleccionado.departamento ||
                  'Sin departamento'
                }
              />
            </div>

            <div style={styles.detalleItem}>
              <span style={styles.detalleLabel}>
                Descripción del problema
              </span>

              <p style={styles.descripcionTexto}>
                {ticketSeleccionado.problema}
              </p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span style={styles.detalleLabel}>
                Captura de pantalla
              </span>

              {cargandoImagen ? (
                <p>Cargando imagen...</p>
              ) : imagenUrl ? (
                <>
                  <img
                    src={imagenUrl}
                    alt="Captura del problema"
                    style={styles.imagenTicket}
                    onClick={() =>
                      window.open(imagenUrl, '_blank')
                    }
                  />

                  <p style={styles.imagenHint}>
                    🔍 Clic para ver en tamaño completo
                  </p>
                </>
              ) : (
                <p style={styles.sinImagen}>
                  Sin captura de pantalla
                </p>
              )}
            </div>

            <div style={styles.accionesGrid}>
              <Accion titulo="Cambiar estado">
                <select
                  value={nuevoEstado}
                  onChange={e =>
                    setNuevoEstado(e.target.value)
                  }
                  style={styles.input}
                >
                  {ESTADOS.map(estado => (
                    <option key={estado}>
                      {estado}
                    </option>
                  ))}
                </select>

                <button
                  style={styles.btnGuardar}
                  disabled={
                    actualizando ||
                    nuevoEstado ===
                      ticketSeleccionado.estado
                  }
                  onClick={handleCambiarEstado}
                >
                  💾 Guardar estado
                </button>
              </Accion>

              <Accion titulo="Cambiar prioridad">
                <select
                  value={nuevaPrioridad}
                  onChange={e =>
                    setNuevaPrioridad(e.target.value)
                  }
                  style={styles.input}
                >
                  {PRIORIDADES.map(prioridad => (
                    <option key={prioridad}>
                      {prioridad}
                    </option>
                  ))}
                </select>

                <button
                  style={{
                    ...styles.btnGuardar,
                    backgroundColor: '#4299e1',
                  }}
                  disabled={
                    actualizando ||
                    nuevaPrioridad ===
                      ticketSeleccionado.prioridad
                  }
                  onClick={handleCambiarPrioridad}
                >
                  🎯 Guardar prioridad
                </button>
              </Accion>

              <Accion titulo="Asignar a">
                <select
                  value={asignadoId}
                  onChange={e =>
                    setAsignadoId(e.target.value)
                  }
                  style={styles.input}
                >
                  <option value="">
                    — Sin asignar —
                  </option>

                  {usuariosAsignables.map(usuario => (
                    <option
                      key={usuario.id}
                      value={usuario.id}
                    >
                      {usuario.nombre} ({usuario.rol})
                      {usuario.departamento &&
                      usuario.departamento !==
                        'Sin departamento'
                        ? ` · ${usuario.departamento}`
                        : ''}
                    </option>
                  ))}
                </select>

                <button
                  style={{
                    ...styles.btnGuardar,
                    backgroundColor: '#9b59b6',
                  }}
                  disabled={asignando || !asignadoId}
                  onClick={handleAsignar}
                >
                  {asignando
                    ? 'Asignando...'
                    : '👤 Asignar ticket'}
                </button>
              </Accion>

              <Accion titulo="Detalle completo">
                <p style={styles.accionTexto}>
                  Ver historial, imágenes y gestión avanzada.
                </p>

                <button
                  style={{
                    ...styles.btnGuardar,
                    backgroundColor: '#48bb78',
                  }}
                  onClick={() =>
                    router.push(
                      `/tickets/${ticketSeleccionado.id}`
                    )
                  }
                >
                  🔍 Ver detalle completo →
                </button>
              </Accion>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Filtro({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div style={styles.filtroGrupo}>
      <label style={styles.filtroLabel}>
        {label}:
      </label>

      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.filtroSelect}
      >
        {children}
      </select>
    </div>
  )
}

function Detalle({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.detalleItem}>
      <span style={styles.detalleLabel}>
        {label}
      </span>

      <span>{value}</span>
    </div>
  )
}

function Accion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.accionCard}>
      <label style={styles.label}>
        {titulo}
      </label>

      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },

  content: { padding: '2rem' },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },

  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    cursor: 'pointer',
  },

  statNumero: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },

  statLabel: {
    fontSize: '0.78rem',
    color: '#666',
  },

  mensajeBox: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '2rem',
    marginBottom: '1.5rem',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },

  cardTitle: {
    margin: 0,
    color: '#1a1a2e',
  },

  filtrosContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  filtroGrupo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  filtroLabel: {
    fontSize: '0.85rem',
    color: '#666',
  },

  filtroSelect: {
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },

  btnLimpiar: {
    background: 'transparent',
    border: '1px solid #ccc',
    padding: '0.4rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  totalTickets: {
    fontSize: '0.85rem',
    color: '#666',
  },

  mensajeVacio: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem',
  },

  tableContainer: {
    overflowX: 'auto',
  },

  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    backgroundColor: '#f0f2f5',
    padding: '0.75rem 1rem',
    textAlign: 'left',
  },

  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
  },

  correoSmall: {
    fontSize: '0.78rem',
    color: '#999',
  },

  badge: {
    color: 'white',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
  },

  deptBadge: {
    fontSize: '0.78rem',
    backgroundColor: '#edf2f7',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
  },

  accionBtn: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '0.35rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  cerrarBtn: {
    background: 'transparent',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  detalleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },

  detalleItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    marginBottom: '0.5rem',
  },

  detalleLabel: {
    fontSize: '0.75rem',
    color: '#999',
    textTransform: 'uppercase',
  },

  descripcionTexto: {
    backgroundColor: '#f0f2f5',
    padding: '0.75rem',
    borderRadius: '4px',
  },

  imagenTicket: {
    maxWidth: '100%',
    maxHeight: '300px',
    cursor: 'pointer',
  },

  imagenHint: {
    fontSize: '0.78rem',
    color: '#999',
  },

  sinImagen: {
    color: '#999',
    fontSize: '0.85rem',
  },

  accionesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },

  accionCard: {
    backgroundColor: '#f8f9fa',
    padding: '1.25rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  label: {
    fontWeight: '600',
  },

  input: {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },

  btnGuardar: {
    width: '100%',
    padding: '0.7rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  accionTexto: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
}