'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Formulario = {
  passwordActual: string
  passwordNueva: string
  confirmar: string
}

export default function CambiarPasswordPage() {
  const router = useRouter()

  const [form, setForm] = useState<Formulario>({
    passwordActual: '',
    passwordNueva: '',
    confirmar: '',
  })

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  const [mostrar, setMostrar] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  })

  const validar = () => {
    const err: Record<string, string> = {}

    if (!form.passwordActual.trim()) {
      err.passwordActual = 'Ingresa tu contraseña temporal'
    }

    if (form.passwordNueva.length < 6) {
      err.passwordNueva = 'Mínimo 6 caracteres'
    }

    if (form.passwordNueva === form.passwordActual) {
      err.passwordNueva =
        'La nueva contraseña debe ser diferente a la temporal'
    }

    if (form.passwordNueva !== form.confirmar) {
      err.confirmar = 'Las contraseñas no coinciden'
    }

    setErrores(err)

    return Object.keys(err).length === 0
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!validar()) return

    setGuardando(true)

    try {
      const response = await fetch('/api/auth/cambiar-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordActual: form.passwordActual,
          passwordNueva: form.passwordNueva,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setErrores({
            passwordActual:
              'La contraseña temporal no es correcta',
          })
        } else {
          setErrores({
            general:
              'Ocurrió un error, intenta de nuevo',
          })
        }

        return
      }

      const sessionResponse = await fetch('/api/auth/session', {
        cache: 'no-store',
      })

      const sessionData = await sessionResponse.json()
      const rol = sessionData?.usuario?.rol

      if (rol === 'ADMIN' || rol === 'SOPORTE') {
        router.replace('/admin/tickets')
      } else {
        router.replace('/reportar')
      }
    } catch {
      setErrores({
        general: 'Ocurrió un error, intenta de nuevo',
      })
    } finally {
      setGuardando(false)
    }
  }

  const campoPassword = (
    name: keyof Formulario,
    label: string,
    visible: keyof typeof mostrar
  ) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <div style={styles.inputWrapper}>
        <input
          type={mostrar[visible] ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={e => {
            setForm({
              ...form,
              [name]: e.target.value,
            })

            setErrores({
              ...errores,
              [name]: '',
            })
          }}
          placeholder="••••••••"
          style={styles.input}
        />

        <button
          type="button"
          style={styles.toggleBtn}
          onClick={() =>
            setMostrar(prev => ({
              ...prev,
              [visible]: !prev[visible],
            }))
          }
        >
          {mostrar[visible] ? '🙈' : '👁️'}
        </button>
      </div>

      {errores[name] && (
        <p style={styles.error}>{errores[name]}</p>
      )}
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.lockIcon}>🔐</span>

          <h2 style={styles.title}>
            Cambiar contraseña
          </h2>

          <p style={styles.subtitle}>
            Por seguridad, debes establecer una nueva contraseña
            antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {campoPassword(
            'passwordActual',
            'Contraseña temporal',
            'actual'
          )}

          {campoPassword(
            'passwordNueva',
            'Nueva contraseña',
            'nueva'
          )}

          {campoPassword(
            'confirmar',
            'Confirmar nueva contraseña',
            'confirmar'
          )}

          {errores.general && (
            <div style={styles.errorBox}>
              {errores.general}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            style={{
              ...styles.button,
              opacity: guardando ? 0.7 : 1,
              cursor: guardando
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {guardando
              ? 'Guardando...'
              : '✅ Establecer nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  lockIcon: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  title: {
    margin: '0 0 0.5rem',
    color: '#1a1a2e',
  },
  subtitle: {
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    margin: 0,
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '0.6rem 3rem 0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  toggleBtn: {
    position: 'absolute',
    right: '0.6rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
  },
}