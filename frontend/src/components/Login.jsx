import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [isRegister, setIsRegister] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            if (isRegister) {
                await axios.post(`${API}/api/auth/register`, { username, email, password })
            }
            const res = await axios.post(`${API}/api/auth/login`, { username, password })
            onLogin(res.data.access_token, username)
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong')
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>💬 ChatApp</h1>
                <h2 style={styles.subtitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input style={styles.input} placeholder="Username" value={username}
                           onChange={e => setUsername(e.target.value)} required />
                    {isRegister && (
                        <input style={styles.input} placeholder="Email" type="email" value={email}
                               onChange={e => setEmail(e.target.value)} required />
                    )}
                    <input style={styles.input} placeholder="Password" type="password" value={password}
                           onChange={e => setPassword(e.target.value)} required />
                    <button style={styles.button} type="submit">
                        {isRegister ? 'Register & Login' : 'Login'}
                    </button>
                </form>
                <p style={styles.toggle}>
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <span style={styles.link} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Login' : 'Register'}
          </span>
                </p>
            </div>
        </div>
    )
}

const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    card: { background: 'white', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    title: { textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' },
    subtitle: { textAlign: 'center', color: '#666', fontWeight: 400, marginBottom: '1.5rem' },
    input: { width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
    button: { width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
    error: { background: '#fee', color: '#c00', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
    toggle: { textAlign: 'center', marginTop: '1rem', color: '#666' },
    link: { color: '#667eea', cursor: 'pointer', fontWeight: 600 }
}