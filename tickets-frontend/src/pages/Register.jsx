import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.correo.endsWith('@grupo-sacmag.com.mx')) {
      setError('Solo se permiten correos corporativos (@grupo-sacmag.com.mx)')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', formData)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('usuario', JSON.stringify({
        nombre: response.data.nombre,
        correo: response.data.correo,
        rol: response.data.rol
      }))
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Este correo ya está registrado')
      } else {
        setError('Ocurrió un error, intenta de nuevo')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Grupo SACMAG</h2>
        <p style={styles.subtitle}>Crear cuenta</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nombre completo</label>
            <input
              style={styles.input}
              type="text"
              name="nombre"
              placeholder="Juan Pérez"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Correo corporativo</label>
            <input
              style={styles.input}
              type="email"
              name="correo"
              placeholder="usuario@grupo-sacmag.com.mx"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p style={styles.link}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    color: '#1a1a2e',
    marginBottom: '0.25rem'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '1.5rem'
  },
  field: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#333',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: '#666'
  }
}

export default Register