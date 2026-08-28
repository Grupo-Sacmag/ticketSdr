import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'

const BASE = 'http://localhost:8080/api/catalogos'

function AdminCatalogos() {
    const token   = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    const [mensaje, setMensaje]     = useState(null)
    const [guardando, setGuardando] = useState(false)

    // ── Departamentos ─────────────────────────────────────────────────────────
    const [deptos, setDeptos]               = useState([])
    const [cargandoDeptos, setCargandoDeptos] = useState(true)
    const [nuevoDept, setNuevoDept]         = useState({ nombre: '', descripcion: '' })
    const [mostrarFormDept, setMostrarFormDept] = useState(false)
    // editandoDept guarda el objeto dept con sus valores temporales mientras se edita
    const [editandoDept, setEditandoDept]   = useState(null)

    // ── Aplicaciones ──────────────────────────────────────────────────────────
    const [aplicaciones, setAplicaciones]       = useState([])
    const [cargandoApps, setCargandoApps]       = useState(true)
    const [nuevaApp, setNuevaApp]               = useState({ nombre: '', descripcion: '' })
    const [mostrarFormApp, setMostrarFormApp]   = useState(false)
    const [editandoApp, setEditandoApp]         = useState(null)
    const [asignando, setAsignando]             = useState(null)
    const [deptSeleccionado, setDeptSeleccionado] = useState('')
    // Lista de departamentos activos para el selector
    const [deptosActivos, setDeptosActivos]     = useState([])

    useEffect(() => {
        cargarDeptos()
        cargarApps()
    }, [])

    // ── Carga ─────────────────────────────────────────────────────────────────
    const cargarDeptos = async () => {
        setCargandoDeptos(true)
        try {
            const { data } = await axios.get(`${BASE}/departamentos/todos`, { headers })
            setDeptos(data)
            // Los activos sirven para el selector de asignación de apps
            setDeptosActivos(data.filter(d => d.activo))
        } catch (e) { console.error(e) }
        finally { setCargandoDeptos(false) }
    }

    const cargarApps = async () => {
        setCargandoApps(true)
        try {
            const { data } = await axios.get(`${BASE}/aplicaciones/todas`, { headers })
            setAplicaciones(data)
        } catch (e) { console.error(e) }
        finally { setCargandoApps(false) }
    }

    const mostrarMensaje = (tipo, texto) => {
        setMensaje({ tipo, texto })
        setTimeout(() => setMensaje(null), 3500)
    }

    // ── Acciones departamentos ────────────────────────────────────────────────
    const handleCrearDept = async () => {
        if (!nuevoDept.nombre.trim()) return
        setGuardando(true)
        try {
            await axios.post(`${BASE}/departamentos`,
                { nombre: nuevoDept.nombre, descripcion: nuevoDept.descripcion },
                { headers })
            mostrarMensaje('exito', `Departamento "${nuevoDept.nombre}" creado`)
            setNuevoDept({ nombre: '', descripcion: '' })
            setMostrarFormDept(false)
            await cargarDeptos()
        } catch { mostrarMensaje('error', 'Error al crear el departamento') }
        finally { setGuardando(false) }
    }

    const handleGuardarEdicionDept = async () => {
        if (!editandoDept?.nombre?.trim()) return
        setGuardando(true)
        try {
            await axios.put(`${BASE}/departamentos/${editandoDept.id}`,
                { nombre: editandoDept.nombre, descripcion: editandoDept.descripcion },
                { headers })
            mostrarMensaje('exito', 'Departamento actualizado')
            setEditandoDept(null)
            await cargarDeptos()
        } catch { mostrarMensaje('error', 'Error al actualizar el departamento') }
        finally { setGuardando(false) }
    }

    const handleEliminarDept = async (dept) => {
        if (!window.confirm(
            `¿Eliminar el departamento "${dept.nombre}"?\n` +
            `Esta acción no se puede deshacer.`)) return
        try {
            await axios.delete(`${BASE}/departamentos/${dept.id}`, { headers })
            mostrarMensaje('exito', `Departamento "${dept.nombre}" eliminado`)
            await cargarDeptos()
        } catch (err) {
            const msg = err.response?.data || 'Error al eliminar el departamento'
            mostrarMensaje('error', typeof msg === 'string' ? msg : 'Error al eliminar')
        }
    }

    // ── Acciones aplicaciones ─────────────────────────────────────────────────
    const handleCrearApp = async () => {
        if (!nuevaApp.nombre.trim()) return
        setGuardando(true)
        try {
            await axios.post(`${BASE}/aplicaciones`,
                { nombre: nuevaApp.nombre, descripcion: nuevaApp.descripcion },
                { headers })
            mostrarMensaje('exito', `Aplicación "${nuevaApp.nombre}" creada`)
            setNuevaApp({ nombre: '', descripcion: '' })
            setMostrarFormApp(false)
            await cargarApps()
        } catch { mostrarMensaje('error', 'Error al crear la aplicación') }
        finally { setGuardando(false) }
    }

    const handleGuardarEdicionApp = async () => {
        if (!editandoApp?.nombre?.trim()) return
        setGuardando(true)
        try {
            await axios.put(`${BASE}/aplicaciones/${editandoApp.id}`,
                { nombre: editandoApp.nombre, descripcion: editandoApp.descripcion },
                { headers })
            mostrarMensaje('exito', 'Aplicación actualizada')
            setEditandoApp(null)
            await cargarApps()
        } catch { mostrarMensaje('error', 'Error al actualizar la aplicación') }
        finally { setGuardando(false) }
    }

    const handleToggleApp = async (app) => {
        try {
            await axios.put(`${BASE}/aplicaciones/${app.id}/estado`,
                { activa: !app.activa }, { headers })
            mostrarMensaje('exito',
                `"${app.nombre}" ${!app.activa ? 'activada' : 'desactivada'}`)
            await cargarApps()
        } catch { mostrarMensaje('error', 'Error al cambiar estado') }
    }

    const handleAsignarDept = async (appId) => {
        if (!deptSeleccionado) return
        setGuardando(true)
        try {
            await axios.put(`${BASE}/aplicaciones/${appId}/departamento`,
                { departamentoId: Number(deptSeleccionado) }, { headers })
            mostrarMensaje('exito', 'Área asignada correctamente')
            setAsignando(null)
            setDeptSeleccionado('')
            await cargarApps()
        } catch { mostrarMensaje('error', 'Error al asignar área') }
        finally { setGuardando(false) }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={styles.container}>
            <Navbar />
            <div style={styles.content}>

                <div style={styles.pageHeader}>
                    <h2 style={styles.pageTitle}>🗂️ Gestión de catálogos</h2>
                    <p style={styles.pageSubtitle}>
                        Administra departamentos y aplicaciones del sistema
                    </p>
                </div>

                {mensaje && (
                    <div style={{
                        ...styles.mensajeBox,
                        backgroundColor: mensaje.tipo === 'exito' ? '#c6f6d5' : '#fed7d7',
                        color:           mensaje.tipo === 'exito' ? '#276749' : '#9b2c2c'
                    }}>
                        {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
                    </div>
                )}

                {/* ── Dos columnas lado a lado ── */}
                <div style={styles.dosColumnas}>

                    {/* ═══════════════ COLUMNA IZQUIERDA: DEPARTAMENTOS ═══════════════ */}
                    <div style={styles.columna}>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>🏢 Departamentos</h3>
                                <button style={styles.btnNuevo}
                                    onClick={() => {
                                        setMostrarFormDept(!mostrarFormDept)
                                        setEditandoDept(null)
                                    }}>
                                    {mostrarFormDept ? '✕ Cancelar' : '➕ Nuevo'}
                                </button>
                            </div>

                            {/* Formulario nuevo departamento */}
                            {mostrarFormDept && (
                                <div style={styles.formBox}>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Nombre *</label>
                                        <input style={styles.input}
                                            placeholder="Ej. Recursos Humanos"
                                            value={nuevoDept.nombre}
                                            onChange={e => setNuevoDept(
                                                { ...nuevoDept, nombre: e.target.value })} />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Descripción</label>
                                        <input style={styles.input}
                                            placeholder="Breve descripción (opcional)"
                                            value={nuevoDept.descripcion}
                                            onChange={e => setNuevoDept(
                                                { ...nuevoDept, descripcion: e.target.value })} />
                                    </div>
                                    <button style={{
                                        ...styles.btnGuardar,
                                        opacity: !nuevoDept.nombre.trim() || guardando ? 0.5 : 1
                                    }}
                                        onClick={handleCrearDept}
                                        disabled={!nuevoDept.nombre.trim() || guardando}>
                                        {guardando ? 'Guardando...' : '💾 Crear'}
                                    </button>
                                </div>
                            )}

                            {/* Lista departamentos */}
                            {cargandoDeptos ? (
                                <p style={styles.vacio}>Cargando...</p>
                            ) : deptos.length === 0 ? (
                                <p style={styles.vacio}>Sin departamentos registrados</p>
                            ) : (
                                <div style={styles.listaItems}>
                                    {deptos.map(dept => (
                                        <div key={dept.id}>
                                            {/* Vista normal */}
                                            {editandoDept?.id !== dept.id ? (
                                                <div style={styles.itemCard}>
                                                    <div style={styles.itemInfo}>
                                                        <span style={styles.itemNombre}>
                                                            {dept.nombre}
                                                        </span>
                                                        {dept.descripcion && (
                                                            <span style={styles.itemDesc}>
                                                                {dept.descripcion}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={styles.itemAcciones}>
                                                        <button style={styles.btnEditar}
                                                            onClick={() => setEditandoDept({
                                                                ...dept })}>
                                                            ✏️
                                                        </button>
                                                        <button style={styles.btnEliminar}
                                                            onClick={() => handleEliminarDept(dept)}>
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Modo edición inline */
                                                <div style={styles.editBox}>
                                                    <input style={styles.inputInline}
                                                        value={editandoDept.nombre}
                                                        onChange={e => setEditandoDept(
                                                            { ...editandoDept,
                                                              nombre: e.target.value })} />
                                                    <input style={styles.inputInline}
                                                        placeholder="Descripción"
                                                        value={editandoDept.descripcion || ''}
                                                        onChange={e => setEditandoDept(
                                                            { ...editandoDept,
                                                              descripcion: e.target.value })} />
                                                    <div style={styles.editBotones}>
                                                        <button style={styles.btnGuardarInline}
                                                            onClick={handleGuardarEdicionDept}
                                                            disabled={guardando}>
                                                            {guardando ? '...' : '💾 Guardar'}
                                                        </button>
                                                        <button style={styles.btnCancelarInline}
                                                            onClick={() => setEditandoDept(null)}>
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══════════════ COLUMNA DERECHA: APLICACIONES ═══════════════ */}
                    <div style={styles.columna}>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>📦 Aplicaciones</h3>
                                <button style={styles.btnNuevo}
                                    onClick={() => {
                                        setMostrarFormApp(!mostrarFormApp)
                                        setEditandoApp(null)
                                        setAsignando(null)
                                    }}>
                                    {mostrarFormApp ? '✕ Cancelar' : '➕ Nueva'}
                                </button>
                            </div>

                            {/* Formulario nueva aplicación */}
                            {mostrarFormApp && (
                                <div style={styles.formBox}>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Nombre *</label>
                                        <input style={styles.input}
                                            placeholder="Ej. Contabilidad"
                                            value={nuevaApp.nombre}
                                            onChange={e => setNuevaApp(
                                                { ...nuevaApp, nombre: e.target.value })} />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Descripción</label>
                                        <input style={styles.input}
                                            placeholder="Breve descripción (opcional)"
                                            value={nuevaApp.descripcion}
                                            onChange={e => setNuevaApp(
                                                { ...nuevaApp, descripcion: e.target.value })} />
                                    </div>
                                    <button style={{
                                        ...styles.btnGuardar,
                                        opacity: !nuevaApp.nombre.trim() || guardando ? 0.5 : 1
                                    }}
                                        onClick={handleCrearApp}
                                        disabled={!nuevaApp.nombre.trim() || guardando}>
                                        {guardando ? 'Guardando...' : '💾 Crear'}
                                    </button>
                                </div>
                            )}

                            {/* Lista aplicaciones */}
                            {cargandoApps ? (
                                <p style={styles.vacio}>Cargando...</p>
                            ) : aplicaciones.length === 0 ? (
                                <p style={styles.vacio}>Sin aplicaciones registradas</p>
                            ) : (
                                <div style={styles.listaItems}>
                                    {aplicaciones.map(app => (
                                        <div key={app.id}>
                                            {/* Vista normal */}
                                            {editandoApp?.id !== app.id && asignando !== app.id ? (
                                                <div style={{
                                                    ...styles.itemCard,
                                                    opacity: !app.activa ? 0.55 : 1
                                                }}>
                                                    <div style={styles.itemInfo}>
                                                        <span style={styles.itemNombre}>
                                                            {app.nombre}
                                                        </span>
                                                        <span style={styles.deptBadge}>
                                                            {app.departamentoNombre}
                                                        </span>
                                                        {!app.activa && (
                                                            <span style={styles.inactivaBadge}>
                                                                INACTIVA
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={styles.itemAcciones}>
                                                        <button style={styles.btnEditar}
                                                            title="Editar nombre y descripción"
                                                            onClick={() => {
                                                                setEditandoApp({ ...app })
                                                                setAsignando(null)
                                                            }}>
                                                            ✏️
                                                        </button>
                                                        <button style={styles.btnAsignar}
                                                            title="Asignar área"
                                                            onClick={() => {
                                                                setAsignando(app.id)
                                                                setDeptSeleccionado(
                                                                    app.departamentoId || '')
                                                                setEditandoApp(null)
                                                            }}>
                                                            🏢
                                                        </button>
                                                        <button style={{
                                                            ...styles.btnToggle,
                                                            color: app.activa
                                                                ? '#e53e3e' : '#48bb78'
                                                        }}
                                                            title={app.activa
                                                                ? 'Desactivar' : 'Activar'}
                                                            onClick={() => handleToggleApp(app)}>
                                                            {app.activa ? '🚫' : '✅'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : editandoApp?.id === app.id ? (
                                                /* Edición inline */
                                                <div style={styles.editBox}>
                                                    <input style={styles.inputInline}
                                                        value={editandoApp.nombre}
                                                        onChange={e => setEditandoApp(
                                                            { ...editandoApp,
                                                              nombre: e.target.value })} />
                                                    <input style={styles.inputInline}
                                                        placeholder="Descripción"
                                                        value={editandoApp.descripcion || ''}
                                                        onChange={e => setEditandoApp(
                                                            { ...editandoApp,
                                                              descripcion: e.target.value })} />
                                                    <div style={styles.editBotones}>
                                                        <button style={styles.btnGuardarInline}
                                                            onClick={handleGuardarEdicionApp}
                                                            disabled={guardando}>
                                                            {guardando ? '...' : '💾 Guardar'}
                                                        </button>
                                                        <button style={styles.btnCancelarInline}
                                                            onClick={() => setEditandoApp(null)}>
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Asignar área inline */
                                                <div style={styles.editBox}>
                                                    <span style={{ fontSize: '0.85rem',
                                                        color: '#333', marginBottom: '0.5rem' }}>
                                                        Asignar área a <strong>{app.nombre}</strong>
                                                    </span>
                                                    <select style={styles.inputInline}
                                                        value={deptSeleccionado}
                                                        onChange={e =>
                                                            setDeptSeleccionado(e.target.value)}>
                                                        <option value="">
                                                            — Selecciona un área —
                                                        </option>
                                                        {deptosActivos.map(d => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div style={styles.editBotones}>
                                                        <button style={{
                                                            ...styles.btnGuardarInline,
                                                            opacity: !deptSeleccionado
                                                                || guardando ? 0.5 : 1
                                                        }}
                                                            onClick={() =>
                                                                handleAsignarDept(app.id)}
                                                            disabled={!deptSeleccionado
                                                                || guardando}>
                                                            {guardando ? '...' : '💾 Guardar'}
                                                        </button>
                                                        <button style={styles.btnCancelarInline}
                                                            onClick={() => {
                                                                setAsignando(null)
                                                                setDeptSeleccionado('')
                                                            }}>
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>{/* fin dosColumnas */}
            </div>
        </div>
    )
}

const styles = {
    container:    { minHeight: '100vh', backgroundColor: '#f0f2f5' },
    content:      { padding: '2rem' },
    pageHeader:   { marginBottom: '1.5rem' },
    pageTitle:    { margin: '0 0 0.25rem', color: '#1a1a2e', fontSize: '1.5rem' },
    pageSubtitle: { margin: 0, color: '#666', fontSize: '0.95rem' },
    mensajeBox:   { padding: '0.75rem 1rem', borderRadius: '6px',
                    marginBottom: '1rem', fontWeight: '500', fontSize: '0.9rem' },
    // Layout
    dosColumnas: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        alignItems: 'start'    // las columnas no se estiran entre sí
    },
    columna:      { display: 'flex', flexDirection: 'column' },
    card:         { backgroundColor: 'white', borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: '1.5rem' },
    cardHeader:   { display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '1.25rem' },
    cardTitle:    { margin: 0, color: '#1a1a2e', fontSize: '1rem' },
    btnNuevo:     { backgroundColor: '#1a1a2e', color: 'white', border: 'none',
                    padding: '0.45rem 0.9rem', borderRadius: '4px',
                    cursor: 'pointer', fontSize: '0.85rem' },
    // Formulario
    formBox:      { backgroundColor: '#f8f9fa', borderRadius: '6px',
                    padding: '1rem', marginBottom: '1rem',
                    border: '1px solid #e2e8f0', display: 'flex',
                    flexDirection: 'column', gap: '0.6rem' },
    field:        { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    label:        { color: '#333', fontSize: '0.85rem', fontWeight: '500' },
    input:        { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px',
                    border: '1px solid #ccc', fontSize: '0.9rem',
                    boxSizing: 'border-box' },
    btnGuardar:   { padding: '0.55rem 1rem', backgroundColor: '#1a1a2e',
                    color: 'white', border: 'none', borderRadius: '4px',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                    alignSelf: 'flex-start' },
    vacio:        { color: '#999', textAlign: 'center', padding: '1.5rem',
                    fontSize: '0.9rem' },
    // Lista de items
    listaItems:   { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    itemCard:     { display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '0.75rem',
                    backgroundColor: '#f8f9fa', borderRadius: '6px',
                    border: '1px solid #e2e8f0', gap: '0.75rem' },
    itemInfo:     { display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 },
    itemNombre:   { fontSize: '0.9rem', color: '#1a1a2e', fontWeight: '600' },
    itemDesc:     { fontSize: '0.78rem', color: '#888' },
    itemAcciones: { display: 'flex', gap: '0.3rem', flexShrink: 0 },
    deptBadge:    { fontSize: '0.72rem', color: '#555', backgroundColor: '#edf2f7',
                    padding: '0.15rem 0.5rem', borderRadius: '10px',
                    alignSelf: 'flex-start' },
    inactivaBadge:{ fontSize: '0.7rem', color: '#e53e3e', backgroundColor: '#fff5f5',
                    padding: '0.15rem 0.5rem', borderRadius: '10px',
                    alignSelf: 'flex-start', fontWeight: '600' },
    // Botones de acción en cada item
    btnEditar:    { background: 'transparent', border: '1px solid #ccc',
                    borderRadius: '4px', padding: '0.3rem 0.45rem',
                    cursor: 'pointer', fontSize: '0.8rem' },
    btnEliminar:  { background: 'transparent', border: '1px solid #fed7d7',
                    borderRadius: '4px', padding: '0.3rem 0.45rem',
                    cursor: 'pointer', fontSize: '0.8rem' },
    btnAsignar:   { background: 'transparent', border: '1px solid #bee3f8',
                    borderRadius: '4px', padding: '0.3rem 0.45rem',
                    cursor: 'pointer', fontSize: '0.8rem' },
    btnToggle:    { background: 'transparent', border: '1px solid #e2e8f0',
                    borderRadius: '4px', padding: '0.3rem 0.45rem',
                    cursor: 'pointer', fontSize: '0.8rem' },
    // Edición inline
    editBox:      { padding: '0.75rem', backgroundColor: '#f0f4ff',
                    borderRadius: '6px', border: '1px solid #c3d0f5',
                    display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    inputInline:  { width: '100%', padding: '0.45rem 0.65rem',
                    borderRadius: '4px', border: '1px solid #ccc',
                    fontSize: '0.88rem', boxSizing: 'border-box' },
    editBotones:  { display: 'flex', gap: '0.5rem' },
    btnGuardarInline:  { backgroundColor: '#1a1a2e', color: 'white', border: 'none',
                         padding: '0.4rem 0.85rem', borderRadius: '4px',
                         cursor: 'pointer', fontSize: '0.82rem' },
    btnCancelarInline: { background: 'transparent', border: '1px solid #ccc',
                         color: '#666', padding: '0.4rem 0.6rem',
                         borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }
}

export default AdminCatalogos