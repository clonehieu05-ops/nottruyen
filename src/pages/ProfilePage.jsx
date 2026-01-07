import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function ProfilePage() {
    const [activeTab, setActiveTab] = useState('history')
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login')
            return
        }

        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token')
                    navigate('/login')
                    return
                }
                throw new Error('Failed to fetch profile')
            }

            const data = await res.json()
            setUser(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const toggleFavorite = async (storyId, isFavorite) => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const method = isFavorite ? 'DELETE' : 'POST'
            await fetch(`${API_URL}/api/users/favorites/${storyId}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            // Refresh profile data
            fetchProfile()
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: 100 }}>
                    <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: 100 }}>
                    <p style={{ color: 'var(--text-muted)' }}>Không thể tải thông tin người dùng</p>
                    <Link to="/login" className="btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
                        Đăng nhập lại
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 600 }}>
                {/* Settings/Logout icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 20
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--bg-glass)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        title="Đăng xuất"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16,17 21,12 16,7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>

                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: 700
                            }}>
                                {user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <h2 className="profile-name">{user.username}</h2>
                    <div className="profile-level">
                        Level {user.level || 1}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-accent)">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <div
                        className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Reading History
                    </div>
                    <div
                        className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        Favorites
                    </div>
                </div>

                {/* Content */}
                <div className="profile-content">
                    {activeTab === 'history' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(!user.history || user.history.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                    <p>Chưa có lịch sử đọc</p>
                                </div>
                            ) : (
                                user.history.map((item) => (
                                    <Link
                                        to={`/story/${item.story_id}`}
                                        key={item.id}
                                        className="glass-card"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 12,
                                            gap: 16
                                        }}
                                    >
                                        <img
                                            src={item.cover || '/placeholder.jpg'}
                                            alt={item.title}
                                            style={{
                                                width: 60,
                                                height: 80,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                background: 'var(--bg-glass)'
                                            }}
                                            onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: 4 }}>{item.title}</h4>
                                            <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                                                Chương {item.chapter_number}: {item.chapter_title}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'favorites' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(!user.favorites || user.favorites.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                    <p>Chưa có truyện yêu thích</p>
                                </div>
                            ) : (
                                user.favorites.map((item) => (
                                    <Link
                                        to={`/story/${item.story_id}`}
                                        key={item.id}
                                        className="glass-card"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 12,
                                            gap: 16
                                        }}
                                    >
                                        <img
                                            src={item.cover || '/placeholder.jpg'}
                                            alt={item.title}
                                            style={{
                                                width: 60,
                                                height: 80,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                background: 'var(--bg-glass)'
                                            }}
                                            onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: 4 }}>{item.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                                <span style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                                                    {item.rating || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                toggleFavorite(item.story_id, true)
                                            }}
                                            className="heart-icon"
                                            style={{
                                                background: 'transparent',
                                                padding: 8,
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="var(--color-primary)"
                                                stroke="var(--color-primary)"
                                                strokeWidth="2"
                                            >
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                        </button>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
