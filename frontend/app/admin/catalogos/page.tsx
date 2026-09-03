'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

type Departamento = {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
}

type Aplicacion = {
  id: number
  nombre: string
  descripcion?: string
  activa: boolean
  departamentoId?: number | null
  departamentoNombre?: string
}

export default function AdminCatalogosPage() {
  const [mensaje, setMensaje] = useState<{
    tipo: 'exito' | 'error'
    texto: string
  } | null>(null)

  const [guardando, setGuardando] = useState(false)

  const [deptos, setDeptos] = useState<Departamento[]>([])
  const [cargandoDeptos, setCargandoDeptos] = useState(true)

  const [nuevoDept, setNuevoDept] = useState({
    nombre: '',
    descripcion: '',
  })

  const [mostrarFormDept, setMostrarFormDept] = useState(false)
  const [editandoDept, setEditandoDept] =
    useState<Departamento | null>(null)

  const [aplicaciones, setAplicaciones] =
    useState<Aplicacion[]>([])

  const [cargandoApps, setCargandoApps] = useState(true)

  const [nuevaApp, setNuevaApp] = useState({
    nombre: '',
    descripcion: '',
  })

  const [mostrarFormApp, setMostrarFormApp] = useState(false)
  const [editandoApp, setEditandoApp] =
    useState<Aplicacion | null>(null)

  const [asignando, setAsignando] = useState<number | null>(null)
  const [deptSeleccionado, setDeptSeleccionado] = useState('')
  const [deptosActivos, setDeptosActivos] =
    useState<Departamento[]>([])

  const mostrarMensaje = (
    tipo: 'exito' | 'error',
    texto: string
  ) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3500)
  }

  const cargarDeptos = async () => {
    setCargandoDeptos(true)

    try {
      const response = await fetch(
        '/api/backend/catalogos/departamentos/todos',
        { cache: 'no-store' }
      )

      if (!response.ok) throw new Error()

      const data: Departamento[] = await response.json()

      setDeptos(data)
      setDeptosActivos(data.filter(d => d.activo))
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoDeptos(false)
    }
  }

  const cargarApps = async () => {
    setCargandoApps(true)

    try {
      const response = await fetch(
        '/api/backend/catalogos/aplicaciones/todas',
        { cache: 'no-store' }
      )

      if (!response.ok) throw new Error()

      setAplicaciones(await response.json())
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoApps(false)
    }
  }

  useEffect(() => {
    void cargarDeptos()
    void cargarApps()
  }, [])

  const handleCrearDept = async () => {
    if (!nuevoDept.nombre.trim()) return

    setGuardando(true)

    try {
      const response = await fetch(
        '/api/backend/catalogos/departamentos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nuevoDept),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `Departamento "${nuevoDept.nombre}" creado`
      )

      setNuevoDept({
        nombre: '',
        descripcion: '',
      })

      setMostrarFormDept(false)

      await cargarDeptos()
    } catch {
      mostrarMensaje(
        'error',
        'Error al crear el departamento'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarEdicionDept = async () => {
    if (!editandoDept?.nombre.trim()) return

    setGuardando(true)

    try {
      const response = await fetch(
        `/api/backend/catalogos/departamentos/${editandoDept.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: editandoDept.nombre,
            descripcion: editandoDept.descripcion || '',
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        'Departamento actualizado'
      )

      setEditandoDept(null)

      await cargarDeptos()
    } catch {
      mostrarMensaje(
        'error',
        'Error al actualizar el departamento'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarDept = async (
    dept: Departamento
  ) => {
    const confirmar = window.confirm(
      `¿Eliminar el departamento "${dept.nombre}"?\nEsta acción no se puede deshacer.`
    )

    if (!confirmar) return

    try {
      const response = await fetch(
        `/api/backend/catalogos/departamentos/${dept.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const texto = await response.text()

        throw new Error(
          texto || 'Error al eliminar el departamento'
        )
      }

      mostrarMensaje(
        'exito',
        `Departamento "${dept.nombre}" eliminado`
      )

      await cargarDeptos()
    } catch (error) {
      mostrarMensaje(
        'error',
        error instanceof Error
          ? error.message
          : 'Error al eliminar'
      )
    }
  }

  const handleCrearApp = async () => {
    if (!nuevaApp.nombre.trim()) return

    setGuardando(true)

    try {
      const response = await fetch(
        '/api/backend/catalogos/aplicaciones',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nuevaApp),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `Aplicación "${nuevaApp.nombre}" creada`
      )

      setNuevaApp({
        nombre: '',
        descripcion: '',
      })

      setMostrarFormApp(false)

      await cargarApps()
    } catch {
      mostrarMensaje(
        'error',
        'Error al crear la aplicación'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarEdicionApp = async () => {
    if (!editandoApp?.nombre.trim()) return

    setGuardando(true)

    try {
      const response = await fetch(
        `/api/backend/catalogos/aplicaciones/${editandoApp.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: editandoApp.nombre,
            descripcion: editandoApp.descripcion || '',
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        'Aplicación actualizada'
      )

      setEditandoApp(null)

      await cargarApps()
    } catch {
      mostrarMensaje(
        'error',
        'Error al actualizar la aplicación'
      )
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleApp = async (
    app: Aplicacion
  ) => {
    try {
      const response = await fetch(
        `/api/backend/catalogos/aplicaciones/${app.id}/estado`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activa: !app.activa,
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        `"${app.nombre}" ${
          !app.activa ? 'activada' : 'desactivada'
        }`
      )

      await cargarApps()
    } catch {
      mostrarMensaje(
        'error',
        'Error al cambiar estado'
      )
    }
  }

  const handleAsignarDept = async (
    appId: number
  ) => {
    if (!deptSeleccionado) return

    setGuardando(true)

    try {
      const response = await fetch(
        `/api/backend/catalogos/aplicaciones/${appId}/departamento`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            departamentoId: Number(deptSeleccionado),
          }),
        }
      )

      if (!response.ok) throw new Error()

      mostrarMensaje(
        'exito',
        'Área asignada correctamente'
      )

      setAsignando(null)
      setDeptSeleccionado('')

      await cargarApps()
    } catch {
      mostrarMensaje(
        'error',
        'Error al asignar área'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.content}>
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>
            🗂️ Gestión de catálogos
          </h2>

          <p style={styles.pageSubtitle}>
            Administra departamentos y aplicaciones del sistema
          </p>
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

        <div style={styles.dosColumnas}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                🏢 Departamentos
              </h3>

              <button
                style={styles.btnNuevo}
                onClick={() => {
                  setMostrarFormDept(
                    !mostrarFormDept
                  )
                  setEditandoDept(null)
                }}
              >
                {mostrarFormDept
                  ? '✕ Cancelar'
                  : '➕ Nuevo'}
              </button>
            </div>

            {mostrarFormDept && (
              <div style={styles.formBox}>
                <Campo
                  label="Nombre *"
                  value={nuevoDept.nombre}
                  onChange={value =>
                    setNuevoDept({
                      ...nuevoDept,
                      nombre: value,
                    })
                  }
                />

                <Campo
                  label="Descripción"
                  value={nuevoDept.descripcion}
                  onChange={value =>
                    setNuevoDept({
                      ...nuevoDept,
                      descripcion: value,
                    })
                  }
                />

                <button
                  style={styles.btnGuardar}
                  disabled={
                    !nuevoDept.nombre.trim() ||
                    guardando
                  }
                  onClick={handleCrearDept}
                >
                  {guardando
                    ? 'Guardando...'
                    : '💾 Crear'}
                </button>
              </div>
            )}

            {cargandoDeptos ? (
              <p style={styles.vacio}>Cargando...</p>
            ) : (
              <div style={styles.listaItems}>
                {deptos.map(dept => (
                  <div key={dept.id}>
                    {editandoDept?.id !== dept.id ? (
                      <div style={styles.itemCard}>
                        <div style={styles.itemInfo}>
                          <strong>
                            {dept.nombre}
                          </strong>

                          {dept.descripcion && (
                            <span style={styles.itemDesc}>
                              {dept.descripcion}
                            </span>
                          )}
                        </div>

                        <div style={styles.itemAcciones}>
                          <button
                            style={styles.btnEditar}
                            onClick={() =>
                              setEditandoDept({
                                ...dept,
                              })
                            }
                          >
                            ✏️
                          </button>

                          <button
                            style={styles.btnEliminar}
                            onClick={() =>
                              void handleEliminarDept(
                                dept
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.editBox}>
                        <input
                          style={styles.input}
                          value={editandoDept.nombre}
                          onChange={e =>
                            setEditandoDept({
                              ...editandoDept,
                              nombre: e.target.value,
                            })
                          }
                        />

                        <input
                          style={styles.input}
                          value={
                            editandoDept.descripcion ||
                            ''
                          }
                          onChange={e =>
                            setEditandoDept({
                              ...editandoDept,
                              descripcion:
                                e.target.value,
                            })
                          }
                        />

                        <button
                          style={styles.btnGuardar}
                          onClick={
                            handleGuardarEdicionDept
                          }
                        >
                          💾 Guardar
                        </button>

                        <button
                          style={styles.btnCancelar}
                          onClick={() =>
                            setEditandoDept(null)
                          }
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                📦 Aplicaciones
              </h3>

              <button
                style={styles.btnNuevo}
                onClick={() => {
                  setMostrarFormApp(
                    !mostrarFormApp
                  )
                  setEditandoApp(null)
                  setAsignando(null)
                }}
              >
                {mostrarFormApp
                  ? '✕ Cancelar'
                  : '➕ Nueva'}
              </button>
            </div>

            {mostrarFormApp && (
              <div style={styles.formBox}>
                <Campo
                  label="Nombre *"
                  value={nuevaApp.nombre}
                  onChange={value =>
                    setNuevaApp({
                      ...nuevaApp,
                      nombre: value,
                    })
                  }
                />

                <Campo
                  label="Descripción"
                  value={nuevaApp.descripcion}
                  onChange={value =>
                    setNuevaApp({
                      ...nuevaApp,
                      descripcion: value,
                    })
                  }
                />

                <button
                  style={styles.btnGuardar}
                  disabled={
                    !nuevaApp.nombre.trim() ||
                    guardando
                  }
                  onClick={handleCrearApp}
                >
                  {guardando
                    ? 'Guardando...'
                    : '💾 Crear'}
                </button>
              </div>
            )}

            {cargandoApps ? (
              <p style={styles.vacio}>Cargando...</p>
            ) : (
              <div style={styles.listaItems}>
                {aplicaciones.map(app => (
                  <div key={app.id}>
                    {editandoApp?.id !== app.id &&
                    asignando !== app.id ? (
                      <div
                        style={{
                          ...styles.itemCard,
                          opacity:
                            app.activa
                              ? 1
                              : 0.55,
                        }}
                      >
                        <div style={styles.itemInfo}>
                          <strong>
                            {app.nombre}
                          </strong>

                          <span style={styles.deptBadge}>
                            {app.departamentoNombre ||
                              'Sin área'}
                          </span>

                          {!app.activa && (
                            <span
                              style={
                                styles.inactivaBadge
                              }
                            >
                              INACTIVA
                            </span>
                          )}
                        </div>

                        <div style={styles.itemAcciones}>
                          <button
                            style={styles.btnEditar}
                            onClick={() => {
                              setEditandoApp({
                                ...app,
                              })
                              setAsignando(null)
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            style={styles.btnAsignar}
                            onClick={() => {
                              setAsignando(app.id)
                              setDeptSeleccionado(
                                app.departamentoId?.toString() ||
                                  ''
                              )
                              setEditandoApp(null)
                            }}
                          >
                            🏢
                          </button>

                          <button
                            style={styles.btnToggle}
                            onClick={() =>
                              void handleToggleApp(app)
                            }
                          >
                            {app.activa
                              ? '🚫'
                              : '✅'}
                          </button>
                        </div>
                      </div>
                    ) : editandoApp?.id ===
                      app.id ? (
                      <div style={styles.editBox}>
                        <input
                          style={styles.input}
                          value={editandoApp.nombre}
                          onChange={e =>
                            setEditandoApp({
                              ...editandoApp,
                              nombre: e.target.value,
                            })
                          }
                        />

                        <input
                          style={styles.input}
                          value={
                            editandoApp.descripcion ||
                            ''
                          }
                          onChange={e =>
                            setEditandoApp({
                              ...editandoApp,
                              descripcion:
                                e.target.value,
                            })
                          }
                        />

                        <button
                          style={styles.btnGuardar}
                          onClick={
                            handleGuardarEdicionApp
                          }
                        >
                          💾 Guardar
                        </button>

                        <button
                          style={styles.btnCancelar}
                          onClick={() =>
                            setEditandoApp(null)
                          }
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={styles.editBox}>
                        <strong>
                          Asignar área a {app.nombre}
                        </strong>

                        <select
                          style={styles.input}
                          value={deptSeleccionado}
                          onChange={e =>
                            setDeptSeleccionado(
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            — Selecciona un área —
                          </option>

                          {deptosActivos.map(
                            dept => (
                              <option
                                key={dept.id}
                                value={dept.id}
                              >
                                {dept.nombre}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          style={styles.btnGuardar}
                          disabled={
                            !deptSeleccionado ||
                            guardando
                          }
                          onClick={() =>
                            void handleAsignarDept(
                              app.id
                            )
                          }
                        >
                          💾 Guardar
                        </button>

                        <button
                          style={styles.btnCancelar}
                          onClick={() => {
                            setAsignando(null)
                            setDeptSeleccionado('')
                          }}
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <input
        style={styles.input}
        value={value}
        onChange={e =>
          onChange(e.target.value)
        }
      />
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

  pageHeader: {
    marginBottom: '1.5rem',
  },

  pageTitle: {
    margin: '0 0 0.25rem',
    color: '#1a1a2e',
  },

  pageSubtitle: {
    margin: 0,
    color: '#666',
  },

  mensajeBox: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },

  dosColumnas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow:
      '0 2px 10px rgba(0,0,0,0.08)',
    padding: '1.5rem',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },

  cardTitle: {
    margin: 0,
    color: '#1a1a2e',
  },

  btnNuevo: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  formBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },

  label: {
    fontSize: '0.85rem',
    color: '#333',
  },

  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },

  btnGuardar: {
    padding: '0.55rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  btnCancelar: {
    padding: '0.45rem 0.8rem',
    background: 'transparent',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  vacio: {
    color: '#999',
    textAlign: 'center',
  },

  listaItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  itemCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },

  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },

  itemDesc: {
    fontSize: '0.78rem',
    color: '#888',
  },

  itemAcciones: {
    display: 'flex',
    gap: '0.3rem',
  },

  deptBadge: {
    fontSize: '0.72rem',
    backgroundColor: '#edf2f7',
    padding: '0.15rem 0.5rem',
    borderRadius: '10px',
    alignSelf: 'flex-start',
  },

  inactivaBadge: {
    fontSize: '0.7rem',
    color: '#e53e3e',
  },

  btnEditar: {
    background: 'transparent',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  btnEliminar: {
    background: 'transparent',
    border: '1px solid #fed7d7',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  btnAsignar: {
    background: 'transparent',
    border: '1px solid #bee3f8',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  btnToggle: {
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  editBox: {
    padding: '0.75rem',
    backgroundColor: '#f0f4ff',
    borderRadius: '6px',
    border: '1px solid #c3d0f5',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
}