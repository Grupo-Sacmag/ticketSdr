import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { obtenerTodosLosTickets } from '../api/tickets'

// Colores por prioridad para las notificaciones del dropdown
const coloresPrioridad = {
  'Baja': '#48bb78',
  'Media': '#ed8936',
  'Alta': '#e53e3e',
  'Crítica': '#742a2a'
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const esAdmin = usuario.rol === 'ADMIN' || usuario.rol === 'SOPORTE'

  // ── Estado de notificaciones ───────────────────────────────────────────────
  const [ticketsPendientes, setTicketsPendientes] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  // useRef nos da una referencia al nodo DOM del dropdown.
  // Lo usamos para detectar clics FUERA de él y cerrarlo.
  const dropdownRef = useRef(null)

  // ── Cargar tickets pendientes ──────────────────────────────────────────────
  const cargarPendientes = async () => {
    try {
      const todos = await obtenerTodosLosTickets()
      // Solo nos interesan los ABIERTOS para el badge y el dropdown
      setTicketsPendientes(todos.filter(t => t.estado === 'ABIERTO'))
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    }
  }

  useEffect(() => {
    // Solo los admins/soporte ven las notificaciones
    if (!esAdmin) return

    cargarPendientes() // Carga inicial al montar el componente

    // Polling cada 60 segundos para mantener el badge actualizado
    // sin que el usuario tenga que refrescar la página manualmente.
    // La función de limpieza (return) cancela el intervalo cuando
    // el componente se desmonta, evitando memory leaks.
    const intervalo = setInterval(cargarPendientes, 60_000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Cerrar dropdown al hacer clic fuera ───────────────────────────────────
  useEffect(() => {
    const handleClickFuera = (e) => {
      // .contains() verifica si el clic ocurrió dentro del dropdown.
      // Si NO ocurrió dentro, lo cerramos.
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  // Estilo dinámico: resalta el link de la ruta activa
  const linkStyle = (ruta) => ({
    ...styles.link,
    backgroundColor: location.pathname === ruta
        ? 'rgba(255,255,255,0.2)'
        : 'transparent'
  })

  return (
      <nav style={styles.navbar}>

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div style={styles.logo}>
          <span style={styles.logoText}>Grupo SACMAG</span>
          <span style={styles.logoSub}>Sistema de Tickets</span>
        </div>

        {/* ── Links de navegación ──────────────────────────────────────────── */}
        <div style={styles.links}>
          <button style={linkStyle('/reportar')} onClick={() => navigate('/reportar')}>
            📋 Reportar problema
          </button>
          <button style={linkStyle('/mis-tickets')} onClick={() => navigate('/mis-tickets')}>
            🎫 Mis tickets
          </button>
          {esAdmin && (
              <>
                <button style={linkStyle('/admin/tickets')} onClick={() => navigate('/admin/tickets')}>
                  📊 Todos los tickets
                </button>
                <button style={linkStyle('/admin/usuarios')} onClick={() => navigate('/admin/usuarios')}>
                  👥 Usuarios
                </button>
              </>
          )}
        </div>

        {/* ── Zona derecha: campana + usuario ──────────────────────────────── */}
        <div style={styles.derecha}>

          {/* Campana con badge — solo admins/soporte */}
          {esAdmin && (
              // ref apunta a este div para detectar clics fuera
              <div ref={dropdownRef} style={styles.notifWrapper}>

                {/* Botón campana */}
                <button
                    style={styles.campanaBtn}
                    onClick={() => setMostrarDropdown(prev => !prev)}
                    title="Tickets pendientes"
                >
                  🔔
                  {/* Badge rojo: solo aparece si hay tickets abiertos */}
                  {ticketsPendientes.length > 0 && (
                      <span style={styles.badge}>
                  {/* Limitamos a 99+ para que el badge no se deforme */}
                        {ticketsPendientes.length > 99 ? '99+' : ticketsPendientes.length}
                </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {mostrarDropdown && (
                    <div style={styles.dropdown}>

                      {/* Encabezado del dropdown */}
                      <div style={styles.dropdownHeader}>
                        <span style={styles.dropdownTitulo}>Tickets abiertos</span>
                        <span style={styles.dropdownConteo}>{ticketsPendientes.length}</span>
                      </div>

                      {ticketsPendientes.length === 0 ? (
                          <p style={styles.dropdownVacio}>✅ Sin tickets pendientes</p>
                      ) : (
                          <>
                            {/* Lista: mostramos máximo 5 en el dropdown */}
                            <div style={styles.dropdownLista}>
                              {ticketsPendientes.slice(0, 5).map(ticket => (
                                  <div
                                      key={ticket.id}
                                      style={styles.dropdownItem}
                                      onClick={() => {
                                        navigate('/admin/tickets')
                                        setMostrarDropdown(false)
                                      }}
                                  >
                                    <div style={styles.itemFolio}>{ticket.folio}</div>
                                    <div style={styles.itemAplicacion}>{ticket.aplicacion}</div>
                                    <div style={{
                                      ...styles.itemPrioridad,
                                      color: coloresPrioridad[ticket.prioridad] || '#666'
                                    }}>
                                      ● {ticket.prioridad}
                                    </div>
                                  </div>
                              ))}
                            </div>

                            {/* Si hay más de 5, mostramos enlace al panel completo */}
                            {ticketsPendientes.length > 5 && (
                                <button
                                    style={styles.verTodosBtn}
                                    onClick={() => {
                                      navigate('/admin/tickets')
                                      setMostrarDropdown(false)
                                    }}
                                >
                                  Ver todos ({ticketsPendientes.length}) →
                                </button>
                            )}
                          </>
                      )}
                    </div>
                )}
              </div>
          )}

          {/* Nombre del usuario */}
          <span style={styles.nombreUsuario}>👤 {usuario.nombre}</span>

          {/* Cerrar sesión */}
          <button onClick={handleCerrarSesion} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </nav>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  navbar: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: { display: 'flex', flexDirection: 'column' },
  logoText: { fontWeight: '700', fontSize: '1rem', lineHeight: 1.2 },
  logoSub: { fontSize: '0.7rem', opacity: 0.7 },
  links: { display: 'flex', gap: '0.5rem' },
  link: {
    color: 'white', border: 'none',
    padding: '0.5rem 1rem', borderRadius: '4px',
    cursor: 'pointer', fontSize: '0.85rem',
    transition: 'background-color 0.2s',
    background: 'transparent'
  },
  derecha: { display: 'flex', alignItems: 'center', gap: '1rem' },

  // ── Campana ──
  notifWrapper: { position: 'relative' },
  campanaBtn: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#e53e3e',   // rojo llamativo
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center',
    lineHeight: '16px'
  },

  // ── Dropdown ──
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',    // justo debajo de la campana
    right: 0,
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 200                  // por encima de todo el contenido
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white'
  },
  dropdownTitulo: { fontSize: '0.9rem', fontWeight: '600' },
  dropdownConteo: {
    backgroundColor: '#e53e3e',
    color: 'white',
    borderRadius: '10px',
    padding: '0.1rem 0.5rem',
    fontSize: '0.78rem',
    fontWeight: '700'
  },
  dropdownVacio: {
    padding: '1.5rem',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
    margin: 0
  },
  dropdownLista: { maxHeight: '280px', overflowY: 'auto' },
  dropdownItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f2f5',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gridTemplateRows: 'auto auto',
    gap: '0.2rem 0.5rem'
  },
  itemFolio: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1a1a2e',
    gridColumn: '1'
  },
  itemAplicacion: {
    fontSize: '0.78rem',
    color: '#666',
    gridColumn: '1'
  },
  itemPrioridad: {
    fontSize: '0.75rem',
    fontWeight: '600',
    gridColumn: '2',
    gridRow: '1 / 3',
    alignSelf: 'center'
  },
  verTodosBtn: {
    width: '100%',
    padding: '0.7rem',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8f9fa',
    color: '#1a1a2e',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    textAlign: 'center'
  },

  // ── Usuario ──
  nombreUsuario: { fontSize: '0.85rem', opacity: 0.9 },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.5)',
    color: 'white',
    padding: '0.35rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  }
}

export default Navbar