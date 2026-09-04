import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const ROLES = ['EMPLEADO', 'SOPORTE', 'ADMIN']

const coloresRol = {
    'EMPLEADO': '#4299e1',
    'SOPORTE': '#ed8936',
    'ADMIN': '#9b59b6'
}

function AdminUsuarios() {
    // ── Estado existente ──────────────────────────────────────────────────────
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
    const [nuevoRol, setNuevoRol] = useState('')
    const [mensaje, setMensaje] = useState(null)
    const [actualizando, setActualizando] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [formData, setFormData] = useState({ nombre: '', correo: '', password: '', rol: 'EMPLEADO', departamentoId: '' })
    const [erroresForm, setErroresForm] = useState({})
    const [registrando, setRegistrando] = useState(false)
    const [departamentos, setDepartamentos] = useState([])

    // ── Estado nuevo — reset de contraseña ───────────────────────────────────
    // Estos deben estar DENTRO de la función para que React los reconozca como hooks
    const [usuarioReset, setUsuarioReset]       = useState(null)
    const [passwordTemp, setPasswordTemp]       = useState('')
    const [reseteando, setReseteando]           = useState(false)
    const [mostrarPassword, setMostrarPassword] = useState(false)
    const timeoutMensaje = useRef(null)
    const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}')    
    

    function cargarUsuarios() {
    return (async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                'http://localhost:8080/api/auth/usuarios',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
                setUsuarios(response.data)
            } catch (err) {
                console.error('Error cargando usuarios:', err)
            } finally {
                setCargando(false)
            }
        })()
    }

    useEffect(() => {
    cargarUsuarios()
        // Cargar departamentos para el selector
        const token = localStorage.getItem('token')
        axios.get('http://localhost:8080/api/catalogos/departamentos', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setDepartamentos(res.data))
        .catch(err => console.error('Error cargando departamentos:', err))
    }, [])

    const mostrarMensaje = (tipo, texto) => {

        if (timeoutMensaje.current) {
            clearTimeout(timeoutMensaje.current)
        }

        setMensaje({ tipo, texto })

        timeoutMensaje.current = setTimeout(() => {
            setMensaje(null)
        }, 3000)
    }

    useEffect(() => {
        return () => {
            if (timeoutMensaje.current) {
                clearTimeout(timeoutMensaje.current)
            }
        }
    }, [])

    const handleCambiarRol = async () => {
        if (!nuevoRol || !usuarioSeleccionado) return
        setActualizando(true)
        try {
            const token = localStorage.getItem('token')
            await axios.put(
                `http://localhost:8080/api/auth/usuarios/${usuarioSeleccionado.id}/rol`,
                { rol: nuevoRol },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            mostrarMensaje('exito', `Rol de "${usuarioSeleccionado.nombre}" actualizado a ${nuevoRol}`)
            setUsuarioSeleccionado(null)
            await cargarUsuarios()
        } catch (err) {
            mostrarMensaje('error', 'Error al actualizar el rol')
        } finally {
            setActualizando(false)
        }
    }

    const handleCambiarEstado = async (usuario) => {
        try {
            const token = localStorage.getItem('token')
            await axios.put(
                `http://localhost:8080/api/auth/usuarios/${usuario.id}/estado`,
                { activo: !usuario.activo },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            mostrarMensaje('exito',
                `Usuario "${usuario.nombre}" ${!usuario.activo ? 'activado' : 'desactivado'}`)
            await cargarUsuarios()
        } catch (err) {
            mostrarMensaje('error', 'Error al cambiar estado del usuario')
        }
    }

    // ── handleResetPassword también debe estar DENTRO de la función ───────────
    const handleResetPassword = async () => {
        if (!passwordTemp || passwordTemp.length < 6) {
            mostrarMensaje('error', 'La contraseña temporal debe tener mínimo 6 caracteres')
            return
        }
        setReseteando(true)
        try {
            const token = localStorage.getItem('token')
            await axios.put(
                `http://localhost:8080/api/auth/usuarios/${usuarioReset.id}/reset-password`,
                { password: passwordTemp },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            mostrarMensaje('exito', `Contraseña temporal asignada a "${usuarioReset.nombre}"`)
            setUsuarioReset(null)
            setPasswordTemp('')
        } catch (err) {
            mostrarMensaje('error', 'Error al resetear la contraseña')
        } finally {
            setReseteando(false)
        }
    }

    const validarFormulario = () => {
        const errores = {}
        if (!formData.nombre.trim()) errores.nombre = 'El nombre es obligatorio'
        if (!formData.correo.trim()) errores.correo = 'El correo es obligatorio'
        if (!formData.correo.endsWith('@grupo-sacmag.com.mx'))
            errores.correo = 'Debe ser un correo corporativo (@grupo-sacmag.com.mx)'
        if (!formData.password.trim()) errores.password = 'La contraseña es obligatoria'
        if (formData.password.length < 6) errores.password = 'Mínimo 6 caracteres'
        setErroresForm(errores)
        return Object.keys(errores).length === 0
    }    

    const handleRegistrar = async () => {
    if (!validarFormulario()) return
    setRegistrando(true)
    try {
        const token = localStorage.getItem('token')
        await axios.post(
            'http://localhost:8080/api/auth/register',
            { nombre: formData.nombre, correo: formData.correo, password: formData.password },
            { headers: { Authorization: `Bearer ${token}` } }
        )

        mostrarMensaje('exito', `Usuario "${formData.nombre}" registrado correctamente`)

        // Recargar la lista para obtener el ID del usuario recién creado
        const usuariosActualizados = await axios.get(
            'http://localhost:8080/api/auth/usuarios',
            { headers: { Authorization: `Bearer ${token}` } }
        )

        // ← Declarar aquí arriba para que ambos bloques tengan acceso
        const recienCreado = usuariosActualizados.data
            .find(u => u.correo === formData.correo)

        // Cambiar rol si no es EMPLEADO
        if (recienCreado && formData.rol !== 'EMPLEADO') {
            await axios.put(
                `http://localhost:8080/api/auth/usuarios/${recienCreado.id}/rol`,
                { rol: formData.rol },
                { headers: { Authorization: `Bearer ${token}` } }
            )
        }

        // Asignar departamento si se seleccionó uno
        // ← Ahora recienCreado existe en este scope
        if (recienCreado && formData.departamentoId) {
            await axios.put(
                `http://localhost:8080/api/catalogos/usuarios/${recienCreado.id}/departamento`,
                { departamentoId: Number(formData.departamentoId) },
                { headers: { Authorization: `Bearer ${token}` } }
            )
        }

        // Limpiar y recargar
        setFormData({ nombre: '', correo: '', password: '', rol: 'EMPLEADO', departamentoId: '' })
        setMostrarFormulario(false)
        await cargarUsuarios()

    } catch (err) {
        if (err.response?.status === 409) {
            mostrarMensaje('error', 'Este correo ya está registrado')
        } else {
            mostrarMensaje('error', 'Error al registrar el usuario')
        }
    } finally {
        setRegistrando(false)
    }
}

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.correo.toLowerCase().includes(busqueda.toLowerCase())
    )    

    return (
        <div style={styles.container}>
            <Navbar />
            <div style={styles.content}>

                {/* Estadísticas */}
                <div style={styles.statsRow}>
                    {ROLES.map(rol => (
                        <div key={rol} style={{ ...styles.statCard, borderTop: `4px solid ${coloresRol[rol]}` }}>
                            <p style={styles.statNumero}>{usuarios.filter(u => u.rol === rol).length}</p>
                            <p style={styles.statLabel}>{rol}</p>
                        </div>
                    ))}
                    <div style={{ ...styles.statCard, borderTop: '4px solid #e53e3e' }}>
                        <p style={styles.statNumero}>{usuarios.filter(u => !u.activo).length}</p>
                        <p style={styles.statLabel}>INACTIVOS</p>
                    </div>
                </div>

                {/* Mensaje */}
                {mensaje && (
                    <div style={{
                        ...styles.mensajeBox,
                        backgroundColor: mensaje.tipo === 'exito' ? '#c6f6d5' : '#fed7d7',
                        color: mensaje.tipo === 'exito' ? '#276749' : '#9b2c2c'
                    }}>
                        {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
                    </div>
                )}

                {/* Tabla de usuarios */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>👥 Gestión de usuarios</h3>
                        <div style={styles.headerAcciones}>
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nombre o correo..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                style={styles.buscador}
                            />
                            <button
                                style={styles.btnNuevo}
                                onClick={() => {
                                    setMostrarFormulario(!mostrarFormulario)
                                    setUsuarioSeleccionado(null)
                                }}
                            >
                                {mostrarFormulario ? '✕ Cancelar' : '➕ Nuevo usuario'}
                            </button>
                        </div>
                    </div>

                    {/* Formulario de registro */}
                    {mostrarFormulario && (
                        <div style={styles.formularioBox}>
                            <h4 style={styles.formularioTitulo}>Registrar nuevo usuario</h4>
                            <div style={styles.formularioGrid}>
                                <div style={styles.field}>
                                    <label style={styles.label}>Nombre completo *</label>
                                    <input style={styles.input} type="text" placeholder="Juan Pérez"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                    {erroresForm.nombre && <p style={styles.error}>{erroresForm.nombre}</p>}
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Correo corporativo *</label>
                                    <input style={styles.input} type="email"
                                        placeholder="usuario@grupo-sacmag.com.mx"
                                        value={formData.correo}
                                        onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                                    {erroresForm.correo && <p style={styles.error}>{erroresForm.correo}</p>}
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Contraseña *</label>
                                    <input style={styles.input} type="password" placeholder="Mínimo 6 caracteres"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    {erroresForm.password && <p style={styles.error}>{erroresForm.password}</p>}
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Rol *</label>
                                    <select style={styles.input} value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })}>
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Departamento</label>
                                    <select
                                        style={styles.input}
                                        value={formData.departamentoId || ''}
                                        onChange={e => setFormData({ ...formData, departamentoId: e.target.value })}
                                    >
                                        <option value="">— Sin asignar —</option>
                                        {departamentos.map(d => (
                                            <option key={d.id} value={d.id}>{d.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button style={{ ...styles.btnGuardar, opacity: registrando ? 0.7 : 1 }}
                                onClick={handleRegistrar} disabled={registrando}>
                                {registrando ? 'Registrando...' : '💾 Registrar usuario'}
                            </button>
                        </div>
                    )}

                    {/* Tabla */}
                    {cargando ? (
                        <p style={styles.mensajeVacio}>Cargando usuarios...</p>
                    ) : usuariosFiltrados.length === 0 ? (
                        <p style={styles.mensajeVacio}>No se encontraron usuarios.</p>
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
                                        <tr key={usuario.id} style={{
                                            ...styles.tr,
                                            backgroundColor: usuarioSeleccionado?.id === usuario.id ? '#ebf8ff' : 'white',
                                            opacity: !usuario.activo ? 0.6 : 1
                                        }}>
                                            <td style={styles.td}>
                                                <strong>{usuario.nombre}</strong>
                                                {usuario.correo === usuarioActual.correo && (
                                                    <span style={styles.tuCuenta}> (tú)</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>{usuario.correo}</td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.badge, backgroundColor: coloresRol[usuario.rol] }}>
                                                    {usuario.rol}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.badge, backgroundColor: usuario.activo ? '#48bb78' : '#e53e3e' }}>
                                                    {usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {usuario.fechaCreacion
                                                    ? new Date(usuario.fechaCreacion).toLocaleDateString('es-MX', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                                    }) : '—'}
                                            </td>
                                            <td style={styles.td}>
                                                {/* Los botones solo aparecen si NO es la cuenta del admin actual */}
                                                {usuario.correo !== usuarioActual.correo && (
                                                    <div style={styles.botonesAccion}>
                                                        <button style={styles.accionBtn}
                                                            onClick={() => {
                                                                setUsuarioSeleccionado(usuario)
                                                                setNuevoRol(usuario.rol)
                                                                setMostrarFormulario(false)
                                                            }}>
                                                            ✏️ Rol
                                                        </button>
                                                        <button
                                                            style={{ ...styles.accionBtn, backgroundColor: usuario.activo ? '#e53e3e' : '#48bb78' }}
                                                            onClick={() => handleCambiarEstado(usuario)}>
                                                            {usuario.activo ? '🚫 Desactivar' : '✅ Activar'}
                                                        </button>
                                                        {/* ← Botón reset dentro del map, tiene acceso a `usuario` */}
                                                        <button
                                                            style={{ ...styles.accionBtn, backgroundColor: '#d69e2e' }}
                                                            onClick={() => {
                                                                setUsuarioReset(usuario)
                                                                setPasswordTemp('')
                                                                setUsuarioSeleccionado(null)
                                                            }}>
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

                {/* Panel cambiar rol */}
                {usuarioSeleccionado && (
                    <div style={styles.card}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.cardTitle}>✏️ Cambiar rol — {usuarioSeleccionado.nombre}</h3>
                            <button onClick={() => setUsuarioSeleccionado(null)} style={styles.cerrarBtn}>
                                ✕ Cerrar
                            </button>
                        </div>
                        <div style={styles.detalleGrid}>
                            <div style={styles.detalleItem}>
                                <span style={styles.detalleLabel}>Correo</span>
                                <span>{usuarioSeleccionado.correo}</span>
                            </div>
                            <div style={styles.detalleItem}>
                                <span style={styles.detalleLabel}>Rol actual</span>
                                <span style={{ ...styles.badge, backgroundColor: coloresRol[usuarioSeleccionado.rol] }}>
                                    {usuarioSeleccionado.rol}
                                </span>
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Nuevo rol</label>
                            <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} style={styles.input}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <button
                            style={{
                                ...styles.btnGuardar,
                                opacity: nuevoRol === usuarioSeleccionado.rol || actualizando ? 0.5 : 1,
                                cursor: nuevoRol === usuarioSeleccionado.rol ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleCambiarRol}
                            disabled={actualizando || nuevoRol === usuarioSeleccionado.rol}>
                            {actualizando ? 'Guardando...' : '💾 Guardar rol'}
                        </button>
                    </div>
                )}

                {/* Panel reset de contraseña */}
                {usuarioReset && (
                    <div style={styles.card}>
                        <div style={styles.panelHeader}>
                            <h3 style={styles.cardTitle}>🔑 Contraseña temporal — {usuarioReset.nombre}</h3>
                            <button onClick={() => { setUsuarioReset(null); setPasswordTemp('') }} style={styles.cerrarBtn}>
                                ✕ Cerrar
                            </button>
                        </div>
                        <div style={stylesLocal.avisoBox}>
                            <p style={{ margin: 0 }}>
                                📋 Asigna una contraseña temporal. El usuario deberá cambiarla
                                la próxima vez que inicie sesión.
                            </p>
                        </div>
                        <div style={styles.detalleGrid}>
                            <div style={styles.detalleItem}>
                                <span style={styles.detalleLabel}>Usuario</span>
                                <span>{usuarioReset.nombre}</span>
                            </div>
                            <div style={styles.detalleItem}>
                                <span style={styles.detalleLabel}>Correo</span>
                                <span>{usuarioReset.correo}</span>
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Contraseña temporal</label>
                            <div style={stylesLocal.inputWrapper}>
                                <input
                                    type={mostrarPassword ? 'text' : 'password'}
                                    value={passwordTemp}
                                    onChange={e => setPasswordTemp(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    style={{ ...styles.input, paddingRight: '3rem' }}
                                />
                                <button type="button" style={stylesLocal.toggleBtn}
                                    onClick={() => setMostrarPassword(p => !p)}>
                                    {mostrarPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <p style={stylesLocal.hint}>
                                Comparte esta contraseña en persona o por teléfono, nunca por correo.
                            </p>
                        </div>
                        <button
                            style={{
                                ...styles.btnGuardar,
                                backgroundColor: '#d69e2e',
                                opacity: reseteando || passwordTemp.length < 6 ? 0.5 : 1,
                                cursor: reseteando || passwordTemp.length < 6 ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleResetPassword}
                            disabled={reseteando || passwordTemp.length < 6}>
                            {reseteando ? 'Asignando...' : '🔑 Asignar contraseña temporal'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
    content: { padding: '2rem' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { backgroundColor: 'white', borderRadius: '8px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
    statNumero: { fontSize: '2rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' },
    statLabel: { fontSize: '0.78rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
    mensajeBox: { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: '500', fontSize: '0.9rem' },
    card: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '1.5rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    cardTitle: { margin: 0, color: '#1a1a2e' },
    headerAcciones: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' },
    buscador: { padding: '0.5rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem', width: '280px' },
    btnNuevo: { backgroundColor: '#1a1a2e', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' },
    formularioBox: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' },
    formularioTitulo: { margin: '0 0 1rem', color: '#1a1a2e' },
    formularioGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' },
    field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    label: { color: '#333', fontSize: '0.9rem', fontWeight: '500' },
    input: { width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.95rem', boxSizing: 'border-box' },
    error: { color: '#e53e3e', fontSize: '0.8rem', margin: '0.2rem 0 0' },
    btnGuardar: { width: '100%', padding: '0.75rem', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' },
    mensajeVacio: { textAlign: 'center', color: '#666', padding: '2rem' },
    tableContainer: { overflowX: 'auto' },
    tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { backgroundColor: '#f0f2f5', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#333', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.15s' },
    td: { padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#444' },
    tuCuenta: { fontSize: '0.78rem', color: '#999', fontStyle: 'italic' },
    badge: { color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '500', whiteSpace: 'nowrap' },
    botonesAccion: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    accionBtn: { backgroundColor: '#1a1a2e', color: 'white', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' },
    panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    cerrarBtn: { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#666', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
    detalleGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
    detalleItem: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    detalleLabel: { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }
}

const stylesLocal = {
    avisoBox: { backgroundColor: '#fffbeb', border: '1px solid #f6e05e', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.88rem', color: '#744210', marginBottom: '1.25rem' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    toggleBtn: { position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' },
    hint: { margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#888' }
}

export default AdminUsuarios