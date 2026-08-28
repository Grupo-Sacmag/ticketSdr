import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'


const coloresPrioridad = {
  'Baja': '#48bb78', 'Media': '#ed8936',
  'Alta': '#e53e3e', 'Crítica': '#742a2a'
}
const coloresEstado = {
  'ABIERTO': '#4299e1', 'EN PROCESO': '#ed8936',
  'RESUELTO': '#48bb78', 'CERRADO': '#a0aec0'
}
const ESTADOS     = ['ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

function AdminTickets() {
  const [tickets, setTickets]                   = useState([])
  const [cargando, setCargando]                 = useState(true)
  const [filtroEstado, setFiltroEstado]         = useState('TODOS')
  const [filtroPrioridad, setFiltroPrioridad]   = useState('TODAS')
  // ── nuevo ──────────────────────────────────────────────────────────────────
  const [filtroDepartamento, setFiltroDepartamento] = useState('TODOS')
  const [departamentos, setDepartamentos]           = useState([])
  // ──────────────────────────────────────────────────────────────────────────
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)
  const [nuevoEstado, setNuevoEstado]           = useState('')
  const [nuevaPrioridad, setNuevaPrioridad]     = useState('')
  const [actualizando, setActualizando]         = useState(false)
  const [mensaje, setMensaje]                   = useState(null)
  const [imagenUrl, setImagenUrl]               = useState(null)
  const [cargandoImagen, setCargandoImagen]     = useState(false)  

  const [usuariosAsignables, setUsuariosAsignables] = useState([])
  const [asignadoId, setAsignadoId] = useState('')
  const [asignando, setAsignando] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const navigate = useNavigate()

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const cargarTickets = async () => {
    try {
          const response = await axios.get(
            'http://localhost:8080/api/tickets/todos', { headers })
          setTickets(response.data)
        } catch (err) {
          console.error(err)
        } finally {
          setCargando(false)
        }
      }

    useEffect(() => {
      cargarTickets()

      axios.get('http://localhost:8080/api/catalogos/departamentos', { headers })
        .then(res => setDepartamentos(res.data))
        .catch(err => console.error('Error cargando departamentos:', err))
    }, [])

  // ── Seleccionar ticket y cargar imagen ────────────────────────────────────
  const handleSeleccionar = async (ticket) => {
    setTicketSeleccionado(ticket)
    setNuevoEstado(ticket.estado)
    setNuevaPrioridad(ticket.prioridad)
    setAsignadoId(ticket.asignadoId || '')
    setImagenUrl(null)

    // Cargar usuarios asignables
    try {
        const res = await axios.get(
            'http://localhost:8080/api/tickets/asignables', { headers })
        setUsuariosAsignables(res.data)
    } catch (err) {
        console.error('Error cargando usuarios asignables:', err)
    }

    // Cargar imagen si existe
    if (ticket.rutaImagen) {
        setCargandoImagen(true)
        try {
            const res = await axios.get(
                `http://localhost:8080/api/tickets/${ticket.id}/imagen`,
                { headers, responseType: 'blob' })
            setImagenUrl(URL.createObjectURL(res.data))
        } catch (err) {
            console.log('Error al cargar imagen:', err)
        } finally {
            setCargandoImagen(false)
        }
      }
  }

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleCambiarEstado = async () => {
    if (!nuevoEstado || !ticketSeleccionado) return
    setActualizando(true)
    try {
      await axios.put(
        `http://localhost:8080/api/tickets/${ticketSeleccionado.id}/estado`,
        { estado: nuevoEstado }, { headers })
      mostrarMensaje('exito', `Estado actualizado a "${nuevoEstado}"`)
      await cargarTickets()
      setTicketSeleccionado(prev => ({ ...prev, estado: nuevoEstado }))
    } catch {
      mostrarMensaje('error', 'Error al actualizar el estado')
    } finally {
      setActualizando(false)
    }
  }

  const handleCambiarPrioridad = async () => {
    if (!nuevaPrioridad || !ticketSeleccionado) return
    setActualizando(true)
    try {
      await axios.put(
        `http://localhost:8080/api/tickets/${ticketSeleccionado.id}/prioridad`,
        { prioridad: nuevaPrioridad }, { headers })
      mostrarMensaje('exito', `Prioridad actualizada a "${nuevaPrioridad}"`)
      await cargarTickets()
      setTicketSeleccionado(prev => ({ ...prev, prioridad: nuevaPrioridad }))
    } catch {
      mostrarMensaje('error', 'Error al actualizar la prioridad')
    } finally {
      setActualizando(false)
    }
  }

  const handleAsignar = async () => {
    if (!asignadoId || !ticketSeleccionado) return
    setAsignando(true)
    try {
        await axios.put(
            `http://localhost:8080/api/tickets/${ticketSeleccionado.id}/asignar`,
            { usuarioId: Number(asignadoId) },
            { headers }
        )
        mostrarMensaje('exito', 'Ticket asignado correctamente')
        await cargarTickets()
        const asignado = usuariosAsignables.find(u => u.id === Number(asignadoId))
        setTicketSeleccionado(prev => ({
            ...prev,
            asignadoA: asignado?.nombre || '',
            asignadoId: Number(asignadoId)
        }))
    } catch {
        mostrarMensaje('error', 'Error al asignar el ticket')
    } finally {
        setAsignando(false)
    }
  } 

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  const cerrarPanel = () => {
    setTicketSeleccionado(null)
    setNuevoEstado('')
    setNuevaPrioridad('')
    setImagenUrl(null)
  }

  // ── Filtrado combinado ────────────────────────────────────────────────────
  // Los tres filtros se aplican en cadena. El de departamento compara el
  // string que devuelve el backend ("Desarrollo (Contabilidad)", etc.)
  const ticketsFiltrados = tickets
    .filter(t => filtroEstado      === 'TODOS'  || t.estado      === filtroEstado)
    .filter(t => filtroPrioridad   === 'TODAS'  || t.prioridad   === filtroPrioridad)
    .filter(t => filtroDepartamento === 'TODOS' || t.departamento === filtroDepartamento)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>

        {/* Estadísticas */}
        <div style={styles.statsRow}>
          {ESTADOS.map(estado => (
            <div key={estado} style={{
              ...styles.statCard,
              borderTop: `4px solid ${coloresEstado[estado]}`,
              // Clic en el stat card aplica el filtro de estado directamente
              cursor: 'pointer',
              outline: filtroEstado === estado
                ? `2px solid ${coloresEstado[estado]}` : 'none'
            }}
              onClick={() => setFiltroEstado(
                filtroEstado === estado ? 'TODOS' : estado)}>
              <p style={styles.statNumero}>
                {tickets.filter(t => t.estado === estado).length}
              </p>
              <p style={styles.statLabel}>{estado}</p>
            </div>
          ))}
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            ...styles.mensajeBox,
            backgroundColor: mensaje.tipo === 'exito' ? '#c6f6d5' : '#fed7d7',
            color:           mensaje.tipo === 'exito' ? '#276749' : '#9b2c2c'
          }}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Tabla */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 Todos los tickets</h3>

            <div style={styles.filtrosContainer}>

              {/* Filtro estado */}
              <div style={styles.filtroGrupo}>
                <label style={styles.filtroLabel}>Estado:</label>
                <select value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  style={styles.filtroSelect}>
                  <option value="TODOS">Todos</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Filtro prioridad */}
              <div style={styles.filtroGrupo}>
                <label style={styles.filtroLabel}>Prioridad:</label>
                <select value={filtroPrioridad}
                  onChange={e => setFiltroPrioridad(e.target.value)}
                  style={styles.filtroSelect}>
                  <option value="TODAS">Todas</option>
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* ── Filtro departamento (nuevo) ──────────────────────────── */}
              <div style={styles.filtroGrupo}>
                <label style={styles.filtroLabel}>Departamento:</label>
                <select value={filtroDepartamento}
                  onChange={e => setFiltroDepartamento(e.target.value)}
                  style={styles.filtroSelect}>
                  <option value="TODOS">Todos</option>
                  <option value="Sin departamento">Sin departamento</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.nombre}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Botón limpiar filtros */}
              {(filtroEstado !== 'TODOS' ||
                filtroPrioridad !== 'TODAS' ||
                filtroDepartamento !== 'TODOS') && (
                <button style={styles.btnLimpiar} onClick={() => {
                  setFiltroEstado('TODOS')
                  setFiltroPrioridad('TODAS')
                  setFiltroDepartamento('TODOS')
                }}>
                  ✕ Limpiar filtros
                </button>
              )}

              <p style={styles.totalTickets}>{ticketsFiltrados.length} ticket(s)</p>
            </div>
          </div>

          {cargando ? (
            <p style={styles.mensajeVacio}>Cargando tickets...</p>
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
                    <tr key={ticket.folio} style={{
                      ...styles.tr,
                      backgroundColor: ticketSeleccionado?.folio === ticket.folio
                        ? '#ebf8ff' : 'white'
                    }}>
                      <td style={styles.td}><strong>{ticket.folio}</strong></td>
                      <td style={styles.td}>
                        <div>{ticket.creadoPor}</div>
                        <div style={styles.correoSmall}>{ticket.correoUsuario}</div>
                      </td>
                      <td style={styles.td}>{ticket.aplicacion}</td>
                      {/* ── columna departamento (nueva) ── */}
                      <td style={styles.td}>
                        <span style={styles.deptBadge}>
                          {ticket.departamento || 'Sin departamento'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresPrioridad[ticket.prioridad]
                        }}>
                          {ticket.prioridad}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: coloresEstado[ticket.estado]
                        }}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(ticket.fechaCreacion).toLocaleDateString('es-MX', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </td>
                      <td style={styles.td}>
                        <button style={styles.accionBtn}
                          onClick={() => handleSeleccionar(ticket)}>
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

        {/* Panel de gestión */}
        {ticketSeleccionado && (
          <div style={styles.card}>
            <div style={styles.panelHeader}>
              <h3 style={styles.cardTitle}>
                ✏️ Gestionar — {ticketSeleccionado.folio}
              </h3>
              <button onClick={cerrarPanel} style={styles.cerrarBtn}>✕ Cerrar</button>
            </div>

            <div style={styles.detalleGrid}>
              <div style={styles.detalleItem}>
                <span style={styles.detalleLabel}>Empleado</span>
                <span>{ticketSeleccionado.creadoPor}</span>
                <span style={styles.correoSmall}>{ticketSeleccionado.correoUsuario}</span>
              </div>
              <div style={styles.detalleItem}>
                <span style={styles.detalleLabel}>Aplicación</span>
                <span>{ticketSeleccionado.aplicacion}</span>
              </div>
              {/* ── departamento en el panel ── */}
              <div style={styles.detalleItem}>
                <span style={styles.detalleLabel}>Departamento</span>
                <span>{ticketSeleccionado.departamento || 'Sin departamento'}</span>
              </div>
              <div style={styles.detalleItem}>
                <span style={styles.detalleLabel}>Prioridad actual</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: coloresPrioridad[ticketSeleccionado.prioridad]
                }}>
                  {ticketSeleccionado.prioridad}
                </span>
              </div>
              <div style={styles.detalleItem}>
                <span style={styles.detalleLabel}>Estado actual</span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: coloresEstado[ticketSeleccionado.estado]
                }}>
                  {ticketSeleccionado.estado}
                </span>
              </div>
            </div>

            <div style={styles.detalleItem}>
              <span style={styles.detalleLabel}>Descripción del problema</span>
              <p style={styles.descripcionTexto}>{ticketSeleccionado.problema}</p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span style={styles.detalleLabel}>Captura de pantalla</span>
              {cargandoImagen ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Cargando imagen...</p>
              ) : imagenUrl ? (
                <div style={styles.imagenContainer}>
                  <img src={imagenUrl} alt="Captura del problema"
                    style={styles.imagenTicket}
                    onClick={() => window.open(imagenUrl, '_blank')} />
                  <p style={styles.imagenHint}>🔍 Clic para ver en tamaño completo</p>
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Sin captura de pantalla
                </p>
              )}
            </div>

            <div style={styles.accionesGrid}>
                {/* Cambiar estado */}
                <div style={styles.accionCard}>
                    <label style={styles.label}>Cambiar estado</label>
                    <select value={nuevoEstado}
                        onChange={e => setNuevoEstado(e.target.value)}
                        style={styles.input}>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <button style={{
                        ...styles.btnGuardar,
                        opacity: nuevoEstado === ticketSeleccionado.estado ? 0.5 : 1,
                        cursor: nuevoEstado === ticketSeleccionado.estado
                            ? 'not-allowed' : 'pointer'
                    }}
                        onClick={handleCambiarEstado}
                        disabled={actualizando || nuevoEstado === ticketSeleccionado.estado}>
                        {actualizando ? 'Guardando...' : '💾 Guardar estado'}
                    </button>
                </div>

                {/* Cambiar prioridad */}
                <div style={styles.accionCard}>
                    <label style={styles.label}>Cambiar prioridad</label>
                    <select value={nuevaPrioridad}
                        onChange={e => setNuevaPrioridad(e.target.value)}
                        style={styles.input}>
                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button style={{
                        ...styles.btnGuardar,
                        backgroundColor: '#4299e1',
                        opacity: nuevaPrioridad === ticketSeleccionado.prioridad ? 0.5 : 1,
                        cursor: nuevaPrioridad === ticketSeleccionado.prioridad
                            ? 'not-allowed' : 'pointer'
                    }}
                        onClick={handleCambiarPrioridad}
                        disabled={actualizando || nuevaPrioridad === ticketSeleccionado.prioridad}>
                        {actualizando ? 'Guardando...' : '🎯 Guardar prioridad'}
                    </button>
                </div>

                {/* Asignar ticket */}
                <div style={styles.accionCard}>
                    <label style={styles.label}>Asignar a</label>
                    <select value={asignadoId}
                        onChange={e => setAsignadoId(e.target.value)}
                        style={styles.input}>
                        <option value="">— Sin asignar —</option>
                        {usuariosAsignables.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.nombre} ({u.rol})
                                {u.departamento !== 'Sin departamento'
                                    ? ` · ${u.departamento}` : ''}
                            </option>
                        ))}
                    </select>
                    <button style={{
                        ...styles.btnGuardar,
                        backgroundColor: '#9b59b6',
                        opacity: !asignadoId || asignando ? 0.5 : 1,
                        cursor: !asignadoId ? 'not-allowed' : 'pointer'
                    }}
                        onClick={handleAsignar}
                        disabled={asignando || !asignadoId}>
                        {asignando ? 'Asignando...' : '👤 Asignar ticket'}
                    </button>
                </div>

                {/* Ver detalle completo */}
                <div style={styles.accionCard}>
                    <label style={styles.label}>Detalle completo</label>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                        Ver historial de comentarios, imágenes y gestión avanzada del ticket.
                    </p>
                    <button
                        style={{ ...styles.btnGuardar, backgroundColor: '#48bb78' }}
                        onClick={() => navigate(`/tickets/${ticketSeleccionado.id}`)}>
                        🔍 Ver detalle completo →
                    </button>
                </div>
            </div>      
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  container:     { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  content:       { padding: '2rem' },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem', marginBottom: '1.5rem'
  },
  statCard: {
    backgroundColor: 'white', borderRadius: '8px',
    padding: '1rem', textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transition: 'transform 0.15s'
  },
  statNumero:    { fontSize: '2rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' },
  statLabel:     { fontSize: '0.78rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
  mensajeBox:    { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: '500', fontSize: '0.9rem' },
  card:          { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '1.5rem' },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  panelHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  cardTitle:     { margin: 0, color: '#1a1a2e' },
  cerrarBtn:     { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#666', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  filtrosContainer: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  filtroGrupo:   { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  filtroLabel:   { fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap' },
  filtroSelect:  { padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' },
  btnLimpiar:    { backgroundColor: 'transparent', border: '1px solid #ccc', color: '#666', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' },
  totalTickets:  { fontSize: '0.85rem', color: '#666', margin: 0 },
  mensajeVacio:  { textAlign: 'center', color: '#666', padding: '2rem' },
  tableContainer:{ overflowX: 'auto' },
  tabla:         { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th:            { backgroundColor: '#f0f2f5', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#333', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr:            { transition: 'background-color 0.15s' },
  td:            { padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#444' },
  correoSmall:   { fontSize: '0.78rem', color: '#999', marginTop: '0.15rem' },
  badge:         { color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '500', whiteSpace: 'nowrap' },
  // Badge neutral para departamento — sin color fuerte para no competir con prioridad/estado
  deptBadge:     { fontSize: '0.78rem', color: '#555', backgroundColor: '#edf2f7', padding: '0.2rem 0.6rem', borderRadius: '12px', whiteSpace: 'nowrap' },
  accionBtn:     { backgroundColor: '#1a1a2e', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  detalleGrid:   { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
  detalleItem:   { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' },
  detalleLabel:  { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' },
  descripcionTexto: { backgroundColor: '#f0f2f5', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem', color: '#444', margin: '0.5rem 0 0' },
  imagenContainer:  { marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  imagenTicket:  { maxWidth: '100%', maxHeight: '300px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'block', margin: '0 auto' },
  imagenHint:    { fontSize: '0.78rem', color: '#999', marginTop: '0.4rem' },
  accionesGrid:  { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem' },
  accionCard:    { backgroundColor: '#f8f9fa', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label:         { color: '#333', fontSize: '0.9rem', fontWeight: '600' },
  input:         { width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' },
  btnGuardar:    { width: '100%', padding: '0.7rem', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }
}

export default AdminTickets