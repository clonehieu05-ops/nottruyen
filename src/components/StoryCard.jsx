import { useState } from 'react'
import { Link } from 'react-router-dom'

function StoryCard({ story }) {
    const [imageError, setImageError] = useState(false)

    return (
        <Link to={`/story/${story.id || story.slug}`} className="story-card">
            <div className="story-card-image-container">
                {imageError ? (
                    <div className="story-card-placeholder">
                        <span className="story-placeholder-icon">📖</span>
                    </div>
                ) : (
                    <img
                        src={story.cover}
                        alt={story.title}
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                )}
                {/* Badge (Hot/New) - Optional */}
                {story.views > 10000 && (
                    <div className="story-badge hot">HOT</div>
                )}
            </div>

            <div className="story-card-content">
                <h3 className="story-card-title">{story.title}</h3>
                <div className="story-card-meta">
                    <div className="story-card-rating">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" color="#fbbf24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{story.rating || '4.5'}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default StoryCard
