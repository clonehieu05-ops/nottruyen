import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()

    // Hide navbar on auth pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null
    }

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-logo">
                    TruyệnHub
                </Link>

                <div className="navbar-nav">
                    <Link
                        to="/"
                        className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        Trang chủ
                    </Link>
                    <Link
                        to="/the-loai"
                        className={`navbar-link ${location.pathname === '/the-loai' ? 'active' : ''}`}
                    >
                        Thể loại
                    </Link>
                    <Link
                        to="/moi-cap-nhat"
                        className={`navbar-link ${location.pathname === '/moi-cap-nhat' ? 'active' : ''}`}
                    >
                        Mới cập nhật
                    </Link>
                </div>

                <div className="navbar-actions flex items-center gap-4">
                    <button className="btn-glass" style={{ padding: '8px 12px', borderRadius: '50%' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>
                    <Link to="/profile">
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600
                        }}>
                            U
                        </div>
                    </Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
