'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

type Usuario = {
  id: number
  nombre: string
  rol: string
  activo: boolean
}

type Aplicacion = {
  id: number
  nombre: string
}

type SessionResponse = {
  usuario: {
    nombre: string
    correo: string
    rol: string
    passwordTemporal: boolean
  }
}

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

export default function ReportarPage() {
  const router = useRouter()

  const [rol, setRol] = useState('')
  const [sesionCargada, setSesionCargada] = useState(false)

  const puedeGestionar =
    rol === 'ADMIN' || rol === 'SOPORTE'

  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([])
  const [empleados, setEmpleados] = useState<Usuario[]>([])

  const [formData, setFormData] = useState({
    aplicacion: '',
    problema: '',
    prioridad: 'Media',
  })

  const [empleadoId, setEmpleadoId] = useState('')
  const [fechaManual, setFechaManual] = useState('')

  const [imagen, setImagen] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const [errores, setErrores] =
    useState<Record<string, string>>({})

  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  useEffect(() => {
    const cargarSesion = async () => {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
      })

      if (!response.ok) {
        router.replace('/login')
        return
      }

      const data: SessionResponse = await response.json()
      const nuevoRol = data.usuario.rol

      setRol(nuevoRol)

      setFormData(prev => ({
        ...prev,
        prioridad:
          nuevoRol === 'ADMIN' || nuevoRol === 'SOPORTE'
            ? ''
            : 'Media',
      }))

      setSesionCargada(true)
    }

    void cargarSesion()
  }, [router])

  useEffect(() => {
    if (!sesionCargada) return

    fetch('/api/backend/catalogos/aplicaciones', {
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(setAplicaciones)
      .catch(err =>
        console.error('Error cargando aplicaciones:', err)
      )
  }, [sesionCargada])

  useEffect(() => {
    if (!sesionCargada || !puedeGestionar) return

    fetch('/api/backend/auth/usuarios', {
      cache: 'no-store',
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        return res.json()
      })
      .then((data: Usuario[]) =>
        setEmpleados(data.filter(u => u.activo))
      )
      .catch(err =>
        console.error('Error cargando empleados:', err)
      )
  }, [sesionCargada, puedeGestionar])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    setErrores({
      ...errores,
      [e.target.name]: '',
    })
  }

  const procesarImagen = (file?: File) => {
    if (!file) return

    if (
      ![
        'image/png',
        'image/jpeg',
        'image/jpg',
      ].includes(file.type)
    ) {
      setErrores(prev => ({
        ...prev,
        imagen: 'Solo se permiten imágenes PNG o JPG',
      }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrores(prev => ({
        ...prev,
        imagen: 'La imagen no debe superar 5MB',
      }))
      return
    }

    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setImagen(file)
    setPreview(URL.createObjectURL(file))

    setErrores(prev => ({
      ...prev,
      imagen: '',
    }))
  }

  const validar = () => {
    const err: Record<string, string> = {}

    if (!formData.aplicacion) {
      err.aplicacion = 'Selecciona una aplicación'
    }

    if (!formData.problema.trim()) {
      err.problema = 'Describe el problema'
    }

    if (puedeGestionar && !formData.prioridad) {
      err.prioridad = 'Selecciona la prioridad'
    }

    setErrores(err)

    return Object.keys(err).length === 0
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!validar()) return

    setEnviando(true)

    try {
      const data = new FormData()

      data.append('aplicacion', formData.aplicacion)
      data.append('problema', formData.problema)
      data.append(
        'prioridad',
        formData.prioridad || 'Media'
      )

      if (imagen) {
        data.append('imagen', imagen)
      }

      if (puedeGestionar) {
        if (empleadoId) {
          data.append('empleadoId', empleadoId)
        }

        if (fechaManual) {
          data.append('fechaCreacion', fechaManual)
        }
      }

      const endpoint = puedeGestionar
        ? '/api/backend/tickets/manual'
        : '/api/backend/tickets'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const responseData = await response.json()

      setExito(responseData.folio)
    } catch (err) {
      console.error('Error enviando ticket:', err)

      setErrores(prev => ({
        ...prev,
        general: 'Ocurrió un error, intenta de nuevo.',
      }))
    } finally {
      setEnviando(false)
    }
  }

  const resetFormulario = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setExito(null)

    setFormData({
      aplicacion: '',
      problema: '',
      prioridad: puedeGestionar ? '' : 'Media',
    })

    setImagen(null)
    setPreview(null)
    setEmpleadoId('')
    setFechaManual('')
    setErrores({})
  }

  if (!sesionCargada) {
    return null
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            {puedeGestionar
              ? '📋 Crear ticket'
              : '📋 Reportar un problema'}
          </h3>

          {!puedeGestionar && (
            <div style={styles.infoBox}>
              💡 La prioridad será evaluada y ajustada por
              el equipo de soporte.
            </div>
          )}

          {exito ? (
            <div style={styles.exitoBox}>
              <p style={styles.exitoIcon}>✅</p>
              <h4>¡Ticket creado correctamente!</h4>
              <p>Folio de seguimiento:</p>

              <p style={styles.folioText}>
                {exito}
              </p>

              <p style={styles.exitoSub}>
                Se ha enviado notificación por correo.
              </p>

              <div style={styles.botonesExito}>
                <button
                  style={styles.button}
                  onClick={resetFormulario}
                >
                  Crear otro ticket
                </button>

                <button
                  style={{
                    ...styles.button,
                    backgroundColor: '#4299e1',
                  }}
                  onClick={() =>
                    router.push(
                      puedeGestionar
                        ? '/admin/tickets'
                        : '/mis-tickets'
                    )
                  }
                >
                  {puedeGestionar
                    ? 'Ver todos los tickets'
                    : 'Ver mis tickets'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {puedeGestionar && (
                <div style={styles.seccionAdmin}>
                  <p style={styles.seccionTitulo}>
                    ⚙️ Opciones de gestión
                  </p>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Asignar ticket a (opcional)
                    </label>

                    <select
                      value={empleadoId}
                      onChange={e =>
                        setEmpleadoId(e.target.value)
                      }
                      style={styles.input}
                    >
                      <option value="">
                        — Asignar a mí mismo / sin asignar —
                      </option>

                      {empleados.map(usuario => (
                        <option
                          key={usuario.id}
                          value={usuario.id}
                        >
                          {usuario.nombre} · {usuario.rol}
                        </option>
                      ))}
                    </select>

                    <p style={styles.hint}>
                      Si no seleccionas, el ticket queda a
                      tu nombre como creador.
                    </p>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Fecha y hora de creación (opcional)
                    </label>

                    <input
                      type="datetime-local"
                      value={fechaManual}
                      onChange={e =>
                        setFechaManual(e.target.value)
                      }
                      style={styles.input}
                    />

                    <p style={styles.hint}>
                      Úsalo para tickets presenciales ya
                      resueltos. Si lo dejas vacío se usa
                      la fecha y hora actuales.
                    </p>
                  </div>
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>
                  Aplicación *
                </label>

                <select
                  name="aplicacion"
                  value={formData.aplicacion}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">
                    Selecciona una aplicación...
                  </option>

                  {aplicaciones.map(app => (
                    <option
                      key={app.id}
                      value={app.nombre}
                    >
                      {app.nombre}
                    </option>
                  ))}
                </select>

                {errores.aplicacion && (
                  <p style={styles.error}>
                    {errores.aplicacion}
                  </p>
                )}
              </div>

              {puedeGestionar ? (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Prioridad *
                  </label>

                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">
                      Selecciona la prioridad...
                    </option>

                    {PRIORIDADES.map(prioridad => (
                      <option
                        key={prioridad}
                        value={prioridad}
                      >
                        {prioridad}
                      </option>
                    ))}
                  </select>

                  {errores.prioridad && (
                    <p style={styles.error}>
                      {errores.prioridad}
                    </p>
                  )}
                </div>
              ) : (
                <div style={styles.infoBox}>
                  🎯 Prioridad inicial:{' '}
                  <strong>Media</strong> — el equipo de
                  soporte la ajustará según el impacto real.
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>
                  Problema a tratar *
                </label>

                <textarea
                  name="problema"
                  value={formData.problema}
                  onChange={handleChange}
                  rows={4}
                  style={styles.textarea}
                  placeholder="Describe detalladamente el problema..."
                />

                {errores.problema && (
                  <p style={styles.error}>
                    {errores.problema}
                  </p>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Captura de pantalla (opcional)
                </label>

                <div
                  style={{
                    ...styles.dropzone,
                    borderColor: dragging
                      ? '#1a1a2e'
                      : '#ccc',
                    backgroundColor: dragging
                      ? '#f0f2f5'
                      : 'white',
                  }}
                  onDragOver={e => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() =>
                    setDragging(false)
                  }
                  onDrop={e => {
                    e.preventDefault()
                    setDragging(false)
                    procesarImagen(
                      e.dataTransfer.files[0]
                    )
                  }}
                >
                  {preview ? (
                    <div>
                      <img
                        src={preview}
                        alt="preview"
                        style={styles.preview}
                      />

                      <p style={styles.fileName}>
                        {imagen?.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          if (preview) {
                            URL.revokeObjectURL(preview)
                          }

                          setImagen(null)
                          setPreview(null)
                        }}
                        style={styles.removeBtn}
                      >
                        Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={styles.dropText}>
                        📁 Arrastra tu imagen aquí
                      </p>

                      <p style={styles.dropSub}>o</p>

                      <label style={styles.fileLabel}>
                        Seleccionar archivo

                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={e =>
                            procesarImagen(
                              e.target.files?.[0]
                            )
                          }
                          style={{ display: 'none' }}
                        />
                      </label>

                      <p style={styles.dropSub}>
                        PNG o JPG, máximo 5MB
                      </p>
                    </div>
                  )}
                </div>

                {errores.imagen && (
                  <p style={styles.error}>
                    {errores.imagen}
                  </p>
                )}
              </div>

              {errores.general && (
                <div style={styles.errorBox}>
                  {errores.general}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                style={{
                  ...styles.button,
                  opacity: enviando ? 0.7 : 1,
                  cursor: enviando
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {enviando
                  ? 'Enviando ticket...'
                  : 'Enviar reporte'}
              </button>
            </form>
          )}
        </div>
      </div>
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

  card: {
    maxWidth: '620px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '2rem',
  },

  cardTitle: {
    marginTop: 0,
    color: '#1a1a2e',
    marginBottom: '1.5rem',
  },

  seccionAdmin: {
    backgroundColor: '#f0f4ff',
    border: '1px solid #c3d0f5',
    borderRadius: '8px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },

  seccionTitulo: {
    margin: '0 0 1rem',
    color: '#1a1a2e',
    fontWeight: '600',
    fontSize: '0.95rem',
  },

  infoBox: {
    backgroundColor: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    fontSize: '0.88rem',
    color: '#2b6cb0',
    marginBottom: '1.2rem',
  },

  field: {
    marginBottom: '1.2rem',
  },

  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: '500',
  },

  hint: {
    margin: '0.3rem 0 0',
    fontSize: '0.78rem',
    color: '#888',
  },

  input: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },

  textarea: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
  },

  dropText: {
    fontSize: '1.1rem',
    color: '#555',
    margin: '0 0 0.5rem',
  },

  dropSub: {
    color: '#999',
    fontSize: '0.85rem',
    margin: '0.25rem 0',
  },

  fileLabel: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    margin: '0.5rem 0',
  },

  preview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px',
    marginBottom: '0.5rem',
  },

  fileName: {
    color: '#555',
    fontSize: '0.85rem',
  },

  removeBtn: {
    background: 'none',
    border: '1px solid #e53e3e',
    color: '#e53e3e',
    padding: '0.3rem 0.8rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },

  error: {
    color: '#e53e3e',
    fontSize: '0.8rem',
  },

  errorBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    color: '#c53030',
    marginBottom: '1rem',
  },

  exitoBox: {
    textAlign: 'center',
    padding: '1rem',
  },

  exitoIcon: {
    fontSize: '3rem',
  },

  folioText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1a1a2e',
    backgroundColor: '#f0f2f5',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    display: 'inline-block',
  },

  exitoSub: {
    color: '#666',
  },

  botonesExito: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
}