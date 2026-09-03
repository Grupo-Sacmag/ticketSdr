'use client'

import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'

const ROLES = ['EMPLEADO', 'SOPORTE', 'ADMIN']

const coloresRol: Record<string, string> = {
  EMPLEADO: '#4299e1',
  SOPORTE: '#ed8936',
  ADMIN: '#9b59b6',
}

type Usuario = {
  id: number
  nombre: string
  correo: string
  rol: string
  activo: boolean
  fechaCreacion?: string
}

type Departamento = {
  id: number
  nombre: string
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [departamentos, setDepartamentos] =
    useState<Departamento[]>([])

  const [correoActual, setCorreoActual] = useState('')
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null)

  const [nuevoRol, setNuevoRol] = useState('')
  const [actualizando, setActualizando] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'EMPLEADO',
    departamentoId: '',
  })

  const [erroresForm, setErroresForm] =
    useState<Record<string, string>>({})

  const [registrando, setRegistrando] = useState(false)

  const [usuarioReset, setUsuarioReset] =
    useState<Usuario | null>(null)

  const [passwordTemp, setPasswordTemp] = useState('')
  const [reseteando, setReseteando] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)

  const timeoutMensaje = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const mostrarMensaje = (
    tipo: 'exito' | 'error',
    texto: string
  ) => {
    if (timeoutMensaje.current) {
      clearTimeout(timeoutMensaje.current)
    }

    setMensaje({ tipo, texto })

    timeoutMensaje.current = setTimeout(() => {
      setMensaje(null)
    }, 3000)
  }

  const cargarUsuarios = async () => {
    try {
      const response = await fetch(
        '/api/backend/auth/usuarios',
        { cache: 'no-store' }
      )

      if (!response.ok) throw new Error()

      setUsuarios(await response.json())
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarUsuarios()

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

    fetch('/api/auth/session', {
      cache: 'no-store',
    })
      .then(response => response.json())
      .then(data =>
        setCorreoActual(data?.usuario?.correo || '')
      )

    return () => {
      if (timeoutMensaje.current) {
        clearTimeout(timeoutMensaje.current)
      }
    }
  }, [])

  const handleCambiarRol = async () => {
    if (!usuarioSeleccionado || !nuevoRol) return

    setActualizando(true)

    try {
      const response = await fetch(
        `/api/backend/auth/usuarios/${usuarioSeleccionado.id}/rol`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rol: nuevoRol,
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `Rol de "${usuarioSeleccionado.nombre}" actualizado a ${nuevoRol}`
      )

      setUsuarioSeleccionado(null)
      await cargarUsuarios()
    } catch {
      mostrarMensaje(
        'error',
        'Error al actualizar el rol'
      )
    } finally {
      setActualizando(false)
    }
  }

  const handleCambiarEstado = async (
    usuario: Usuario
  ) => {
    try {
      const response = await fetch(
        `/api/backend/auth/usuarios/${usuario.id}/estado`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activo: !usuario.activo,
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `Usuario "${usuario.nombre}" ${
          !usuario.activo ? 'activado' : 'desactivado'
        }`
      )

      await cargarUsuarios()
    } catch {
      mostrarMensaje(
        'error',
        'Error al cambiar estado del usuario'
      )
    }
  }

  const handleResetPassword = async () => {
    if (!usuarioReset) return

    if (!passwordTemp || passwordTemp.length < 6) {
      mostrarMensaje(
        'error',
        'La contraseña temporal debe tener mínimo 6 caracteres'
      )
      return
    }

    setReseteando(true)

    try {
      const response = await fetch(
        `/api/backend/auth/usuarios/${usuarioReset.id}/reset-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: passwordTemp,
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `Contraseña temporal asignada a "${usuarioReset.nombre}"`
      )

      setUsuarioReset(null)
      setPasswordTemp('')
    } catch {
      mostrarMensaje(
        'error',
        'Error al resetear la contraseña'
      )
    } finally {
      setReseteando(false)
    }
  }

  const validarFormulario = () => {
    const errores: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      errores.nombre = 'El nombre es obligatorio'
    }

    if (!formData.correo.trim()) {
      errores.correo = 'El correo es obligatorio'
    }

    if (
      !formData.correo.endsWith(
        '@grupo-sacmag.com.mx'
      )
    ) {
      errores.correo =
        'Debe ser un correo corporativo (@grupo-sacmag.com.mx)'
    }

    if (!formData.password.trim()) {
      errores.password =
        'La contraseña es obligatoria'
    }

    if (formData.password.length < 6) {
      errores.password = 'Mínimo 6 caracteres'
    }

    setErroresForm(errores)

    return Object.keys(errores).length === 0
  }

  const handleRegistrar = async () => {
    if (!validarFormulario()) return

    setRegistrando(true)

    try {
      const registerResponse = await fetch(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            correo: formData.correo,
            password: formData.password,
          }),
        }
      )

      if (registerResponse.status === 409) {
        mostrarMensaje(
          'error',
          'Este correo ya está registrado'
        )
        return
      }

      if (!registerResponse.ok) {
        throw new Error()
      }

      const usuariosResponse = await fetch(
        '/api/backend/auth/usuarios',
        { cache: 'no-store' }
      )

      if (!usuariosResponse.ok) {
        throw new Error()
      }

      const usuariosActualizados: Usuario[] =
        await usuariosResponse.json()

      const recienCreado =
        usuariosActualizados.find(
          usuario =>
            usuario.correo === formData.correo
        )

      if (
        recienCreado &&
        formData.rol !== 'EMPLEADO'
      ) {
        await fetch(
          `/api/backend/auth/usuarios/${recienCreado.id}/rol`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rol: formData.rol,
            }),
          }
        )
      }

      if (
        recienCreado &&
        formData.departamentoId
      ) {
        await fetch(
          `/api/backend/catalogos/usuarios/${recienCreado.id}/departamento`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              departamentoId: Number(
                formData.departamentoId
              ),
            }),
          }
        )
      }

      mostrarMensaje(
        'exito',
        `Usuario "${formData.nombre}" registrado correctamente`
      )

      setFormData({
        nombre: '',
        correo: '',
        password: '',
        rol: 'EMPLEADO',
        departamentoId: '',
      })

      setMostrarFormulario(false)

      await cargarUsuarios()
    } catch {
      mostrarMensaje(
        'error',
        'Error al registrar el usuario'
      )
    } finally {
      setRegistrando(false)
    }
  }

  const usuariosFiltrados = usuarios.filter(
    usuario =>
      usuario.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      usuario.correo
        .toLowerCase()
        .includes(busqueda.toLowerCase())
  )

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.statsRow}>
          {ROLES.map(rol => (
            <div
              key={rol}
              style={{
                ...styles.statCard,
                borderTop: `4px solid ${coloresRol[rol]}`,
              }}
            >
              <p style={styles.statNumero}>
                {
                  usuarios.filter(
                    usuario => usuario.rol === rol
                  ).length
                }
              </p>

              <p style={styles.statLabel}>
                {rol}
              </p>
            </div>
          ))}

          <div
            style={{
              ...styles.statCard,
              borderTop: '4px solid #e53e3e',
            }}
          >
            <p style={styles.statNumero}>
              {
                usuarios.filter(
                  usuario => !usuario.activo
                ).length
              }
            </p>

            <p style={styles.statLabel}>
              INACTIVOS
            </p>
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
            {mensaje.tipo === 'exito'
              ? '✅'
              : '❌'}{' '}
            {mensaje.texto}
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              👥 Gestión de usuarios
            </h3>

            <div style={styles.headerAcciones}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o correo..."
                value={busqueda}
                onChange={e =>
                  setBusqueda(e.target.value)
                }
                style={styles.buscador}
              />

              <button
                style={styles.btnNuevo}
                onClick={() => {
                  setMostrarFormulario(
                    !mostrarFormulario
                  )
                  setUsuarioSeleccionado(null)
                }}
              >
                {mostrarFormulario
                  ? '✕ Cancelar'
                  : '➕ Nuevo usuario'}
              </button>
            </div>
          </div>

          {mostrarFormulario && (
            <div style={styles.formularioBox}>
              <h4 style={styles.formularioTitulo}>
                Registrar nuevo usuario
              </h4>

              <div style={styles.formularioGrid}>
                <Campo
                  label="Nombre completo *"
                  value={formData.nombre}
                  onChange={value =>
                    setFormData({
                      ...formData,
                      nombre: value,
                    })
                  }
                  error={erroresForm.nombre}
                />

                <Campo
                  label="Correo corporativo *"
                  type="email"
                  value={formData.correo}
                  onChange={value =>
                    setFormData({
                      ...formData,
                      correo: value,
                    })
                  }
                  error={erroresForm.correo}
                />

                <Campo
                  label="Contraseña *"
                  type="password"
                  value={formData.password}
                  onChange={value =>
                    setFormData({
                      ...formData,
                      password: value,
                    })
                  }
                  error={erroresForm.password}
                />

                <div style={styles.field}>
                  <label style={styles.label}>
                    Rol *
                  </label>

                  <select
                    style={styles.input}
                    value={formData.rol}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rol: e.target.value,
                      })
                    }
                  >
                    {ROLES.map(rol => (
                      <option key={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Departamento
                  </label>

                  <select
                    style={styles.input}
                    value={formData.departamentoId}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        departamentoId:
                          e.target.value,
                      })
                    }
                  >
                    <option value="">
                      — Sin asignar —
                    </option>

                    {departamentos.map(
                      departamento => (
                        <option
                          key={departamento.id}
                          value={departamento.id}
                        >
                          {departamento.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <button
                style={styles.btnGuardar}
                disabled={registrando}
                onClick={handleRegistrar}
              >
                {registrando
                  ? 'Registrando...'
                  : '💾 Registrar usuario'}
              </button>
            </div>
          )}

          {cargando ? (
            <p style={styles.mensajeVacio}>
              Cargando usuarios...
            </p>
          ) : usuariosFiltrados.length === 0 ? (
            <p style={styles.mensajeVacio}>
              No se encontraron usuarios.
            </p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nombre</th>
                    <th style={styles.th}>Correo</th>
                    <th style={styles.th}>Rol</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Registro</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map(usuario => (
                    <tr
                      key={usuario.id}
                      style={{
                        opacity:
                          !usuario.activo
                            ? 0.6
                            : 1,
                        backgroundColor:
                          usuarioSeleccionado?.id ===
                          usuario.id
                            ? '#ebf8ff'
                            : 'white',
                      }}
                    >
                      <td style={styles.td}>
                        <strong>
                          {usuario.nombre}
                        </strong>

                        {usuario.correo ===
                          correoActual && (
                          <span
                            style={
                              styles.tuCuenta
                            }
                          >
                            {' '}
                            (tú)
                          </span>
                        )}
                      </td>

                      <td style={styles.td}>
                        {usuario.correo}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              coloresRol[
                                usuario.rol
                              ],
                          }}
                        >
                          {usuario.rol}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              usuario.activo
                                ? '#48bb78'
                                : '#e53e3e',
                          }}
                        >
                          {usuario.activo
                            ? 'ACTIVO'
                            : 'INACTIVO'}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {usuario.fechaCreacion
                          ? new Date(
                              usuario.fechaCreacion
                            ).toLocaleDateString(
                              'es-MX'
                            )
                          : '—'}
                      </td>

                      <td style={styles.td}>
                        {usuario.correo !==
                          correoActual && (
                          <div
                            style={
                              styles.botonesAccion
                            }
                          >
                            <button
                              style={
                                styles.accionBtn
                              }
                              onClick={() => {
                                setUsuarioSeleccionado(
                                  usuario
                                )
                                setNuevoRol(
                                  usuario.rol
                                )
                                setMostrarFormulario(
                                  false
                                )
                              }}
                            >
                              ✏️ Rol
                            </button>

                            <button
                              style={{
                                ...styles.accionBtn,
                                backgroundColor:
                                  usuario.activo
                                    ? '#e53e3e'
                                    : '#48bb78',
                              }}
                              onClick={() =>
                                void handleCambiarEstado(
                                  usuario
                                )
                              }
                            >
                              {usuario.activo
                                ? '🚫 Desactivar'
                                : '✅ Activar'}
                            </button>

                            <button
                              style={{
                                ...styles.accionBtn,
                                backgroundColor:
                                  '#d69e2e',
                              }}
                              onClick={() => {
                                setUsuarioReset(
                                  usuario
                                )
                                setPasswordTemp('')
                                setUsuarioSeleccionado(
                                  null
                                )
                              }}
                            >
                              🔑 Resetear
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {usuarioSeleccionado && (
          <div style={styles.card}>
            <div style={styles.panelHeader}>
              <h3 style={styles.cardTitle}>
                ✏️ Cambiar rol —{' '}
                {usuarioSeleccionado.nombre}
              </h3>

              <button
                style={styles.cerrarBtn}
                onClick={() =>
                  setUsuarioSeleccionado(null)
                }
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={styles.detalleGrid}>
              <Detalle
                label="Correo"
                value={
                  usuarioSeleccionado.correo
                }
              />

              <Detalle
                label="Rol actual"
                value={
                  usuarioSeleccionado.rol
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Nuevo rol
              </label>

              <select
                value={nuevoRol}
                onChange={e =>
                  setNuevoRol(e.target.value)
                }
                style={styles.input}
              >
                {ROLES.map(rol => (
                  <option key={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            <button
              style={styles.btnGuardar}
              disabled={
                actualizando ||
                nuevoRol ===
                  usuarioSeleccionado.rol
              }
              onClick={handleCambiarRol}
            >
              {actualizando
                ? 'Guardando...'
                : '💾 Guardar rol'}
            </button>
          </div>
        )}

        {usuarioReset && (
          <div style={styles.card}>
            <div style={styles.panelHeader}>
              <h3 style={styles.cardTitle}>
                🔑 Contraseña temporal —{' '}
                {usuarioReset.nombre}
              </h3>

              <button
                style={styles.cerrarBtn}
                onClick={() => {
                  setUsuarioReset(null)
                  setPasswordTemp('')
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={styles.avisoBox}>
              📋 Asigna una contraseña temporal.
              El usuario deberá cambiarla la próxima
              vez que inicie sesión.
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Contraseña temporal
              </label>

              <div style={styles.inputWrapper}>
                <input
                  type={
                    mostrarPassword
                      ? 'text'
                      : 'password'
                  }
                  value={passwordTemp}
                  onChange={e =>
                    setPasswordTemp(
                      e.target.value
                    )
                  }
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    ...styles.input,
                    paddingRight: '3rem',
                  }}
                />

                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() =>
                    setMostrarPassword(
                      prev => !prev
                    )
                  }
                >
                  {mostrarPassword
                    ? '🙈'
                    : '👁️'}
                </button>
              </div>

              <p style={styles.hint}>
                Comparte esta contraseña en persona
                o por teléfono, nunca por correo.
              </p>
            </div>

            <button
              style={{
                ...styles.btnGuardar,
                backgroundColor: '#d69e2e',
              }}
              disabled={
                reseteando ||
                passwordTemp.length < 6
              }
              onClick={handleResetPassword}
            >
              {reseteando
                ? 'Asignando...'
                : '🔑 Asignar contraseña temporal'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function Campo({
  label,
  type = 'text',
  value,
  onChange,
  error,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <input
        style={styles.input}
        type={type}
        value={value}
        onChange={e =>
          onChange(e.target.value)
        }
      />

      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}
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
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },

  cardTitle: {
    margin: 0,
    color: '#1a1a2e',
  },

  headerAcciones: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  buscador: {
    padding: '0.5rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '280px',
  },

  btnNuevo: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  formularioBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },

  formularioTitulo: {
    marginTop: 0,
  },

  formularioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1rem',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    marginBottom: '1rem',
  },

  label: {
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: '500',
  },

  input: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  },

  error: {
    color: '#e53e3e',
    fontSize: '0.8rem',
  },

  btnGuardar: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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

  tuCuenta: {
    fontSize: '0.78rem',
    color: '#999',
    fontStyle: 'italic',
  },

  badge: {
    color: 'white',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
  },

  botonesAccion: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },

  accionBtn: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '0.35rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
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
    marginBottom: '1.5rem',
  },

  detalleItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },

  detalleLabel: {
    fontSize: '0.75rem',
    color: '#999',
    textTransform: 'uppercase',
  },

  avisoBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #f6e05e',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
  },

  toggleBtn: {
    position: 'absolute',
    right: '0.6rem',
    top: '0.45rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },

  hint: {
    fontSize: '0.78rem',
    color: '#888',
  },
}