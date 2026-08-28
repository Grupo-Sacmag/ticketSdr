import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

const coloresEstado = {
    'ABIERTO':     '#4299e1',
    'EN PROCESO':  '#ed8936',
    'RESUELTO':    '#48bb78',
    'CERRADO':     '#a0aec0'
}

function AdminEstadisticas() {
    const navigate = useNavigate()
    const token    = localStorage.getItem('token')
    const headers  = { Authorization: `Bearer ${token}` }

    const [tickets, setTickets]   = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        axios.get('http://localhost:8080/api/tickets/todos', { headers })
            .then(res => setTickets(res.data))
            .catch(err => console.error('Error cargando estadísticas:', err))
            .finally(() => setCargando(false))
    }, [])

    if (cargando) return (
        <div style={styles.container}>
            <Navbar />
            <p style={{ padding: '2rem', color: '#666' }}>Cargando estadísticas...</p>
        </div>
    )

    // ── Cálculos ──────────────────────────────────────────────────────────────

    const total = tickets.length

    // Tickets sin atender: ABIERTO o EN PROCESO
    // Tickets atendidos:   RESUELTO o CERRADO
    const sinAtender = tickets.filter(
        t => t.estado === 'ABIERTO' || t.estado === 'EN PROCESO').length
    const atendidos  = tickets.filter(
        t => t.estado === 'RESUELTO' || t.estado === 'CERRADO').length

    // Conteo por estado
    const porEstado = ['ABIERTO', 'EN PROCESO', 'RESUELTO', 'CERRADO'].map(estado => ({
        estado,
        cantidad: tickets.filter(t => t.estado === estado).length
    }))

    // Conteo por departamento — ordenado de mayor a menor
    const porDepartamento = Object.entries(
        tickets.reduce((acc, t) => {
            const dept = t.departamento || 'Sin departamento'
            acc[dept] = (acc[dept] || 0) + 1
            return acc
        }, {})
    )
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

    // Conteo por aplicación — top 8
    const porAplicacion = Object.entries(
        tickets.reduce((acc, t) => {
            acc[t.aplicacion] = (acc[t.aplicacion] || 0) + 1
            return acc
        }, {})
    )
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8)

    // Máximos para calcular anchos de barras
    const maxDept = porDepartamento[0]?.cantidad || 1
    const maxApp  = porAplicacion[0]?.cantidad   || 1

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={styles.container}>
            <Navbar />
            <div style={styles.content}>

                {/* Encabezado */}
                <div style={styles.pageHeader}>
                    <h2 style={styles.pageTitle}>📊 Estadísticas del sistema</h2>
                    <p style={styles.pageSubtitle}>
                        Resumen de {total} ticket{total !== 1 ? 's' : ''} registrados
                    </p>
                </div>

                {/* ── Tarjetas resumen ── */}
                <div style={styles.resumenGrid}>

                    <div style={{ ...styles.resumenCard, borderTop: '4px solid #1a1a2e' }}>
                        <p style={styles.resumenNumero}>{total}</p>
                        <p style={styles.resumenLabel}>Total de tickets</p>
                    </div>

                    <div style={{ ...styles.resumenCard, borderTop: '4px solid #e53e3e' }}>
                        <p style={{ ...styles.resumenNumero, color: '#e53e3e' }}>
                            {sinAtender}
                        </p>
                        <p style={styles.resumenLabel}>Sin resolver</p>
                        <p style={styles.resumenSub}>Abiertos + En proceso</p>
                    </div>

                    <div style={{ ...styles.resumenCard, borderTop: '4px solid #48bb78' }}>
                        <p style={{ ...styles.resumenNumero, color: '#48bb78' }}>
                            {atendidos}
                        </p>
                        <p style={styles.resumenLabel}>Resueltos / Cerrados</p>
                        <p style={styles.resumenSub}>
                            {total > 0
                                ? Math.round((atendidos / total) * 100)
                                : 0}% del total
                        </p>
                    </div>

                    <div style={{ ...styles.resumenCard, borderTop: '4px solid #4299e1' }}>
                        <p style={{ ...styles.resumenNumero, color: '#4299e1' }}>
                            {porDepartamento[0]?.nombre || '—'}
                        </p>
                        <p style={styles.resumenLabel}>Área con más tickets</p>
                        <p style={styles.resumenSub}>
                            {porDepartamento[0]?.cantidad || 0} tickets asignados
                        </p>
                    </div>
                </div>

                {/* ── Fila de gráficas ── */}
                <div style={styles.graficasGrid}>

                    {/* Por estado */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>📋 Tickets por estado</h3>
                        <div style={styles.estadosGrid}>
                            {porEstado.map(({ estado, cantidad }) => (
                                <div
                                    key={estado}
                                    style={{
                                        ...styles.estadoItem,
                                        borderLeft: `4px solid ${coloresEstado[estado]}`
                                    }}
                                    // Clic lleva al panel de tickets filtrado por estado
                                    onClick={() => navigate('/admin/tickets')}
                                    title="Ver en panel de tickets"
                                >
                                    <p style={{
                                        ...styles.estadoNumero,
                                        color: coloresEstado[estado]
                                    }}>
                                        {cantidad}
                                    </p>
                                    <p style={styles.estadoLabel}>{estado}</p>
                                    <p style={styles.estadoPct}>
                                        {total > 0
                                            ? Math.round((cantidad / total) * 100)
                                            : 0}%%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Por departamento */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>🏢 Tickets por departamento</h3>
                        {porDepartamento.length === 0 ? (
                            <p style={styles.vacio}>Sin datos</p>
                        ) : (
                            <div style={styles.barraLista}>
                                {porDepartamento.map(({ nombre, cantidad }) => (
                                    <div key={nombre} style={styles.barraItem}>
                                        <div style={styles.barraHeader}>
                                            <span style={styles.barraNombre}>{nombre}</span>
                                            <span style={styles.barraCantidad}>{cantidad}</span>
                                        </div>
                                        <div style={styles.barraFondo}>
                                            <div style={{
                                                ...styles.barraRelleno,
                                                width: `${Math.round(
                                                    (cantidad / maxDept) * 100)}%%`,
                                                backgroundColor: '#1a1a2e'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Por aplicación */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>📦 Aplicaciones con más reportes</h3>
                    {porAplicacion.length === 0 ? (
                        <p style={styles.vacio}>Sin datos</p>
                    ) : (
                        <div style={styles.appGrid}>
                            {porAplicacion.map(({ nombre, cantidad }, idx) => (
                                <div key={nombre} style={styles.appItem}>
                                    {/* Ranking número */}
                                    <div style={{
                                        ...styles.appRank,
                                        backgroundColor: idx === 0 ? '#d69e2e'
                                            : idx === 1 ? '#a0aec0'
                                            : idx === 2 ? '#ed8936'
                                            : '#e2e8f0',
                                        color: idx <= 2 ? 'white' : '#555'
                                    }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={styles.appInfo}>
                                        <p style={styles.appNombre}>{nombre}</p>
                                        <div style={styles.barraFondo}>
                                            <div style={{
                                                ...styles.barraRelleno,
                                                width: `${Math.round(
                                                    (cantidad / maxApp) * 100)}%%`,
                                                backgroundColor: '#4299e1'
                                            }} />
                                        </div>
                                    </div>
                                    <span style={styles.appCantidad}>{cantidad}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

const styles = {
    container:      { minHeight: '100vh', backgroundColor: '#f0f2f5' },
    content:        { padding: '2rem' },
    pageHeader:     { marginBottom: '1.5rem' },
    pageTitle:      { margin: '0 0 0.25rem', color: '#1a1a2e', fontSize: '1.5rem' },
    pageSubtitle:   { margin: 0, color: '#666', fontSize: '0.95rem' },

    // Tarjetas resumen
    resumenGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem', marginBottom: '1.5rem'
    },
    resumenCard: {
        backgroundColor: 'white', borderRadius: '8px',
        padding: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    },
    resumenNumero: {
        fontSize: '1.75rem', fontWeight: '700',
        color: '#1a1a2e', margin: '0 0 0.25rem',
        // Truncar si el texto es largo (nombre de departamento)
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
    },
    resumenLabel:   { fontSize: '0.85rem', color: '#333', margin: '0 0 0.15rem', fontWeight: '500' },
    resumenSub:     { fontSize: '0.78rem', color: '#999', margin: 0 },

    // Layout gráficas
    graficasGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem', marginBottom: '1.5rem'
    },
    card: {
        backgroundColor: 'white', borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        padding: '1.5rem', marginBottom: '1.5rem'
    },
    cardTitle:      { margin: '0 0 1.25rem', color: '#1a1a2e', fontSize: '1rem' },
    vacio:          { color: '#999', textAlign: 'center', padding: '1rem' },

    // Estados
    estadosGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'
    },
    estadoItem: {
        padding: '1rem', borderRadius: '6px',
        backgroundColor: '#f8f9fa', cursor: 'pointer',
        transition: 'transform 0.15s'
    },
    estadoNumero:   { fontSize: '2rem', fontWeight: '700', margin: '0 0 0.2rem' },
    estadoLabel:    { fontSize: '0.78rem', color: '#555', margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
    estadoPct:      { fontSize: '0.82rem', color: '#999', margin: 0 },

    // Barras
    barraLista:     { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    barraItem:      { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    barraHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    barraNombre:    { fontSize: '0.88rem', color: '#333', fontWeight: '500' },
    barraCantidad:  { fontSize: '0.88rem', color: '#666', fontWeight: '600' },
    barraFondo:     { height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' },
    barraRelleno:   { height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' },

    // Aplicaciones
    appGrid:        { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    appItem: {
        display: 'flex', alignItems: 'center',
        gap: '1rem', padding: '0.75rem',
        backgroundColor: '#f8f9fa', borderRadius: '6px'
    },
    appRank: {
        width: '32px', height: '32px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: '700', flexShrink: 0
    },
    appInfo:        { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    appNombre:      { margin: 0, fontSize: '0.9rem', color: '#333', fontWeight: '500' },
    appCantidad:    { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', flexShrink: 0 }
}

export default AdminEstadisticas