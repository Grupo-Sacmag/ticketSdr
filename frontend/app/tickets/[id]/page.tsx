'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

type Usuario = {
  id: number
  nombre: string
  correo?: string
  rol: string
}

type Comentario = {
  id: number
  autor: string
  rolAutor: string
  fecha: string
  texto: string
  tipo: string
  tieneImagen: boolean
}

type Ticket = {
  id: number
  folio: string
  aplicacion: string
  problema: string
  prioridad: string
  estado: string
  fechaCreacion: string
  fechaActualizacion?: string
  fechaCierre?: string
  creadoPor: Usuario
  asignadoA?: Usuario | null
  tieneImagen: boolean
  tieneImagenSolucion: boolean
  comentarios: Comentario[]
}

export default function TicketDetallePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [rol, setRol] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [cargando, setCargando] = useState(true)

  const [imagenProblema, setImagenProblema] = useState<string | null>(null)
  const [imagenSolucion, setImagenSolucion] = useState<string | null>(null)

  const [usuariosSoporte, setUsuariosSoporte] = useState<Usuario[]>([])

  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')
  const [asignadoId, setAsignadoId] = useState('')

  const [textoComentario, setTextoComentario] = useState('')
  const [tipoComentario, setTipoComentario] = useState('SEGUIMIENTO')
  const [imagenComentario, setImagenComentario] = useState<File | null>(null)

  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)

  const puedeGestionar = rol === 'ADMIN' || rol === 'SOPORTE'

  const mostrarMensaje = (
    tipo: 'exito' | 'error',
    texto: string
  ) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3500)
  }

  const cargarBlob = async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) return null

    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }

  const cargarDetalle = async () => {
    setCargando(true)

    try {
      const response = await fetch(
        `/api/backend/tickets/${id}`,
        { cache: 'no-store' }
      )

      if (!response.ok) throw new Error()

      const data: Ticket = await response.json()

      setTicket(data)
      setNuevoEstado(data.estado)
      setNuevaPrioridad(data.prioridad)
      setAsignadoId(data.asignadoA?.id?.toString() || '')

      if (data.tieneImagen) {
        setImagenProblema(
          await cargarBlob(`/api/backend/tickets/${id}/imagen`)
        )
      }

      if (data.tieneImagenSolucion) {
        setImagenSolucion(
          await cargarBlob(
            `/api/backend/tickets/${id}/imagen-solucion`
          )
        )
      }
    } catch {
      mostrarMensaje('error', 'Error al cargar el ticket')
      setTicket(null)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const iniciar = async () => {
      const sessionResponse = await fetch('/api/auth/session', {
        cache: 'no-store',
      })

      if (!sessionResponse.ok) {
        router.replace('/login')
        return
      }

      const session = await sessionResponse.json()
      const nuevoRol = session.usuario.rol

      setRol(nuevoRol)

      await cargarDetalle()

      if (nuevoRol === 'ADMIN' || nuevoRol === 'SOPORTE') {
        try {
          const response = await fetch(
            '/api/backend/auth/usuarios',
            { cache: 'no-store' }
          )

          if (response.ok) {
            const usuarios: Usuario[] = await response.json()

            setUsuariosSoporte(
              usuarios.filter(
                u => u.rol === 'SOPORTE' || u.rol === 'ADMIN'
              )
            )
          }
        } catch {
          console.error('Error cargando usuarios de soporte')
        }
      }
    }

    void iniciar()
  }, [id])

  const ejecutarPut = async (
    endpoint: string,
    body: unknown,
    mensajeExito: string,
    mensajeError: string
  ) => {
    setGuardando(true)

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
      await cargarDetalle()
    } catch {
      mostrarMensaje('error', mensajeError)
    } finally {
      setGuardando(false)
    }
  }

  const handleAgregarComentario = async () => {
    if (!textoComentario.trim()) return

    setGuardando(true)

    try {
      const data = new FormData()

      data.append('texto', textoComentario)
      data.append('tipo', tipoComentario)

      if (imagenComentario) {
        data.append('imagen', imagenComentario)
      }

      const response = await fetch(
        `/api/backend/tickets/${id}/comentario`,
        {
          method: 'POST',
          body: data,
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje('exito', 'Comentario agregado')

      setTextoComentario('')
      setImagenComentario(null)

      await cargarDetalle()
    } catch {
      mostrarMensaje('error', 'Error al agregar comentario')
    } finally {
      setGuardando(false)
    }
  }

  const iconoTipo = (tipo: string) => {
    if (tipo === 'SOLUCION') return '✅'
    if (tipo === 'RECHAZO') return '❌'
    return '💬'
  }

  if (cargando) {
    return (
      <div style={styles.container}>
        <Navbar />
        <p style={styles.loading}>Cargando ticket...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={styles.container}>
        <Navbar />
        <p style={{ ...styles.loading, color: '#e53e3e' }}>
          Ticket no encontrado.
        </p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <button
              style={styles.btnVolver}
              onClick={() => router.back()}
            >
              ← Volver
            </button>

            <h2 style={styles.folio}>{ticket.folio}</h2>

            <div style={styles.badgesRow}>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: coloresEstado[ticket.estado],
                }}
              >
                {ticket.estado}
              </span>

              <span
                style={{
                  ...styles.badge,
                  backgroundColor:
                    coloresPrioridad[ticket.prioridad],
                }}
              >
                {ticket.prioridad}
              </span>
            </div>
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
        </div>

        <div style={styles.grid}>
          <div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                📋 Información del ticket
              </h3>

              <div style={styles.infoGrid}>
                <Info label="Aplicación" value={ticket.aplicacion} />

                <Info
                  label="Reportado por"
                  value={ticket.creadoPor.nombre}
                  sub={ticket.creadoPor.correo}
                />

                <Info
                  label="Asignado a"
                  value={
                    ticket.asignadoA?.nombre || 'Sin asignar'
                  }
                />

                <Info
                  label="Fecha de alta"
                  value={ticket.fechaCreacion}
                />

                {ticket.fechaActualizacion && (
                  <Info
                    label="Última actualización"
                    value={ticket.fechaActualizacion}
                  />
                )}

                {ticket.fechaCierre && (
                  <Info
                    label="Fecha de cierre"
                    value={ticket.fechaCierre}
                  />
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                🐛 Problema reportado
              </h3>

              <p style={styles.problemaTexto}>
                {ticket.problema}
              </p>

              {imagenProblema && (
                <Imagen url={imagenProblema} alt="Captura del problema" />
              )}
            </div>

            {imagenSolucion && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  ✅ Evidencia de solución
                </h3>

                <Imagen
                  url={imagenSolucion}
                  alt="Captura de solución"
                />
              </div>
            )}

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💬 Historial</h3>

              {ticket.comentarios.length === 0 ? (
                <p style={{ color: '#999' }}>
                  Sin comentarios aún.
                </p>
              ) : (
                <div style={styles.timeline}>
                  {ticket.comentarios.map(comentario => (
                    <div
                      key={comentario.id}
                      style={{
                        ...styles.timelineItem,
                        borderLeft: `3px solid ${
                          comentario.tipo === 'SOLUCION'
                            ? '#48bb78'
                            : comentario.tipo === 'RECHAZO'
                              ? '#e53e3e'
                              : '#4299e1'
                        }`,
                      }}
                    >
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineAutor}>
                          {iconoTipo(comentario.tipo)}{' '}
                          {comentario.autor}
                          <span style={styles.timelineRol}>
                            {' '}
                            · {comentario.rolAutor}
                          </span>
                        </span>

                        <span style={styles.timelineFecha}>
                          {comentario.fecha}
                        </span>
                      </div>

                      <p style={styles.timelineTexto}>
                        {comentario.texto}
                      </p>

                      {comentario.tieneImagen && (
                        <ImagenComentario
                          comentarioId={comentario.id}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            {puedeGestionar && (
              <>
                <AccionCard titulo="🔄 Cambiar estado">
                  <select
                    value={nuevoEstado}
                    onChange={e =>
                      setNuevoEstado(e.target.value)
                    }
                    style={styles.select}
                  >
                    {ESTADOS.map(estado => (
                      <option key={estado}>{estado}</option>
                    ))}
                  </select>

                  <button
                    style={styles.btn}
                    disabled={
                      guardando ||
                      nuevoEstado === ticket.estado
                    }
                    onClick={() =>
                      ejecutarPut(
                        `/api/backend/tickets/${id}/estado`,
                        { estado: nuevoEstado },
                        `Estado actualizado a "${nuevoEstado}"`,
                        'Error al cambiar estado'
                      )
                    }
                  >
                    💾 Guardar estado
                  </button>
                </AccionCard>

                <AccionCard titulo="🎯 Cambiar prioridad">
                  <select
                    value={nuevaPrioridad}
                    onChange={e =>
                      setNuevaPrioridad(e.target.value)
                    }
                    style={styles.select}
                  >
                    {PRIORIDADES.map(prioridad => (
                      <option key={prioridad}>{prioridad}</option>
                    ))}
                  </select>

                  <button
                    style={{
                      ...styles.btn,
                      backgroundColor: '#4299e1',
                    }}
                    disabled={
                      guardando ||
                      nuevaPrioridad === ticket.prioridad
                    }
                    onClick={() =>
                      ejecutarPut(
                        `/api/backend/tickets/${id}/prioridad`,
                        { prioridad: nuevaPrioridad },
                        `Prioridad actualizada a "${nuevaPrioridad}"`,
                        'Error al cambiar prioridad'
                      )
                    }
                  >
                    💾 Guardar prioridad
                  </button>
                </AccionCard>

                <AccionCard titulo="👤 Asignar ticket">
                  <select
                    value={asignadoId}
                    onChange={e =>
                      setAsignadoId(e.target.value)
                    }
                    style={styles.select}
                  >
                    <option value="">— Sin asignar —</option>

                    {usuariosSoporte.map(usuario => (
                      <option
                        key={usuario.id}
                        value={usuario.id}
                      >
                        {usuario.nombre} ({usuario.rol})
                      </option>
                    ))}
                  </select>

                  <button
                    style={{
                      ...styles.btn,
                      backgroundColor: '#9b59b6',
                    }}
                    disabled={guardando || !asignadoId}
                    onClick={() =>
                      ejecutarPut(
                        `/api/backend/tickets/${id}/asignar`,
                        { usuarioId: Number(asignadoId) },
                        'Ticket asignado correctamente',
                        'Error al asignar'
                      )
                    }
                  >
                    👤 Asignar
                  </button>
                </AccionCard>
              </>
            )}

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                ✏️ Agregar comentario
              </h3>

              {puedeGestionar && (
                <select
                  value={tipoComentario}
                  onChange={e =>
                    setTipoComentario(e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="SEGUIMIENTO">
                    💬 Seguimiento
                  </option>
                  <option value="SOLUCION">
                    ✅ Solución aplicada
                  </option>
                  <option value="RECHAZO">
                    ❌ Rechazo
                  </option>
                </select>
              )}

              <textarea
                value={textoComentario}
                onChange={e =>
                  setTextoComentario(e.target.value)
                }
                placeholder={
                  puedeGestionar
                    ? 'Describe la solución aplicada, avance o motivo de rechazo...'
                    : 'Agrega información adicional sobre el problema...'
                }
                style={styles.textarea}
                rows={4}
              />

              {puedeGestionar && (
                <>
                  <label style={styles.dropzone}>
                    {imagenComentario
                      ? `📎 ${imagenComentario.name}`
                      : '📁 Clic para seleccionar una imagen'}

                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      hidden
                      onChange={e =>
                        setImagenComentario(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>

                  {imagenComentario && (
                    <button
                      style={styles.btnQuitar}
                      onClick={() =>
                        setImagenComentario(null)
                      }
                    >
                      ✕ Quitar imagen
                    </button>
                  )}
                </>
              )}

              <button
                style={{
                  ...styles.btn,
                  backgroundColor: '#48bb78',
                }}
                disabled={
                  guardando || !textoComentario.trim()
                }
                onClick={handleAgregarComentario}
              >
                {guardando
                  ? 'Enviando...'
                  : '📨 Enviar comentario'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Info({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValor}>{value}</span>
      {sub && <span style={styles.infoSub}>{sub}</span>}
    </div>
  )
}

function Imagen({
  url,
  alt,
}: {
  url: string
  alt: string
}) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <img
        src={url}
        alt={alt}
        style={styles.imagen}
        onClick={() => window.open(url, '_blank')}
      />
      <p style={styles.imagenHint}>🔍 Clic para ampliar</p>
    </div>
  )
}

function ImagenComentario({
  comentarioId,
}: {
  comentarioId: number
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null

    fetch(
      `/api/backend/tickets/comentario/${comentarioId}/imagen`
    )
      .then(response => {
        if (!response.ok) throw new Error()
        return response.blob()
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [comentarioId])

  if (!url) return null

  return <Imagen url={url} alt="Evidencia" />
}

function AccionCard({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{titulo}</h3>
      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  content: { padding: '1.5rem 2rem' },
  loading: { padding: '2rem', color: '#666' },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },

  btnVolver: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '0.5rem',
  },

  folio: {
    margin: '0 0 0.5rem',
    color: '#1a1a2e',
  },

  badgesRow: { display: 'flex', gap: '0.5rem' },

  badge: {
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },

  mensajeBox: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 340px',
    gap: '1.5rem',
    alignItems: 'start',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },

  cardTitle: {
    margin: '0 0 1rem',
    color: '#1a1a2e',
    fontSize: '1rem',
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },

  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },

  infoLabel: {
    fontSize: '0.72rem',
    color: '#999',
    textTransform: 'uppercase',
  },

  infoValor: { color: '#222' },
  infoSub: { fontSize: '0.8rem', color: '#888' },

  problemaTexto: {
    backgroundColor: '#f8f9fa',
    padding: '0.75rem',
    borderRadius: '6px',
    color: '#333',
    lineHeight: 1.7,
  },

  imagen: {
    maxWidth: '100%',
    maxHeight: '320px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },

  imagenHint: {
    fontSize: '0.78rem',
    color: '#aaa',
  },

  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  timelineItem: {
    paddingLeft: '1rem',
  },

  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },

  timelineAutor: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#1a1a2e',
  },

  timelineRol: {
    color: '#888',
    fontSize: '0.8rem',
  },

  timelineFecha: {
    fontSize: '0.78rem',
    color: '#aaa',
  },

  timelineTexto: {
    color: '#444',
    lineHeight: 1.6,
  },

  select: {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '0.75rem',
  },

  textarea: {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    resize: 'vertical',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  },

  btn: {
    width: '100%',
    padding: '0.7rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  dropzone: {
    display: 'block',
    border: '2px dashed #ccc',
    borderRadius: '6px',
    padding: '0.75rem',
    textAlign: 'center',
    cursor: 'pointer',
    color: '#888',
    marginBottom: '0.5rem',
  },

  btnQuitar: {
    background: 'transparent',
    border: 'none',
    color: '#e53e3e',
    cursor: 'pointer',
    marginBottom: '0.75rem',
  },
}