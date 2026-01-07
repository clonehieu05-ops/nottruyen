import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function ReaderPage() {
    const { id, chapter } = useParams()
    const navigate = useNavigate()
    const [chapterData, setChapterData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Current chapter number
    const currentChapterNum = parseInt(chapter)

    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true)
            try {
                // Fetch chapter content
                const res = await fetch(`${API_URL}/api/stories/${id}/chapters/${currentChapterNum}`)

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Không tìm thấy chương này')
                    throw new Error('Lỗi tải chương')
                }

                const data = await res.json()
                setChapterData(data)

                // Scroll to top
                window.scrollTo(0, 0)
            } catch (err) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchChapter()
    }, [id, currentChapterNum])

    const handleChapterChange = (e) => {
        const newChapter = e.target.value
        navigate(`/read/${id}/${newChapter}`)
    }

    if (loading) return (
        <div className="page container" style={{ textAlign: 'center', paddingTop: 100 }}>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <p>Đang tải nội dung...</p>
        </div>
    )

    if (error || !chapterData) return (
        <div className="page container" style={{ textAlign: 'center', paddingTop: 100 }}>
            <h2>❌ {error || 'Lỗi không xác định'}</h2>
            <Link to={`/story/${id}`} className="btn btn-primary" style={{ marginTop: 20 }}>
                Về Trang Truyện
            </Link>
        </div>
    )

    return (
        <div className="reader-page">
            {/* Navigation Top */}
            <div className="reader-nav">
                <button
                    onClick={() => chapterData.prevChapter && navigate(`/read/${id}/${chapterData.prevChapter}`)}
                    className="btn btn-glass"
                    disabled={!chapterData.prevChapter}
                    style={{ opacity: !chapterData.prevChapter ? 0.5 : 1 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Trước
                </button>

                <select
                    className="reader-select"
                    value={currentChapterNum}
                    onChange={handleChapterChange}
                >
                    {/* Assuming we might want to query all chapters list if needed, 
                        but for now we can just show current and maybe a range if we had the full list.
                        Ideally, the API should return a list of simplified chapters for this dropdown.
                        For simplicity/fallback, using a simple display or just Showing Current.
                        Better UX: Fetch story details to get full chapter list for dropdown.
                        For now, keeping it simple or just removing dropdown if data insufficient.
                        Let's just show "Chương {num}" as selected.
                    */}
                    <option value={currentChapterNum}>Chương {currentChapterNum}</option>
                    {chapterData.prevChapter && <option value={chapterData.prevChapter}>Chương {chapterData.prevChapter}</option>}
                    {chapterData.nextChapter && <option value={chapterData.nextChapter}>Chương {chapterData.nextChapter}</option>}
                </select>

                <button
                    onClick={() => chapterData.nextChapter && navigate(`/read/${id}/${chapterData.nextChapter}`)}
                    className="btn btn-glass"
                    disabled={!chapterData.nextChapter}
                    style={{ opacity: !chapterData.nextChapter ? 0.5 : 1 }}
                >
                    Sau
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Chapter Title */}
            <h1 style={{
                textAlign: 'center',
                marginBottom: 16,
                fontSize: '1.5rem',
                color: 'var(--color-primary-light)'
            }}>
                {chapterData.story_title}
            </h1>
            <h2 style={{
                textAlign: 'center',
                marginBottom: 32,
                fontSize: '1.2rem',
                fontWeight: 500
            }}>
                {chapterData.title || `Chương ${chapterData.chapter_number}`}
            </h2>

            {/* Content */}
            <div className="reader-content glass-card" style={{
                padding: '20px',
                overflow: 'hidden', // Contain images
                textAlign: chapterData.content?.includes('<img') ? 'center' : 'left'
            }}>
                <div
                    dangerouslySetInnerHTML={{ __html: chapterData.content }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}
                    className="chapter-html-content"
                />
            </div>

            {/* Bottom Navigation */}
            <div className="reader-pagination">
                <button
                    onClick={() => chapterData.prevChapter && navigate(`/read/${id}/${chapterData.prevChapter}`)}
                    className="btn btn-outline"
                    disabled={!chapterData.prevChapter}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Chương trước
                </button>

                <Link
                    to={`/story/${id}`}
                    className="btn btn-glass"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                </Link>

                <button
                    onClick={() => chapterData.nextChapter && navigate(`/read/${id}/${chapterData.nextChapter}`)}
                    className="btn btn-primary"
                    disabled={!chapterData.nextChapter}
                >
                    Chương sau
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            <style>{`
                .chapter-html-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    )
}

export default ReaderPage
