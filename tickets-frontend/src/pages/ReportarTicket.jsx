import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const APLICACIONES = [
  'Proveedores', 'Nómina', 'Auxiliares', 'Captura',
  'Acumulados', 'Costos', 'Libro V', 'Clientes Avances'
]
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

function ReportarTicket() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ aplicacion: '', problema: '', prioridad: '' })
  const [imagen, setImagen] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errores, setErrores] = useState({})
  const [dragging, setDragging] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrores({ ...errores, [e.target.name]: '' })
  }

  const procesarImagen = (file) => {
    if (!file) return
    const extensionesValidas = ['image/png', 'image/jpeg', 'image/jpg']
    if (!extensionesValidas.includes(file.type)) {
      setErrores(prev => ({ ...prev, imagen: 'Solo se permiten imágenes PNG o JPG' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrores(prev => ({ ...prev, imagen: 'La imagen no debe superar 5MB' }))
      return
    }
    setImagen(file)
    setPreview(URL.createObjectURL(file))
    setErrores(prev => ({ ...prev, imagen: '' }))
  }

  const handleFileInput = (e) => procesarImagen(e.target.files[0])
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    procesarImagen(e.dataTransfer.files[0])
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!formData.aplicacion) nuevosErrores.aplicacion = 'Selecciona una aplicación'
    if (!formData.problema.trim()) nuevosErrores.problema = 'Describe el problema'
    if (!formData.prioridad) nuevosErrores.prioridad = 'Selecciona la prioridad'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)
    try {
      const token = localStorage.getItem('token')
      const data = new FormData()
      data.append('aplicacion', formData.aplicacion)
      data.append('problema', formData.problema)
      data.append('prioridad', formData.prioridad)
      if (imagen) data.append('imagen', imagen)

      const response = await axios.post('http://localhost:8080/api/tickets', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setExito(response.data.folio)
    } catch (err) {
      console.error('Error enviando ticket:', err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Reportar un problema</h3>

          {exito ? (
            <div style={styles.exitoBox}>
              <p style={styles.exitoIcon}>✅</p>
              <h4>¡Ticket enviado correctamente!</h4>
              <p>Tu folio de seguimiento es:</p>
              <p style={styles.folio}>{exito}</p>
              <p style={styles.exitoSub}>Se ha enviado un correo con tu folio.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button style={styles.button} onClick={() => {
                  setExito(null)
                  setFormData({ aplicacion: '', problema: '', prioridad: '' })
                  setImagen(null)
                  setPreview(null)
                }}>
                  Reportar otro problema
                </button>
                <button style={{ ...styles.button, backgroundColor: '#4299e1' }}
                  onClick={() => navigate('/mis-tickets')}>
                  Ver mis tickets
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label style={styles.label}>Aplicación *</label>
                <select name="aplicacion" value={formData.aplicacion}
                  onChange={handleChange} style={styles.input}>
                  <option value="">Selecciona una aplicación...</option>
                  {APLICACIONES.map(app => (
                    <option key={app} value={app}>{app}</option>
                  ))}
                </select>
                {errores.aplicacion && <p style={styles.error}>{errores.aplicacion}</p>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Prioridad *</label>
                <select name="prioridad" value={formData.prioridad}
                  onChange={handleChange} style={styles.input}>
                  <option value="">Selecciona la prioridad...</option>
                  {PRIORIDADES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errores.prioridad && <p style={styles.error}>{errores.prioridad}</p>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Problema a tratar *</label>
                <textarea name="problema" value={formData.problema}
                  onChange={handleChange} rows={4} style={styles.textarea}
                  placeholder="Describe detalladamente el problema..." />
                {errores.problema && <p style={styles.error}>{errores.problema}</p>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Captura de pantalla (opcional)</label>
                <div
                  style={{
                    ...styles.dropzone,
                    borderColor: dragging ? '#1a1a2e' : '#ccc',
                    backgroundColor: dragging ? '#f0f2f5' : 'white'
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <div>
                      <img src={preview} alt="preview" style={styles.preview} />
                      <p style={styles.fileName}>{imagen.name}</p>
                      <button type="button"
                        onClick={() => { setImagen(null); setPreview(null) }}
                        style={styles.removeBtn}>
                        Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.dropText}>📁 Arrastra tu imagen aquí</p>
                      <p style={styles.dropSub}>o</p>
                      <label style={styles.fileLabel}>
                        Seleccionar archivo
                        <input type="file" accept=".png,.jpg,.jpeg"
                          onChange={handleFileInput} style={{ display: 'none' }} />
                      </label>
                      <p style={styles.dropSub}>PNG o JPG, máximo 5MB</p>
                    </div>
                  )}
                </div>
                {errores.imagen && <p style={styles.error}>{errores.imagen}</p>}
              </div>

              <button type="submit" disabled={enviando}
                style={{ ...styles.button, opacity: enviando ? 0.7 : 1,
                  cursor: enviando ? 'not-allowed' : 'pointer' }}>
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
    maxWidth: '600px', margin: '0 auto',
    backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem'
  },
  cardTitle: { marginTop: 0, color: '#1a1a2e', marginBottom: '1.5rem' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem', fontWeight: '500' },
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
    padding: '2rem', textAlign: 'center',
    transition: 'all 0.2s', cursor: 'pointer'
  },
  dropText: { fontSize: '1.1rem', color: '#555', margin: '0 0 0.5rem' },
  dropSub: { color: '#999', fontSize: '0.85rem', margin: '0.25rem 0' },
  fileLabel: {
    display: 'inline-block', padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e', color: 'white',
    borderRadius: '4px', cursor: 'pointer',
    fontSize: '0.9rem', margin: '0.5rem 0'
  },
  preview: { maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', marginBottom: '0.5rem' },
  fileName: { color: '#555', fontSize: '0.85rem', margin: '0.25rem 0' },
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
  error: { color: '#e53e3e', fontSize: '0.8rem', margin: '0.3rem 0 0' },
  exitoBox: { textAlign: 'center', padding: '1rem' },
  exitoIcon: { fontSize: '3rem', margin: '0 0 1rem' },
  folio: {
    fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e',
    backgroundColor: '#f0f2f5', padding: '0.5rem 1rem',
    borderRadius: '4px', display: 'inline-block', margin: '0.5rem 0'
  },
  exitoSub: { color: '#666', fontSize: '0.9rem' }
}

export default ReportarTicket