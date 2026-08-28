import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const BASE = 'http://localhost:8080/api'

const coloresPrioridad = {
  'Baja': '#48bb78', 'Media': '#ed8936',
  'Alta': '#e53e3e', 'Crítica': '#742a2a'
}
const coloresEstado = {
  'ABIERTO': '#4299e1', 'EN PROCESO': '#ed8936',
  'RESUELTO': '#48bb78', 'CERRADO': '#a0aec0'
}
const ESTADOS    = ['ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

function TicketDetalle() {
  const { id }   = useParams()     // id viene de /tickets/:id
  const navigate = useNavigate()
  const usuario  = JSON.parse(localStorage.getItem('usuario') || '{}')
  const token    = localStorage.getItem('token')
  const headers  = { Authorization: `Bearer ${token}` }
  const esAdmin  = usuario.rol === 'ADMIN'
  const esSoporte = usuario.rol === 'SOPORTE'
  const puedeGestionar = esAdmin || esSoporte

  // ── Estado principal ──────────────────────────────────────────────────────
  const [ticket, setTicket]               = useState(null)
  const [cargando, setCargando]           = useState(true)
  const [imagenProblema, setImagenProblema] = useState(null)
  const [imagenSolucion, setImagenSolucion] = useState(null)
  const [usuariosSoporte, setUsuariosSoporte] = useState([])
  const [mensaje, setMensaje]             = useState(null)

  // ── Estado del formulario de acciones ─────────────────────────────────────
  const [nuevoEstado, setNuevoEstado]     = useState('')
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')
  const [asignadoId, setAsignadoId]       = useState('')
  const [textoComentario, setTextoComentario] = useState('')
  const [tipoComentario, setTipoComentario]   = useState('SEGUIMIENTO')
  const [imagenComentario, setImagenComentario] = useState(null)
  const [guardando, setGuardando]         = useState(false)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    cargarDetalle()
    if (puedeGestionar) cargarUsuariosSoporte()
  }, [id])

  const cargarDetalle = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get(`${BASE}/tickets/${id}`, { headers })
      setTicket(data)
      setNuevoEstado(data.estado)
      setNuevaPrioridad(data.prioridad)
      setAsignadoId(data.asignadoA?.id || '')

      // Cargamos la imagen del problema si existe
      if (data.tieneImagen) {
        const res = await axios.get(`${BASE}/tickets/${id}/imagen`,
          { headers, responseType: 'blob' })
        setImagenProblema(URL.createObjectURL(res.data))
      }
      // Cargamos la imagen de solución si existe
      if (data.tieneImagenSolucion) {
        const res = await axios.get(`${BASE}/tickets/${id}/imagen-solucion`,
          { headers, responseType: 'blob' })
        setImagenSolucion(URL.createObjectURL(res.data))
      }
    } catch (err) {
      mostrarMensaje('error', 'Error al cargar el ticket')
    } finally {
      setCargando(false)
    }
  }

  // Lista de soporte/admin para el selector de asignación
  const cargarUsuariosSoporte = async () => {
    try {
      const { data } = await axios.get(`${BASE}/auth/usuarios`, { headers })
      setUsuariosSoporte(data.filter(u =>
        u.rol === 'SOPORTE' || u.rol === 'ADMIN'))
    } catch (err) {
      console.error('Error cargando usuarios de soporte')
    }
  }

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleCambiarEstado = async () => {
    setGuardando(true)
    try {
      await axios.put(`${BASE}/tickets/${id}/estado`, { estado: nuevoEstado }, { headers })
      mostrarMensaje('exito', `Estado actualizado a "${nuevoEstado}"`)
      cargarDetalle()
    } catch { mostrarMensaje('error', 'Error al cambiar estado') }
    finally { setGuardando(false) }
  }

  const handleCambiarPrioridad = async () => {
    setGuardando(true)
    try {
      await axios.put(`${BASE}/tickets/${id}/prioridad`, { prioridad: nuevaPrioridad }, { headers })
      mostrarMensaje('exito', `Prioridad actualizada a "${nuevaPrioridad}"`)
      cargarDetalle()
    } catch { mostrarMensaje('error', 'Error al cambiar prioridad') }
    finally { setGuardando(false) }
  }

  const handleAsignar = async () => {
    if (!asignadoId) return
    setGuardando(true)
    try {
      await axios.put(`${BASE}/tickets/${id}/asignar`,
        { usuarioId: Number(asignadoId) }, { headers })
      mostrarMensaje('exito', 'Ticket asignado correctamente')
      cargarDetalle()
    } catch { mostrarMensaje('error', 'Error al asignar') }
    finally { setGuardando(false) }
  }

  const handleAgregarComentario = async () => {
    if (!textoComentario.trim()) return
    setGuardando(true)
    try {
      const formData = new FormData()
      formData.append('texto', textoComentario)
      formData.append('tipo', tipoComentario)
      if (imagenComentario) formData.append('imagen', imagenComentario)

      await axios.post(`${BASE}/tickets/${id}/comentario`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      mostrarMensaje('exito', 'Comentario agregado')
      setTextoComentario('')
      setImagenComentario(null)
      cargarDetalle()
    } catch { mostrarMensaje('error', 'Error al agregar comentario') }
    finally { setGuardando(false) }
  }

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3500)
  }

  // ── Icono por tipo de comentario ──────────────────────────────────────────
  const iconoTipo = (tipo) => {
    if (tipo === 'SOLUCION') return '✅'
    if (tipo === 'RECHAZO')  return '❌'
    return '💬'
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div style={styles.container}>
      <Navbar />
      <p style={{ padding: '2rem', color: '#666' }}>Cargando ticket...</p>
    </div>
  )

  if (!ticket) return (
    <div style={styles.container}>
      <Navbar />
      <p style={{ padding: '2rem', color: '#e53e3e' }}>Ticket no encontrado.</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>

        {/* Encabezado */}
        <div style={styles.header}>
          <div>
            <button style={styles.btnVolver} onClick={() => navigate(-1)}>← Volver</button>
            <h2 style={styles.folio}>{ticket.folio}</h2>
            <div style={styles.badgesRow}>
              <span style={{ ...styles.badge, backgroundColor: coloresEstado[ticket.estado] }}>
                {ticket.estado}
              </span>
              <span style={{ ...styles.badge, backgroundColor: coloresPrioridad[ticket.prioridad] }}>
                {ticket.prioridad}
              </span>
            </div>
          </div>
          {mensaje && (
            <div style={{
              ...styles.mensajeBox,
              backgroundColor: mensaje.tipo === 'exito' ? '#c6f6d5' : '#fed7d7',
              color: mensaje.tipo === 'exito' ? '#276749' : '#9b2c2c'
            }}>
              {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
            </div>
          )}
        </div>

        <div style={styles.grid}>

          {/* ── Columna izquierda: info del ticket ── */}
          <div>

            {/* Datos generales */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Información del ticket</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Aplicación</span>
                  <span style={styles.infoValor}>{ticket.aplicacion}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Reportado por</span>
                  <span style={styles.infoValor}>{ticket.creadoPor.nombre}</span>
                  <span style={styles.infoSub}>{ticket.creadoPor.correo}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Asignado a</span>
                  <span style={styles.infoValor}>
                    {ticket.asignadoA ? ticket.asignadoA.nombre : 'Sin asignar'}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Fecha de alta</span>
                  <span style={styles.infoValor}>{ticket.fechaCreacion}</span>
                </div>
                {ticket.fechaActualizacion && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Última actualización</span>
                    <span style={styles.infoValor}>{ticket.fechaActualizacion}</span>
                  </div>
                )}
                {ticket.fechaCierre && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Fecha de cierre</span>
                    <span style={styles.infoValor}>{ticket.fechaCierre}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción del problema */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🐛 Problema reportado</h3>
              <p style={styles.problemaTexto}>{ticket.problema}</p>

              {/* Imagen del problema */}
              {imagenProblema && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={styles.infoLabel}>Captura adjunta</p>
                  <img
                    src={imagenProblema}
                    alt="Captura del problema"
                    style={styles.imagen}
                    onClick={() => window.open(imagenProblema, '_blank')}
                  />
                  <p style={styles.imagenHint}>🔍 Clic para ampliar</p>
                </div>
              )}
            </div>

            {/* Imagen de solución si existe */}
            {imagenSolucion && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>✅ Evidencia de solución</h3>
                <img
                  src={imagenSolucion}
                  alt="Captura de solución"
                  style={styles.imagen}
                  onClick={() => window.open(imagenSolucion, '_blank')}
                />
                <p style={styles.imagenHint}>🔍 Clic para ampliar</p>
              </div>
            )}

            {/* Historial de comentarios */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💬 Historial</h3>
              {ticket.comentarios.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>Sin comentarios aún.</p>
              ) : (
                <div style={styles.timeline}>
                  {ticket.comentarios.map(com => (
                    <div key={com.id} style={{
                      ...styles.timelineItem,
                      borderLeft: `3px solid ${
                        com.tipo === 'SOLUCION' ? '#48bb78' :
                        com.tipo === 'RECHAZO'  ? '#e53e3e' : '#4299e1'
                      }`
                    }}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineAutor}>
                          {iconoTipo(com.tipo)} {com.autor}
                          <span style={styles.timelineRol}> · {com.rolAutor}</span>
                        </span>
                        <span style={styles.timelineFecha}>{com.fecha}</span>
                      </div>
                      <p style={styles.timelineTexto}>{com.texto}</p>
                      {/* Si el comentario tiene imagen, la cargamos */}
                      {com.tieneImagen && (
                        <ImagenComentario
                          comentarioId={com.id}
                          headers={headers}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: panel de acciones ── */}
          <div>

            {/* Panel soporte/admin */}
            {puedeGestionar && (
              <>
                {/* Cambiar estado */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🔄 Cambiar estado</h3>
                  <select
                    value={nuevoEstado}
                    onChange={e => setNuevoEstado(e.target.value)}
                    style={styles.select}
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <button
                    style={{ ...styles.btn, opacity: nuevoEstado === ticket.estado ? 0.5 : 1 }}
                    onClick={handleCambiarEstado}
                    disabled={guardando || nuevoEstado === ticket.estado}
                  >
                    {guardando ? 'Guardando...' : '💾 Guardar estado'}
                  </button>
                </div>

                {/* Cambiar prioridad */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>🎯 Cambiar prioridad</h3>
                  <select
                    value={nuevaPrioridad}
                    onChange={e => setNuevaPrioridad(e.target.value)}
                    style={styles.select}
                  >
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    style={{ ...styles.btn, backgroundColor: '#4299e1',
                      opacity: nuevaPrioridad === ticket.prioridad ? 0.5 : 1 }}
                    onClick={handleCambiarPrioridad}
                    disabled={guardando || nuevaPrioridad === ticket.prioridad}
                  >
                    {guardando ? 'Guardando...' : '💾 Guardar prioridad'}
                  </button>
                </div>

                {/* Asignar */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>👤 Asignar ticket</h3>
                  <select
                    value={asignadoId}
                    onChange={e => setAsignadoId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">— Sin asignar —</option>
                    {usuariosSoporte.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                    ))}
                  </select>
                  <button
                    style={{ ...styles.btn, backgroundColor: '#9b59b6' }}
                    onClick={handleAsignar}
                    disabled={guardando || !asignadoId}
                  >
                    {guardando ? 'Guardando...' : '👤 Asignar'}
                  </button>
                </div>
              </>
            )}

            {/* Agregar comentario — todos los roles */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>✏️ Agregar comentario</h3>

              {/* Tipo de comentario — solo soporte/admin ven más opciones */}
              {puedeGestionar && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={styles.infoLabel}>Tipo</label>
                  <select
                    value={tipoComentario}
                    onChange={e => setTipoComentario(e.target.value)}
                    style={styles.select}
                  >
                    <option value="SEGUIMIENTO">💬 Seguimiento</option>
                    <option value="SOLUCION">✅ Solución aplicada</option>
                    <option value="RECHAZO">❌ Rechazo</option>
                  </select>
                </div>
              )}

              <textarea
                value={textoComentario}
                onChange={e => setTextoComentario(e.target.value)}
                placeholder={
                  puedeGestionar
                    ? 'Describe la solución aplicada, avance o motivo de rechazo...'
                    : 'Agrega información adicional sobre el problema...'
                }
                style={styles.textarea}
                rows={4}
              />

              {/* Dropzone de imagen — solo soporte/admin */}
              {puedeGestionar && (
                <div>
                  <label style={styles.infoLabel}>Captura de evidencia (opcional)</label>
                  <label style={styles.dropzone}>
                    {imagenComentario
                      ? `📎 ${imagenComentario.name}`
                      : '📁 Clic o arrastra una imagen aquí'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={e => setImagenComentario(e.target.files[0] || null)}
                    />
                  </label>
                  {imagenComentario && (
                    <button
                      style={styles.btnQuitar}
                      onClick={() => setImagenComentario(null)}
                    >
                      ✕ Quitar imagen
                    </button>
                  )}
                </div>
              )}

              <button
                style={{ ...styles.btn, backgroundColor: '#48bb78',
                  opacity: !textoComentario.trim() ? 0.5 : 1 }}
                onClick={handleAgregarComentario}
                disabled={guardando || !textoComentario.trim()}
              >
                {guardando ? 'Enviando...' : '📨 Enviar comentario'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar que carga la imagen de cada comentario de forma independiente
// Así no bloqueamos la carga de toda la página por una sola imagen
function ImagenComentario({ comentarioId, headers }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    axios.get(`http://localhost:8080/api/tickets/comentario/${comentarioId}/imagen`,
      { headers, responseType: 'blob' })
      .then(res => setUrl(URL.createObjectURL(res.data)))
      .catch(() => {})
  }, [comentarioId])

  if (!url) return null

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <img
        src={url}
        alt="Evidencia"
        style={{ maxWidth: '100%', borderRadius: '6px',
          border: '1px solid #e2e8f0', cursor: 'pointer' }}
        onClick={() => window.open(url, '_blank')}
      />
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  content: { padding: '1.5rem 2rem' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'
  },
  btnVolver: {
    background: 'transparent', border: 'none', color: '#666',
    cursor: 'pointer', fontSize: '0.9rem', padding: 0,
    marginBottom: '0.5rem', display: 'block'
  },
  folio: { margin: '0 0 0.5rem', color: '#1a1a2e', fontSize: '1.5rem' },
  badgesRow: { display: 'flex', gap: '0.5rem' },
  badge: {
    color: 'white', padding: '0.25rem 0.75rem',
    borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600'
  },
  mensajeBox: {
    padding: '0.75rem 1rem', borderRadius: '6px',
    fontWeight: '500', fontSize: '0.9rem', alignSelf: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',  // columna principal + panel lateral
    gap: '1.5rem', alignItems: 'start'
  },
  card: {
    backgroundColor: 'white', borderRadius: '8px',
    padding: '1.5rem', marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  cardTitle: { margin: '0 0 1rem', color: '#1a1a2e', fontSize: '1rem' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  infoLabel: {
    fontSize: '0.72rem', color: '#999',
    textTransform: 'uppercase', letterSpacing: '0.06em'
  },
  infoValor: { fontSize: '0.95rem', color: '#222' },
  infoSub: { fontSize: '0.8rem', color: '#888' },
  problemaTexto: {
    backgroundColor: '#f8f9fa', padding: '0.75rem',
    borderRadius: '6px', color: '#333',
    lineHeight: 1.7, fontSize: '0.95rem', margin: 0
  },
  imagen: {
    maxWidth: '100%', maxHeight: '320px', borderRadius: '6px',
    border: '1px solid #e2e8f0', cursor: 'pointer', display: 'block'
  },
  imagenHint: { fontSize: '0.78rem', color: '#aaa', marginTop: '0.4rem' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  timelineItem: {
    paddingLeft: '1rem', paddingTop: '0.25rem', paddingBottom: '0.25rem'
  },
  timelineHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem'
  },
  timelineAutor: { fontSize: '0.88rem', fontWeight: '600', color: '#1a1a2e' },
  timelineRol: { fontWeight: '400', color: '#888', fontSize: '0.8rem' },
  timelineFecha: { fontSize: '0.78rem', color: '#aaa' },
  timelineTexto: { margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.6 },
  select: {
    width: '100%', padding: '0.6rem 0.8rem',
    borderRadius: '4px', border: '1px solid #ccc',
    fontSize: '0.9rem', marginBottom: '0.75rem',
    boxSizing: 'border-box'
  },
  btn: {
    width: '100%', padding: '0.7rem',
    backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '4px',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500'
  },
  textarea: {
    width: '100%', padding: '0.6rem 0.8rem',
    borderRadius: '4px', border: '1px solid #ccc',
    fontSize: '0.9rem', resize: 'vertical',
    boxSizing: 'border-box', marginBottom: '0.75rem',
    fontFamily: 'inherit'
  },
  dropzone: {
    display: 'block', border: '2px dashed #ccc',
    borderRadius: '6px', padding: '0.75rem',
    textAlign: 'center', cursor: 'pointer',
    color: '#888', fontSize: '0.85rem',
    marginTop: '0.4rem', marginBottom: '0.5rem'
  },
  btnQuitar: {
    background: 'transparent', border: 'none',
    color: '#e53e3e', cursor: 'pointer',
    fontSize: '0.8rem', marginBottom: '0.75rem'
  }
}

export default TicketDetalle