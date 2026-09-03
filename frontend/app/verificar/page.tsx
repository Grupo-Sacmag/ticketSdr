'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type VerificacionTemporal = {
  correo?: string
  expiracion?: string | null
}

export default function VerificarPage() {
  const router = useRouter()

  const [correoInicial, setCorreoInicial] = useState('')
  const [expiracionInicial, setExpiracionInicial] = useState<string | null>(null)
  const [datosCargados, setDatosCargados] = useState(false)

  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [mensajeReenvio, setMensajeReenvio] = useState('')
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [cargandoTiempo, setCargandoTiempo] = useState(true)

  const calcularSegundos = useCallback((expiracion: string) => {
    const diff = new Date(expiracion).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 1000))
  }, [])

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem('verificacion')

      if (guardado) {
        const datos: VerificacionTemporal = JSON.parse(guardado)

        const correoGuardado = datos.correo || ''
        const expiracionGuardada = datos.expiracion || null

        setCorreoInicial(correoGuardado)
        setCorreo(correoGuardado)
        setExpiracionInicial(expiracionGuardada)
      }
    } catch {
      sessionStorage.removeItem('verificacion')
    } finally {
      setDatosCargados(true)
    }
  }, [])

  useEffect(() => {
    if (!datosCargados) return

    const consultarTiempo = async () => {
      if (!correo) {
        setCargandoTiempo(false)
        return
      }

      try {
        const response = await fetch(
          `/api/auth/tiempo-codigo?correo=${encodeURIComponent(correo)}`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          throw new Error('Error consultando tiempo')
        }

        await response.json()

        // if (data.verificado) {
        //   router.push('/login')
        //   return
        // }

        // setSegundosRestantes(
        //   data.tieneCodigoActivo ? data.segundosRestantes : 0
        // )
      } catch (err) {
        console.error('Error consultando tiempo:', err)
      } finally {
        setCargandoTiempo(false)
      }
    }

    if (expiracionInicial) {
      setSegundosRestantes(calcularSegundos(expiracionInicial))
      setCargandoTiempo(false)
    } else {
      void consultarTiempo()
    }
  }, [
    datosCargados,
    correo,
    expiracionInicial,
    calcularSegundos,
    router,
  ])

  useEffect(() => {
    if (segundosRestantes <= 0) return

    const intervalo = setInterval(() => {
      setSegundosRestantes(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(intervalo)
  }, [segundosRestantes])

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60)
      .toString()
      .padStart(2, '0')

    const segundosTexto = (segundos % 60)
      .toString()
      .padStart(2, '0')

    return `${minutos}:${segundosTexto}`
  }

  const handleVerificar = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, codigo }),
      })

      await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          setError(
            'Código incorrecto o expirado. Solicita uno nuevo.'
          )
        } else {
          setError('Ocurrió un error. Intenta de nuevo.')
        }

        setCodigo('')
        return
      }

      sessionStorage.removeItem('verificacion')

      router.push('/reportar')
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
      setCodigo('')
    } finally {
      setLoading(false)
    }
  }

  const handleReenviar = async () => {
    setReenviando(true)
    setMensajeReenvio('')
    setError('')

    try {
      const response = await fetch('/api/auth/reenviar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo }),
      })

      if (!response.ok) {
        throw new Error()
      }

      setMensajeReenvio('✅ Código reenviado. Revisa tu correo.')
      setSegundosRestantes(30 * 60)
      setCodigo('')
    } catch {
      setError('No se pudo reenviar el código. Verifica el correo.')
    } finally {
      setReenviando(false)
    }
  }

  if (!datosCargados || cargandoTiempo) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#666' }}>
            Verificando estado del código...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconoBox}>📧</div>

        <h2 style={styles.titulo}>Verifica tu cuenta</h2>

        <p style={styles.subtitulo}>
          Ingresa el código de 6 dígitos que enviamos a:
        </p>

        <p style={styles.correoTexto}>{correo}</p>

        {segundosRestantes > 0 ? (
          <div style={styles.contadorBox}>
            <p style={styles.contadorLabel}>El código expira en</p>
            <p style={styles.contadorTiempo}>
              {formatearTiempo(segundosRestantes)}
            </p>
          </div>
        ) : (
          <div style={styles.expiradoBox}>
            <p style={styles.expiradoTexto}>
              ⚠️ El código ha expirado
            </p>
            <p style={styles.expiradoSub}>
              Solicita uno nuevo para continuar
            </p>
          </div>
        )}

        <form onSubmit={handleVerificar}>
          {!correoInicial && (
            <div style={styles.field}>
              <label style={styles.label}>Correo</label>

              <input
                style={styles.input}
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="tu@grupo-sacmag.com.mx"
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>
              Código de verificación
            </label>

            <input
              style={{
                ...styles.inputCodigo,
                borderColor:
                  segundosRestantes === 0 ? '#ccc' : '#1a1a2e',
                color:
                  segundosRestantes === 0 ? '#ccc' : '#1a1a2e',
              }}
              type="text"
              value={codigo}
              onChange={e =>
                setCodigo(
                  e.target.value.replace(/\D/g, '').slice(0, 6)
                )
              }
              placeholder="000000"
              maxLength={6}
              disabled={segundosRestantes === 0}
              required
            />

            <p style={styles.hint}>Solo números, 6 dígitos</p>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {mensajeReenvio && (
            <p style={styles.exito}>{mensajeReenvio}</p>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity:
                loading ||
                codigo.length !== 6 ||
                segundosRestantes === 0
                  ? 0.5
                  : 1,
              cursor:
                loading ||
                codigo.length !== 6 ||
                segundosRestantes === 0
                  ? 'not-allowed'
                  : 'pointer',
            }}
            disabled={
              loading ||
              codigo.length !== 6 ||
              segundosRestantes === 0
            }
          >
            {loading ? 'Verificando...' : '✅ Verificar cuenta'}
          </button>
        </form>

        <div style={styles.reenvioBox}>
          {segundosRestantes > 0 ? (
            <p style={styles.reenvioTexto}>
              Podrás solicitar un nuevo código cuando expire el actual
            </p>
          ) : (
            <>
              <p style={styles.reenvioTexto}>
                ¿No llegó el código o expiró?
              </p>

              <button
                onClick={handleReenviar}
                style={styles.reenvioBtn}
                disabled={reenviando}
              >
                {reenviando
                  ? 'Reenviando...'
                  : '🔄 Reenviar código'}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/login')}
          style={styles.volverBtn}
        >
          ← Volver al login
        </button>
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
    padding: '2.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  iconoBox: { fontSize: '3rem', marginBottom: '0.5rem' },
  titulo: { margin: '0 0 0.5rem', color: '#1a1a2e' },
  subtitulo: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0 0 0.25rem',
  },
  correoTexto: {
    color: '#1a1a2e',
    fontWeight: '600',
    fontSize: '0.95rem',
    margin: '0 0 1.25rem',
  },
  contadorBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bee3f8',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '1.25rem',
  },
  contadorLabel: {
    color: '#2b6cb0',
    fontSize: '0.8rem',
    margin: '0 0 0.25rem',
  },
  contadorTiempo: {
    color: '#1a1a2e',
    fontSize: '2rem',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '0.1rem',
  },
  expiradoBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #fed7d7',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '1.25rem',
  },
  expiradoTexto: {
    color: '#e53e3e',
    fontWeight: '600',
    margin: '0 0 0.25rem',
  },
  expiradoSub: {
    color: '#999',
    fontSize: '0.85rem',
    margin: 0,
  },
  field: {
    marginBottom: '1rem',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  inputCodigo: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '4px',
    border: '2px solid #1a1a2e',
    fontSize: '2rem',
    boxSizing: 'border-box',
    textAlign: 'center',
    letterSpacing: '0.75rem',
    fontWeight: '700',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#999',
    margin: '0.3rem 0 0',
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  },
  exito: {
    color: '#276749',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '1.5rem',
  },
  reenvioBox: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1.25rem',
    marginBottom: '1rem',
  },
  reenvioTexto: {
    color: '#666',
    fontSize: '0.85rem',
    margin: '0 0 0.5rem',
  },
  reenvioBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #1a1a2e',
    color: '#1a1a2e',
    padding: '0.4rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  volverBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
}