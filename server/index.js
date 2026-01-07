import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { setupCrawlerScheduler, triggerCrawl, getCrawlerStatus } from './crawler.js'
import seedDatabase from './db/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'truyenhub-secret-key-2024'

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from frontend build
const distPath = join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// Database setup
const dbPath = join(__dirname, 'db', 'database.sqlite')
const dbDir = join(__dirname, 'db')
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Initialize database
const schemaPath = join(__dirname, 'db', 'schema.sql')
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'Token required' })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' })
        req.user = user
        next()
    })
}

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields required' })
        }

        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username)
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Insert user
        const result = db.prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        ).run(username, email, hashedPassword)

        const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' })

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: result.lastInsertRowid, username, email }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                level: user.level
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// ============================================
// STORIES ROUTES
// ============================================

// Get all stories with pagination
app.get('/api/stories', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const offset = (page - 1) * limit
        const search = req.query.search || ''
        const tag = req.query.tag || ''
        const source = req.query.source || ''

        let query = `
      SELECT s.*, GROUP_CONCAT(t.name) as tags
      FROM stories s
      LEFT JOIN story_tags st ON s.id = st.story_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE 1=1
    `
        const params = []

        if (search) {
            query += ' AND s.title LIKE ?'
            params.push(`%${search}%`)
        }

        if (source) {
            query += ' AND s.source = ?'
            params.push(source)
        }

        if (tag) {
            query += ' AND t.slug = ?'
            params.push(tag)
        }

        query += ' GROUP BY s.id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?'
        params.push(limit, offset)

        const stories = db.prepare(query).all(...params)

        // Get total count
        const countQuery = 'SELECT COUNT(DISTINCT s.id) as count FROM stories s'
        const { count } = db.prepare(countQuery).get()

        res.json({
            stories: stories.map(s => ({
                ...s,
                tags: s.tags ? s.tags.split(',') : []
            })),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        })
    } catch (error) {
        console.error('Get stories error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Get single story
app.get('/api/stories/:id', (req, res) => {
    try {
        const { id } = req.params

        const story = db.prepare(`
      SELECT s.*, GROUP_CONCAT(t.name) as tags
      FROM stories s
      LEFT JOIN story_tags st ON s.id = st.story_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE s.id = ? OR s.slug = ?
      GROUP BY s.id
    `).get(id, id)

        if (!story) {
            return res.status(404).json({ error: 'Story not found' })
        }

        // Get chapters
        const chapters = db.prepare(`
      SELECT id, chapter_number, title, view_count, created_at
      FROM chapters
      WHERE story_id = ?
      ORDER BY chapter_number ASC
    `).all(story.id)

        // Get recent comments
        const comments = db.prepare(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.story_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all(story.id)

        // Get related stories
        const related = db.prepare(`
      SELECT DISTINCT s2.*
      FROM stories s2
      JOIN story_tags st2 ON s2.id = st2.story_id
      WHERE st2.tag_id IN (
        SELECT tag_id FROM story_tags WHERE story_id = ?
      )
      AND s2.id != ?
      LIMIT 6
    `).all(story.id, story.id)

        res.json({
            ...story,
            tags: story.tags ? story.tags.split(',') : [],
            chapters,
            comments,
            related
        })
    } catch (error) {
        console.error('Get story error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// ============================================
// CHAPTERS ROUTES
// ============================================

// Get chapter content
app.get('/api/stories/:storyId/chapters/:chapterNum', (req, res) => {
    try {
        const { storyId, chapterNum } = req.params

        const chapter = db.prepare(`
      SELECT c.*, s.title as story_title
      FROM chapters c
      JOIN stories s ON c.story_id = s.id
      WHERE (s.id = ? OR s.slug = ?) AND c.chapter_number = ?
    `).get(storyId, storyId, chapterNum)

        if (!chapter) {
            return res.status(404).json({ error: 'Chapter not found' })
        }

        // Update view count
        db.prepare('UPDATE chapters SET view_count = view_count + 1 WHERE id = ?').run(chapter.id)

        // Get prev/next chapters
        const prevChapter = db.prepare(`
      SELECT chapter_number FROM chapters 
      WHERE story_id = ? AND chapter_number < ?
      ORDER BY chapter_number DESC LIMIT 1
    `).get(chapter.story_id, chapterNum)

        const nextChapter = db.prepare(`
      SELECT chapter_number FROM chapters 
      WHERE story_id = ? AND chapter_number > ?
      ORDER BY chapter_number ASC LIMIT 1
    `).get(chapter.story_id, chapterNum)

        const totalChapters = db.prepare(
            'SELECT COUNT(*) as count FROM chapters WHERE story_id = ?'
        ).get(chapter.story_id)

        res.json({
            ...chapter,
            prevChapter: prevChapter?.chapter_number || null,
            nextChapter: nextChapter?.chapter_number || null,
            totalChapters: totalChapters.count
        })
    } catch (error) {
        console.error('Get chapter error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, username, email, avatar, level, created_at
      FROM users WHERE id = ?
    `).get(req.user.id)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Get reading history
        const history = db.prepare(`
      SELECT rh.*, s.title, s.cover, c.title as chapter_title, c.chapter_number
      FROM reading_history rh
      JOIN stories s ON rh.story_id = s.id
      JOIN chapters c ON rh.chapter_id = c.id
      WHERE rh.user_id = ?
      ORDER BY rh.read_at DESC
      LIMIT 20
    `).all(user.id)

        // Get favorites
        const favorites = db.prepare(`
      SELECT f.*, s.title, s.cover, s.rating
      FROM favorites f
      JOIN stories s ON f.story_id = s.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user.id)

        res.json({ ...user, history, favorites })
    } catch (error) {
        console.error('Get profile error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Add to favorites
app.post('/api/users/favorites/:storyId', authenticateToken, (req, res) => {
    try {
        const { storyId } = req.params

        db.prepare(`
      INSERT OR IGNORE INTO favorites (user_id, story_id) VALUES (?, ?)
    `).run(req.user.id, storyId)

        res.json({ message: 'Added to favorites' })
    } catch (error) {
        console.error('Add favorite error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Remove from favorites
app.delete('/api/users/favorites/:storyId', authenticateToken, (req, res) => {
    try {
        const { storyId } = req.params

        db.prepare(`
      DELETE FROM favorites WHERE user_id = ? AND story_id = ?
    `).run(req.user.id, storyId)

        res.json({ message: 'Removed from favorites' })
    } catch (error) {
        console.error('Remove favorite error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// Save reading progress
app.post('/api/users/history', authenticateToken, (req, res) => {
    try {
        const { storyId, chapterId } = req.body

        db.prepare(`
      INSERT INTO reading_history (user_id, story_id, chapter_id)
      VALUES (?, ?, ?)
    `).run(req.user.id, storyId, chapterId)

        res.json({ message: 'History saved' })
    } catch (error) {
        console.error('Save history error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// ============================================
// COMMENTS ROUTES
// ============================================

// Add comment
app.post('/api/stories/:storyId/comments', authenticateToken, (req, res) => {
    try {
        const { storyId } = req.params
        const { content, chapterId } = req.body

        const result = db.prepare(`
      INSERT INTO comments (user_id, story_id, chapter_id, content)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, storyId, chapterId || null, content)

        res.status(201).json({
            message: 'Comment added',
            id: result.lastInsertRowid
        })
    } catch (error) {
        console.error('Add comment error:', error)
        res.status(500).json({ error: 'Server error' })
    }
})

// ============================================
// ADMIN / CRAWLER ROUTES
// ============================================

// Get crawler status
app.get('/api/admin/crawler/status', (req, res) => {
    res.json(getCrawlerStatus())
})

// Manually trigger crawler (protected with simple key)
app.post('/api/admin/crawler/run', async (req, res) => {
    const adminKey = process.env.ADMIN_KEY || 'truyenhub-admin-2024'
    const providedKey = req.headers['x-admin-key'] || req.body.adminKey

    if (providedKey !== adminKey) {
        return res.status(403).json({ error: 'Invalid admin key' })
    }

    const pages = parseInt(req.body.pages) || 1
    const chapters = parseInt(req.body.chapters) || 3

    try {
        // Run async - don't wait for completion
        triggerCrawl(db, pages, chapters).catch(console.error)
        res.json({
            message: 'Crawler started',
            pages,
            chapters,
            status: getCrawlerStatus()
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Trigger database seed
app.post('/api/admin/seed', async (req, res) => {
    const adminKey = process.env.ADMIN_KEY || 'truyenhub-admin-2024'
    const providedKey = req.headers['x-admin-key'] || req.body.adminKey

    if (providedKey !== adminKey) {
        return res.status(403).json({ error: 'Invalid admin key' })
    }

    try {
        const result = seedDatabase()
        res.json({ message: 'Database seeded successfully', result })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Catch-all route for SPA - serve index.html for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
})

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TruyệnHub API running at http://localhost:${PORT}`)

    // Setup crawler scheduler
    setupCrawlerScheduler(db)
    console.log('📅 Crawler scheduler initialized')
})

export default app
