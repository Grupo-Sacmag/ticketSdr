'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Usuario = {
  nombre: string
  correo: string
  rol: string
  passwordTemporal: boolean
}

type Ticket = {
  id: number
  folio: string
  aplicacion: string
  prioridad: string
  estado: string
}

const coloresPrioridad: Record<string, string> = {
  Baja: '#48bb78',
  Media: '#ed8936',
  Alta: '#e53e3e',
  Crítica: '#742a2a',
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [ticketsPendientes, setTicketsPendientes] = useState<Ticket[]>([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const esAdmin =
    usuario?.rol === 'ADMIN' ||
    usuario?.rol === 'SOPORTE'

  useEffect(() => {
    fetch('/api/auth/session', {
      cache: 'no-store',
    })
      .then(async response => {
        if (!response.ok) {
          router.replace('/login')
          return
        }

        const data = await response.json()
        setUsuario(data.usuario)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  const cargarPendientes = async () => {
    try {
      const response = await fetch(
        '/api/backend/tickets/todos',
        { cache: 'no-store' }
      )

      if (!response.ok) return

      const todos: Ticket[] = await response.json()

      setTicketsPendientes(
        todos.filter(ticket => ticket.estado === 'ABIERTO')
      )
    } catch (error) {
      console.error(
        'Error cargando notificaciones:',
        error
      )
    }
  }

  useEffect(() => {
    if (!esAdmin) return

    void cargarPendientes()

    const intervalo = setInterval(
      cargarPendientes,
      60_000
    )

    return () => clearInterval(intervalo)
  }, [esAdmin])

  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setMostrarDropdown(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickFuera
    )

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickFuera
      )
  }, [])

  const handleCerrarSesion = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    })

    router.replace('/login')
    router.refresh()
  }

  const linkStyle = (
    ruta: string
  ): React.CSSProperties => ({
    ...styles.link,
    backgroundColor:
      pathname === ruta
        ? 'rgba(255,255,255,0.2)'
        : 'transparent',
  })

  if (!usuario) return null

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <span style={styles.logoText}>
          Grupo SACMAG
        </span>

        <span style={styles.logoSub}>
          Sistema de Tickets
        </span>
      </div>

      <div style={styles.links}>
        <button
          style={linkStyle('/reportar')}
          onClick={() => router.push('/reportar')}
        >
          📋 Reportar problema
        </button>

        <button
          style={linkStyle('/mis-tickets')}
          onClick={() => router.push('/mis-tickets')}
        >
          🎫 Mis tickets
        </button>

        {esAdmin && (
          <>
            <button
              style={linkStyle('/admin/tickets')}
              onClick={() =>
                router.push('/admin/tickets')
              }
            >
              📊 Todos los tickets
            </button>

            <button
              style={linkStyle('/admin/usuarios')}
              onClick={() =>
                router.push('/admin/usuarios')
              }
            >
              👥 Usuarios
            </button>

            <button
              style={linkStyle('/admin/catalogos')}
              onClick={() =>
                router.push('/admin/catalogos')
              }
            >
              🗂️ Catálogos
            </button>

            <button
              style={linkStyle('/admin/estadisticas')}
              onClick={() =>
                router.push('/admin/estadisticas')
              }
            >
              📊 Estadísticas
            </button>
          </>
        )}
      </div>

      <div style={styles.derecha}>
        {esAdmin && (
          <div
            ref={dropdownRef}
            style={styles.notifWrapper}
          >
            <button
              style={styles.campanaBtn}
              onClick={() =>
                setMostrarDropdown(prev => !prev)
              }
              title="Tickets pendientes"
            >
              🔔

              {ticketsPendientes.length > 0 && (
                <span style={styles.badge}>
                  {ticketsPendientes.length > 99
                    ? '99+'
                    : ticketsPendientes.length}
                </span>
              )}
            </button>

            {mostrarDropdown && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <span style={styles.dropdownTitulo}>
                    Tickets abiertos
                  </span>

                  <span style={styles.dropdownConteo}>
                    {ticketsPendientes.length}
                  </span>
                </div>

                {ticketsPendientes.length === 0 ? (
                  <p style={styles.dropdownVacio}>
                    ✅ Sin tickets pendientes
                  </p>
                ) : (
                  <>
                    <div style={styles.dropdownLista}>
                      {ticketsPendientes
                        .slice(0, 5)
                        .map(ticket => (
                          <div
                            key={ticket.id}
                            style={styles.dropdownItem}
                            onClick={() => {
                              router.push(
                                '/admin/tickets'
                              )
                              setMostrarDropdown(false)
                            }}
                          >
                            <div style={styles.itemFolio}>
                              {ticket.folio}
                            </div>

                            <div
                              style={
                                styles.itemAplicacion
                              }
                            >
                              {ticket.aplicacion}
                            </div>

                            <div
                              style={{
                                ...styles.itemPrioridad,
                                color:
                                  coloresPrioridad[
                                    ticket.prioridad
                                  ] || '#666',
                              }}
                            >
                              ● {ticket.prioridad}
                            </div>
                          </div>
                        ))}
                    </div>

                    {ticketsPendientes.length > 5 && (
                      <button
                        style={styles.verTodosBtn}
                        onClick={() => {
                          router.push(
                            '/admin/tickets'
                          )
                          setMostrarDropdown(false)
                        }}
                      >
                        Ver todos (
                        {ticketsPendientes.length}) →
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <span style={styles.nombreUsuario}>
          👤 {usuario.nombre}
        </span>

        <button
          onClick={handleCerrarSesion}
          style={styles.logoutBtn}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
    zIndex: 100,
  },

  logo: {
    display: 'flex',
    flexDirection: 'column',
  },

  logoText: {
    fontWeight: '700',
    fontSize: '1rem',
    lineHeight: 1.2,
  },

  logoSub: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },

  links: {
    display: 'flex',
    gap: '0.5rem',
  },

  link: {
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    background: 'transparent',
  },

  derecha: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },

  notifWrapper: {
    position: 'relative',
  },

  campanaBtn: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.3rem 0.5rem',
    display: 'flex',
  },

  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#e53e3e',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center',
    lineHeight: '16px',
  },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 200,
  },

  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
  },

  dropdownTitulo: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },

  dropdownConteo: {
    backgroundColor: '#e53e3e',
    color: 'white',
    borderRadius: '10px',
    padding: '0.1rem 0.5rem',
  },

  dropdownVacio: {
    padding: '1.5rem',
    textAlign: 'center',
    color: '#666',
  },

  dropdownLista: {
    maxHeight: '280px',
    overflowY: 'auto',
  },

  dropdownItem: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f2f5',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
  },

  itemFolio: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#1a1a2e',
  },

  itemAplicacion: {
    fontSize: '0.78rem',
    color: '#666',
  },

  itemPrioridad: {
    fontSize: '0.75rem',
    fontWeight: '600',
    gridColumn: '2',
    gridRow: '1 / 3',
    alignSelf: 'center',
  },

  verTodosBtn: {
    width: '100%',
    padding: '0.7rem',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
  },

  nombreUsuario: {
    fontSize: '0.85rem',
    opacity: 0.9,
  },

  logoutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.5)',
    color: 'white',
    padding: '0.35rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
}