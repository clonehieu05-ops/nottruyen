import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function AdminPage() {
    const [adminKey, setAdminKey] = useState('')
    const [pages, setPages] = useState(2)
    const [chapters, setChapters] = useState(3)
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/crawler/status`)
            const data = await res.json()
            setStatus(data)
        } catch (error) {
            console.error('Error fetching status:', error)
        }
    }

    const triggerCrawl = async () => {
        if (!adminKey) {
            setMessage('⚠️ Vui lòng nhập Admin Key')
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const res = await fetch(`${API_URL}/api/admin/crawler/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': adminKey
                },
                body: JSON.stringify({ pages, chapters })
            })

            const data = await res.json()

            if (res.ok) {
                setMessage(`✅ ${data.message}! Crawling ${pages} trang, ${chapters} chương/truyện`)
                fetchStatus()
            } else {
                setMessage(`❌ Lỗi: ${data.error}`)
            }
        } catch (error) {
            setMessage(`❌ Lỗi: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Fetch status on mount
    useState(() => {
        fetchStatus()
    }, [])

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 600 }}>
                <h1 style={{
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 32
                }}>
                    🔧 Admin Panel
                </h1>

                {/* Crawler Status */}
                <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>📊 Trạng thái Crawler</h3>

                    <button
                        onClick={fetchStatus}
                        className="btn-secondary"
                        style={{ marginBottom: 16 }}
                    >
                        🔄 Refresh
                    </button>

                    {status && (
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
                            <p><strong>Đang chạy:</strong> {status.isRunning ? '✅ Có' : '❌ Không'}</p>
                            <p><strong>Lần chạy cuối:</strong> {status.lastRun || 'Chưa có'}</p>
                            <p><strong>Lịch tiếp theo:</strong> {status.nextScheduled || 'N/A'}</p>
                            {status.lastResult && (
                                <p><strong>Kết quả:</strong> {status.lastResult.success ?
                                    `✅ Thành công (${status.lastResult.crawledCount} truyện)` :
                                    `❌ Lỗi: ${status.lastResult.error}`}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Trigger Crawler */}
                <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ marginBottom: 16 }}>🚀 Chạy Crawler</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
                            Admin Key:
                        </label>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Nhập admin key..."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'var(--bg-glass)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
                                Số trang:
                            </label>
                            <input
                                type="number"
                                value={pages}
                                onChange={(e) => setPages(parseInt(e.target.value) || 1)}
                                min="1"
                                max="10"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'var(--bg-glass)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
                                Chương/truyện:
                            </label>
                            <input
                                type="number"
                                value={chapters}
                                onChange={(e) => setChapters(parseInt(e.target.value) || 1)}
                                min="1"
                                max="20"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'var(--bg-glass)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={triggerCrawl}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            borderRadius: 8,
                            border: 'none',
                            background: loading ? 'gray' : 'var(--gradient-primary)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '⏳ Đang xử lý...' : '🚀 Bắt đầu Crawl'}
                    </button>

                    {message && (
                        <p style={{
                            marginTop: 16,
                            padding: 12,
                            borderRadius: 8,
                            background: message.includes('✅') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'
                        }}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Seed Data */}
                <div className="glass-card" style={{ padding: 20, marginTop: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>🌱 Dữ liệu mẫu (Backup)</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                        Nếu crawler bị lỗi, bạn có thể dùng nút này để nạp dữ liệu mẫu (các truyện hot) vào database ngay lập tức.
                    </p>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
                            Admin Key:
                        </label>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Nhập admin key..."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'var(--bg-glass)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <button
                        onClick={async () => {
                            if (!window.confirm('Bạn có chắc muốn nạp dữ liệu mẫu?')) return

                            if (!adminKey) {
                                setMessage('⚠️ Vui lòng nhập Admin Key')
                                return
                            }

                            setLoading(true)
                            setMessage('⏳ Đang nạp dữ liệu...')

                            try {
                                const res = await fetch(`${API_URL}/api/admin/seed`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-Admin-Key': adminKey
                                    }
                                })
                                const data = await res.json()
                                if (res.ok) {
                                    setMessage(`✅ ${data.message}`)
                                } else {
                                    setMessage(`❌ Lỗi: ${data.error}`)
                                }
                            } catch (err) {
                                setMessage(`❌ Lỗi: ${err.message}`)
                            } finally {
                                setLoading(false)
                            }
                        }}
                        disabled={loading}
                        className="btn-secondary"
                        style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white' }}
                    >
                        📥 Nạp Truyện Mẫu
                    </button>
                </div>

                <p style={{
                    marginTop: 24,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                }}>
                    💡 Crawler tự động chạy mỗi ngày lúc 10h sáng (giờ VN)
                </p>
            </div>
        </div>
    )
}

export default AdminPage
