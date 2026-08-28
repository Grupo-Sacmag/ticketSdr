import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ── CampoPassword FUERA de CambiarPassword ────────────────────────────────────
// Al estar fuera, React lo reconoce como el mismo componente entre renders
// y no lo desmonta/remonta con cada tecla que se presiona.
function CampoPassword({ name, label, campo, value, onChange, mostrar, onToggle, error }) {
    return (
        <div style={styles.field}>
            <label style={styles.label}>{label}</label>
            <div style={styles.inputWrapper}>
                <input
                    type={mostrar ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: '3rem' }}
                />
                <button
                    type="button"
                    style={styles.toggleBtn}
                    onClick={onToggle}
                >
                    {mostrar ? '🙈' : '👁️'}
                </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    )
}

function CambiarPassword() {
    const navigate = useNavigate()
    const usuario  = JSON.parse(localStorage.getItem('usuario') || '{}')
    const token    = localStorage.getItem('token')

    const [form, setForm]           = useState({ passwordActual: '', passwordNueva: '', confirmar: '' })
    const [errores, setErrores]     = useState({})
    const [guardando, setGuardando] = useState(false)
    const [mostrar, setMostrar]     = useState({ actual: false, nueva: false, confirmar: false })

    const toggleVer = (campo) =>
        setMostrar(p => ({ ...p, [campo]: !p[campo] }))

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrores({ ...errores, [e.target.name]: '' })
    }

    const validar = () => {
        const err = {}
        if (!form.passwordActual.trim())
            err.passwordActual = 'Ingresa tu contraseña temporal'
        if (form.passwordNueva.length < 6)
            err.passwordNueva = 'Mínimo 6 caracteres'
        if (form.passwordNueva === form.passwordActual)
            err.passwordNueva = 'La nueva contraseña debe ser diferente a la temporal'
        if (form.passwordNueva !== form.confirmar)
            err.confirmar = 'Las contraseñas no coinciden'
        setErrores(err)
        return Object.keys(err).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validar()) return
        setGuardando(true)
        try {
            await axios.put(
                'http://localhost:8080/api/auth/cambiar-password',
                { passwordActual: form.passwordActual, passwordNueva: form.passwordNueva },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            const usuarioActualizado = { ...usuario, passwordTemporal: false }
            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))

            navigate(
                usuario.rol === 'ADMIN' || usuario.rol === 'SOPORTE'
                    ? '/admin/tickets'
                    : '/reportar'
            )
        } catch (err) {
            if (err.response?.status === 401) {
                setErrores({ passwordActual: 'La contraseña temporal no es correcta' })
            } else {
                setErrores({ general: 'Ocurrió un error, intenta de nuevo' })
            }
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <span style={styles.lockIcon}>🔐</span>
                    <h2 style={styles.title}>Cambiar contraseña</h2>
                    <p style={styles.subtitle}>
                        Hola <strong>{usuario.nombre}</strong>, el administrador te asignó
                        una contraseña temporal. Por seguridad, debes establecer una nueva
                        antes de continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CampoPassword
                        name="passwordActual"
                        label="Contraseña temporal"
                        campo="actual"
                        value={form.passwordActual}
                        onChange={handleChange}
                        mostrar={mostrar.actual}
                        onToggle={() => toggleVer('actual')}
                        error={errores.passwordActual}
                    />
                    <CampoPassword
                        name="passwordNueva"
                        label="Nueva contraseña"
                        campo="nueva"
                        value={form.passwordNueva}
                        onChange={handleChange}
                        mostrar={mostrar.nueva}
                        onToggle={() => toggleVer('nueva')}
                        error={errores.passwordNueva}
                    />
                    <CampoPassword
                        name="confirmar"
                        label="Confirmar nueva contraseña"
                        campo="confirmar"
                        value={form.confirmar}
                        onChange={handleChange}
                        mostrar={mostrar.confirmar}
                        onToggle={() => toggleVer('confirmar')}
                        error={errores.confirmar}
                    />

                    {errores.general && (
                        <div style={styles.errorBox}>{errores.general}</div>
                    )}

                    <button
                        type="submit"
                        disabled={guardando}
                        style={{
                            ...styles.button,
                            opacity: guardando ? 0.7 : 1,
                            cursor: guardando ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {guardando ? 'Guardando...' : '✅ Establecer nueva contraseña'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const styles = {
    container: {
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f0f2f5'
    },
    card: {
        backgroundColor: 'white', padding: '2rem',
        borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%', maxWidth: '420px'
    },
    header: { textAlign: 'center', marginBottom: '1.5rem' },
    lockIcon: { fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' },
    title: { margin: '0 0 0.5rem', color: '#1a1a2e' },
    subtitle: { color: '#666', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 },
    field: { marginBottom: '1rem' },
    label: {
        display: 'block', marginBottom: '0.4rem',
        color: '#333', fontSize: '0.9rem', fontWeight: '500'
    },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    input: {
        width: '100%', padding: '0.6rem 0.8rem',
        borderRadius: '4px', border: '1px solid #ccc',
        fontSize: '1rem', boxSizing: 'border-box'
    },
    toggleBtn: {
        position: 'absolute', right: '0.6rem',
        background: 'none', border: 'none',
        cursor: 'pointer', fontSize: '1rem', padding: '0.2rem'
    },
    button: {
        width: '100%', padding: '0.75rem',
        backgroundColor: '#1a1a2e', color: 'white',
        border: 'none', borderRadius: '4px',
        fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem'
    },
    error: { color: '#e53e3e', fontSize: '0.8rem', margin: '0.3rem 0 0' },
    errorBox: {
        backgroundColor: '#fff5f5', border: '1px solid #feb2b2',
        borderRadius: '6px', padding: '0.75rem 1rem',
        color: '#c53030', fontSize: '0.9rem', marginBottom: '1rem'
    }
}

export default CambiarPassword