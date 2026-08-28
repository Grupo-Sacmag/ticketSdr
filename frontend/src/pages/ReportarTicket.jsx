import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const BASE = 'http://localhost:8080/api'

// Los empleados NO pueden asignar prioridad — la pone soporte/admin.
// Para el formulario del empleado usamos "Media" como default silencioso.
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

function ReportarTicket() {
  const navigate  = useNavigate()
  const usuario   = JSON.parse(localStorage.getItem('usuario') || '{}')
  const token     = localStorage.getItem('token')
  const headers   = { Authorization: `Bearer ${token}` }
  const [aplicaciones, setAplicaciones] = useState([])

  // true si quien llena el formulario puede crear tickets con más control
  const puedeGestionar = usuario.rol === 'ADMIN' || usuario.rol === 'SOPORTE'

  // ── Estado del formulario ─────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    aplicacion: '',
    problema:   '',
    prioridad:  puedeGestionar ? '' : 'Media', // empleado no elige prioridad
  })

  // Campos exclusivos de Admin/Soporte
  const [empleadoId,    setEmpleadoId]    = useState('')  // a quién se le asigna
  const [fechaManual,   setFechaManual]   = useState('')  // formato datetime-local

  // Lista de empleados para el selector
  const [empleados, setEmpleados] = useState([])

  // Imagen
  const [imagen,   setImagen]   = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [dragging, setDragging] = useState(false)

  // UX
  const [errores,  setErrores]  = useState({})
  const [enviando, setEnviando] = useState(false)
  const [exito,    setExito]    = useState(null)

  // ── Cargar empleados (solo si es Admin/Soporte) ───────────────────────────
  useEffect(() => {
    if (!puedeGestionar) return
    axios.get(`${BASE}/auth/usuarios`, { headers })
      .then(res => {
        // Mostramos todos los usuarios activos para poder asignar el ticket
        setEmpleados(res.data.filter(u => u.activo))
      })
      .catch(err => console.error('Error cargando empleados:', err))
  }, [])

  // ── Handlers generales ────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const procesarImagen = (file) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setErrores(p => ({ ...p, imagen: 'Solo se permiten imágenes PNG o JPG' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrores(p => ({ ...p, imagen: 'La imagen no debe superar 5MB' }))
      return
    }
    setImagen(file)
    setPreview(URL.createObjectURL(file))
    setErrores(p => ({ ...p, imagen: '' }))
  }

  const handleFileInput = (e) => procesarImagen(e.target.files[0])
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    procesarImagen(e.dataTransfer.files[0])
  }

  // ── Validación ────────────────────────────────────────────────────────────
  const validar = () => {
    const err = {}
    if (!formData.aplicacion)      err.aplicacion = 'Selecciona una aplicación'
    if (!formData.problema.trim()) err.problema   = 'Describe el problema'
    if (puedeGestionar && !formData.prioridad)
                                   err.prioridad  = 'Selecciona la prioridad'
    setErrores(err)
    return Object.keys(err).length === 0
  }

  // ── Envío ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)

    try {
      const data = new FormData()
      data.append('aplicacion', formData.aplicacion)
      data.append('problema',   formData.problema)
      data.append('prioridad',  formData.prioridad || 'Media')
      if (imagen) data.append('imagen', imagen)

      let response

      if (puedeGestionar) {
        // ── Endpoint manual: soporta fecha y empleado opcionales ──────────
        // Si eligió un empleado, lo mandamos; si no, el backend usa el creador
        if (empleadoId)  data.append('empleadoId',    empleadoId)
        // datetime-local devuelve "2026-06-25T14:30" → el backend lo parsea con LocalDateTime.parse()
        if (fechaManual) data.append('fechaCreacion', fechaManual)

        response = await axios.post(`${BASE}/tickets/manual`, data, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        })
      } else {
        // ── Endpoint estándar para empleados ──────────────────────────────
        response = await axios.post(`${BASE}/tickets`, data, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        })
      }

      setExito(response.data.folio)

    } catch (err) {
      console.error('Error enviando ticket:', err)
      setErrores(p => ({ ...p, general: 'Ocurrió un error, intenta de nuevo.' }))
    } finally {
      setEnviando(false)
    }
  }

  const resetFormulario = () => {
    setExito(null)
    setFormData({ aplicacion: '', problema: '', prioridad: puedeGestionar ? '' : 'Media' })
    setImagen(null)
    setPreview(null)
    setEmpleadoId('')
    setFechaManual('')
    setErrores({})
  }

  useEffect(() => {
      const token = localStorage.getItem('token')
      axios.get('http://localhost:8080/api/catalogos/aplicaciones', {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setAplicaciones(res.data))
      .catch(err => console.error('Error cargando aplicaciones:', err))
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.card}>

          <h3 style={styles.cardTitle}>
            {puedeGestionar ? '📋 Crear ticket' : '📋 Reportar un problema'}
          </h3>

          {/* Aviso informativo para empleados */}
          {!puedeGestionar && (
            <div style={styles.infoBox}>
              💡 La prioridad será evaluada y ajustada por el equipo de soporte.
            </div>
          )}

          {exito ? (
            // ── Pantalla de éxito ──────────────────────────────────────────
            <div style={styles.exitoBox}>
              <p style={styles.exitoIcon}>✅</p>
              <h4>¡Ticket creado correctamente!</h4>
              <p>Folio de seguimiento:</p>
              <p style={styles.folioText}>{exito}</p>
              <p style={styles.exitoSub}>Se ha enviado notificación por correo.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button style={styles.button} onClick={resetFormulario}>
                  Crear otro ticket
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: '#4299e1' }}
                  onClick={() => navigate(puedeGestionar ? '/admin/tickets' : '/mis-tickets')}
                >
                  {puedeGestionar ? 'Ver todos los tickets' : 'Ver mis tickets'}
                </button>
              </div>
            </div>

          ) : (
            // ── Formulario ────────────────────────────────────────────────
            <form onSubmit={handleSubmit}>

              {/* ── Campos exclusivos Admin/Soporte ── */}
              {puedeGestionar && (
                <div style={styles.seccionAdmin}>
                  <p style={styles.seccionTitulo}>⚙️ Opciones de gestión</p>

                  {/* Asignar a un empleado */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Asignar ticket a (opcional)
                    </label>
                    <select
                      value={empleadoId}
                      onChange={e => setEmpleadoId(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">— Asignar a mí mismo / sin asignar —</option>
                      {empleados.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} · {u.rol}
                        </option>
                      ))}
                    </select>
                    <p style={styles.hint}>
                      Si no seleccionas, el ticket queda a tu nombre como creador.
                    </p>
                  </div>

                  {/* Fecha y hora manual */}
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Fecha y hora de creación (opcional)
                    </label>
                    {/* datetime-local muestra un picker nativo de fecha+hora */}
                    <input
                      type="datetime-local"
                      value={fechaManual}
                      onChange={e => setFechaManual(e.target.value)}
                      style={styles.input}
                    />
                    <p style={styles.hint}>
                      Úsalo para tickets presenciales ya resueltos. Si lo dejas vacío
                      se usa la fecha y hora actuales.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Aplicación ── */}
              <div style={styles.field}>
                <label style={styles.label}>Aplicación *</label>
                <select
                  name="aplicacion"
                  value={formData.aplicacion}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Selecciona una aplicación...</option>
                  {aplicaciones.map(app => (
                      <option key={app.id} value={app.nombre}>{app.nombre}</option>
                  ))}
                </select>
                {errores.aplicacion && <p style={styles.error}>{errores.aplicacion}</p>}
              </div>

              {/* ── Prioridad — solo Admin/Soporte la eligen ── */}
              {puedeGestionar ? (
                <div style={styles.field}>
                  <label style={styles.label}>Prioridad *</label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Selecciona la prioridad...</option>
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errores.prioridad && <p style={styles.error}>{errores.prioridad}</p>}
                </div>
              ) : (
                // El empleado no ve el selector — la prioridad va como "Media" oculta
                // y soporte/admin la ajustan después en el detalle del ticket
                <div style={styles.infoBox}>
                  🎯 Prioridad inicial: <strong>Media</strong> — el equipo de soporte
                  la ajustará según el impacto real.
                </div>
              )}

              {/* ── Descripción del problema ── */}
              <div style={styles.field}>
                <label style={styles.label}>Problema a tratar *</label>
                <textarea
                  name="problema"
                  value={formData.problema}
                  onChange={handleChange}
                  rows={4}
                  style={styles.textarea}
                  placeholder="Describe detalladamente el problema..."
                />
                {errores.problema && <p style={styles.error}>{errores.problema}</p>}
              </div>

              {/* ── Dropzone de imagen ── */}
              <div style={styles.field}>
                <label style={styles.label}>Captura de pantalla (opcional)</label>
                <div
                  style={{
                    ...styles.dropzone,
                    borderColor: dragging ? '#1a1a2e' : '#ccc',
                    backgroundColor: dragging ? '#f0f2f5' : 'white'
                  }}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <div>
                      <img src={preview} alt="preview" style={styles.preview} />
                      <p style={styles.fileName}>{imagen.name}</p>
                      <button
                        type="button"
                        onClick={() => { setImagen(null); setPreview(null) }}
                        style={styles.removeBtn}
                      >
                        Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.dropText}>📁 Arrastra tu imagen aquí</p>
                      <p style={styles.dropSub}>o</p>
                      <label style={styles.fileLabel}>
                        Seleccionar archivo
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={handleFileInput}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <p style={styles.dropSub}>PNG o JPG, máximo 5MB</p>
                    </div>
                  )}
                </div>
                {errores.imagen && <p style={styles.error}>{errores.imagen}</p>}
              </div>

              {/* Error general */}
              {errores.general && (
                <div style={styles.errorBox}>{errores.general}</div>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{
                  ...styles.button,
                  opacity: enviando ? 0.7 : 1,
                  cursor: enviando ? 'not-allowed' : 'pointer'
                }}
              >
                {enviando ? 'Enviando ticket...' : 'Enviar reporte'}
              </button>
            </form>
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
    maxWidth: '620px', margin: '0 auto',
    backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem'
  },
  cardTitle: { marginTop: 0, color: '#1a1a2e', marginBottom: '1.5rem' },

  // Sección exclusiva Admin/Soporte
  seccionAdmin: {
    backgroundColor: '#f0f4ff',
    border: '1px solid #c3d0f5',
    borderRadius: '8px',
    padding: '1.25rem',
    marginBottom: '1.5rem'
  },
  seccionTitulo: {
    margin: '0 0 1rem',
    color: '#1a1a2e',
    fontWeight: '600',
    fontSize: '0.95rem'
  },

  // Aviso informativo
  infoBox: {
    backgroundColor: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    fontSize: '0.88rem',
    color: '#2b6cb0',
    marginBottom: '1.2rem'
  },

  field: { marginBottom: '1.2rem' },
  label: {
    display: 'block', marginBottom: '0.4rem',
    color: '#333', fontSize: '0.9rem', fontWeight: '500'
  },
  hint: {
    margin: '0.3rem 0 0',
    fontSize: '0.78rem', color: '#888'
  },
  input: {
    width: '100%', padding: '0.6rem 0.8rem',
    borderRadius: '4px', border: '1px solid #ccc',
    fontSize: '1rem', boxSizing: 'border-box'
  },
  textarea: {
    width: '100%', padding: '0.6rem 0.8rem',
    borderRadius: '4px', border: '1px solid #ccc',
    fontSize: '1rem', boxSizing: 'border-box',
    resize: 'vertical', fontFamily: 'inherit'
  },
  dropzone: {
    border: '2px dashed #ccc', borderRadius: '8px',
    padding: '2rem', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer'
  },
  dropText: { fontSize: '1.1rem', color: '#555', margin: '0 0 0.5rem' },
  dropSub:  { color: '#999', fontSize: '0.85rem', margin: '0.25rem 0' },
  fileLabel: {
    display: 'inline-block', padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e', color: 'white',
    borderRadius: '4px', cursor: 'pointer',
    fontSize: '0.9rem', margin: '0.5rem 0'
  },
  preview:   { maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginBottom: '0.5rem' },
  fileName:  { color: '#555', fontSize: '0.85rem', margin: '0.25rem 0' },
  removeBtn: {
    background: 'none', border: '1px solid #e53e3e',
    color: '#e53e3e', padding: '0.3rem 0.8rem',
    borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
  },
  button: {
    width: '100%', padding: '0.75rem',
    backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '4px',
    fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem'
  },
  error:    { color: '#e53e3e', fontSize: '0.8rem', margin: '0.3rem 0 0' },
  errorBox: {
    backgroundColor: '#fff5f5', border: '1px solid #feb2b2',
    borderRadius: '6px', padding: '0.75rem 1rem',
    color: '#c53030', fontSize: '0.9rem', marginBottom: '1rem'
  },
  exitoBox:   { textAlign: 'center', padding: '1rem' },
  exitoIcon:  { fontSize: '3rem', margin: '0 0 1rem' },
  folioText: {
    fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e',
    backgroundColor: '#f0f2f5', padding: '0.5rem 1rem',
    borderRadius: '4px', display: 'inline-block', margin: '0.5rem 0'
  },
  exitoSub: { color: '#666', fontSize: '0.9rem' }
}

export default ReportarTicket