import { useState, useEffect } from 'react'
import StoryCard from '../components/StoryCard'

const API_URL = import.meta.env.VITE_API_URL || ''

function HomePage() {
    const [stories, setStories] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchStories()
    }, [currentPage])

    const fetchStories = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20
            })
            if (search) params.append('search', search)

            const res = await fetch(`${API_URL}/api/stories?${params}`)
            const data = await res.json()

            setStories(data.stories || [])
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (error) {
            console.error('Error fetching stories:', error)
            setStories([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchStories()
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = []
        const start = Math.max(1, currentPage - 2)
        const end = Math.min(totalPages, start + 4)
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="page">
            <div className="container">
                {/* Hero Section */}
                <div className="page-header" style={{ marginBottom: 40 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 24
                    }}>
                        <h1 style={{
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Truyện Hay
                        </h1>

                        {/* Toggle */}
                        <div className="toggle-container">
                            <button className="toggle-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'var(--gradient-primary)'
                            }} />
                            <button className="toggle-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="search-bar" style={{ maxWidth: 500, marginBottom: 32 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm truyện..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <p>Đang tải truyện...</p>
                    </div>
                ) : stories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <p>Chưa có truyện nào. Hãy chạy crawler để thêm truyện!</p>
                        <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
                            Chạy lệnh: <code>cd crawler && npm run crawl</code>
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Story Grid */}
                        <div className="story-grid">
                            {stories.map((story) => (
                                <StoryCard key={story.id} story={story} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default HomePage
