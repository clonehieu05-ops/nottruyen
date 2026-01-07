import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu không khớp!')
            return
        }
        // TODO: Implement actual registration
        console.log('Register:', formData)
        navigate('/login')
    }

    return (
        <div className="auth-page">
            {/* Background with anime character style */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
          linear-gradient(135deg, rgba(15, 15, 26, 0.85) 0%, rgba(26, 26, 46, 0.8) 100%),
          url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80')
        `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: -1
            }} />

            <div className="auth-card glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            padding: 8
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Registtion</h1>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: 16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                color: 'var(--text-muted)'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showPassword ? (
                                    <>
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>

                    <div>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        style={{
                            background: 'var(--gradient-neon)',
                            color: 'white',
                            marginTop: 8
                        }}
                    >
                        Register
                    </button>
                </form>

                <div className="auth-divider">Loinn</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="social-btn" style={{ background: 'white', color: '#333' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span style={{ fontSize: '0.8rem' }}>Continue with<br />Google</span>
                    </button>

                    <button className="social-btn" style={{ background: '#1877f2' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span style={{ fontSize: '0.8rem' }}>Continue with<br />Facebook</span>
                    </button>
                </div>

                <p style={{
                    textAlign: 'center',
                    marginTop: 20,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                }}>
                    Terms and conditions ts and parething you gow feal etets fo your romelgags.
                </p>

                <div className="auth-footer">
                    <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage
