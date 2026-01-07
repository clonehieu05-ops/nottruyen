import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function StoryDetailPage() {
    const { id } = useParams()
    const [story, setStory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/stories/${id}`)
                if (!res.ok) throw new Error('Story not found')
                const data = await res.json()
                setStory(data)
            } catch (err) {
                console.error(err)
                setError('Không tìm thấy truyện hoặc lỗi kết nối')
            } finally {
                setLoading(false)
            }
        }

        fetchStory()
    }, [id])

    if (loading) return (
        <div className="page container" style={{ textAlign: 'center', paddingTop: 100 }}>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <p>Đang tải thông tin...</p>
        </div>
    )

    if (error || !story) return (
        <div className="page container" style={{ textAlign: 'center', paddingTop: 100 }}>
            <h2>❌ {error || 'Không tìm thấy truyện'}</h2>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
                Về Trang Chủ
            </Link>
        </div>
    )

    // Calculate rating
    const ratingValue = parseFloat(story.rating || 0).toFixed(1)

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Chi tiết truyện</h2>
                    <div className="flex items-center gap-4">
                        <Link to="/" style={{ color: 'var(--text-primary)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Story Info */}
                <div className="story-detail">
                    <div className="story-cover">
                        <img
                            src={story.cover}
                            alt={story.title}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/400x600?text=No+Cover"
                            }}
                        />
                    </div>

                    <div className="story-info">
                        <h1>{story.title}</h1>
                        <p className="story-author">
                            Tác giả: <span style={{ color: 'var(--color-primary)' }}>{story.author || 'Đang cập nhật'}</span>
                        </p>

                        <div className="story-tags">
                            {story.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                            ))}
                        </div>

                        <div className="story-rating">
                            <span className="story-rating-value">{ratingValue}</span>
                            <span className="story-stars" style={{ color: '#fbbf24' }}>★</span>
                            <span className="story-rating-count">(Đánh giá)</span>
                        </div>

                        <p className="story-description">{story.description}</p>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                            {story.chapters && story.chapters.length > 0 ? (
                                <Link
                                    to={`/read/${id}/${story.chapters[0].chapter_number}`}
                                    className="btn btn-primary"
                                >
                                    Đọc Ngay
                                </Link>
                            ) : (
                                <button disabled className="btn btn-glass">Chưa có chương</button>
                            )}
                            {/* <button className="btn btn-outline">Thêm vào tủ</button> */}
                        </div>
                    </div>
                </div>

                {/* Chapter Section */}
                <div className="chapter-section">
                    <div className="section-header">
                        <h3 className="section-title">Danh sách chương</h3>
                    </div>

                    <div className="chapter-list">
                        {story.chapters && story.chapters.length > 0 ? (
                            story.chapters.map((chapter) => (
                                <div key={chapter.id} className="chapter-item">
                                    <span className="chapter-title" style={{ color: 'var(--text-primary)' }}>
                                        {chapter.title || `Chương ${chapter.chapter_number}`}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(chapter.created_at).toLocaleDateString()}
                                        </span>
                                        <Link
                                            to={`/read/${id}/${chapter.chapter_number}`}
                                            className="btn btn-glass chapter-read-btn"
                                        >
                                            Đọc
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Đang cập nhật chương mới...</p>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                {story.comments && story.comments.length > 0 && (
                    <div className="comment-section">
                        <div className="section-header">
                            <h3 className="section-title">Bình luận</h3>
                        </div>
                        <div className="glass-card" style={{ padding: 16 }}>
                            {story.comments.map(comment => (
                                <div key={comment.id} style={{ marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {comment.username ? comment.username[0].toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{comment.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <p>{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Stories */}
                {story.related && story.related.length > 0 && (
                    <div className="related-section">
                        <div className="section-header">
                            <h3 className="section-title">Truyện cùng thể loại</h3>
                        </div>

                        <div className="story-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                            {story.related.map((item) => (
                                <Link
                                    to={`/story/${item.id}`}
                                    key={item.id}
                                    className="story-card"
                                >
                                    <img
                                        src={item.cover}
                                        alt={item.title}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '3/4',
                                            objectFit: 'cover',
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/400x600?text=No+Cover"
                                        }}
                                    />
                                    <div style={{ padding: 8 }}>
                                        <p style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginBottom: 4
                                        }}>
                                            {item.title}
                                        </p>
                                        <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                                            ★ {item.rating || 'N/A'}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StoryDetailPage
