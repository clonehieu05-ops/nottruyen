/**
 * Seed Data - Dữ liệu truyện mẫu để test khi không crawl được
 */
import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, 'database.sqlite')
const db = new Database(dbPath)

const SAMPLE_STORIES = [
    {
        title: "Tôi Thăng Cấp Một Mình (Solo Leveling)",
        slug: "toi-thang-cap-mot-minh",
        author: "Chugong",
        cover: "https://upload.wikimedia.org/wikipedia/en/9/95/Solo_Leveling_Webtoon_cover.png",
        description: "10 năm trước, sau khi 'Cánh cổng' kết nối thế giới thực và quái vật mở ra, một số người bình thường nhận được sức mạnh săn quái vật được gọi là 'Thợ săn'. Sung Jin-Woo, một thợ săn hạng E yếu ớt, trong một lần thám hiểm hang động hạng D đã tìm thấy một hầm ngục kép...",
        source: "seed",
        source_url: "",
        tags: ["Action", "Adventure", "Fantasy", "Manhwa", "Shounen"],
        chapters: [
            { number: 1, title: "Chương 1: Thợ săn hạng E", content: "<p>Nội dung chương 1...</p>" },
            { number: 2, title: "Chương 2: Hầm ngục kép", content: "<p>Nội dung chương 2...</p>" },
            { number: 3, title: "Chương 3: Nhiệm vụ khẩn cấp", content: "<p>Nội dung chương 3...</p>" }
        ]
    },
    {
        title: "Đảo Hải Tặc (One Piece)",
        slug: "dao-hai-tac-one-piece",
        author: "Oda Eiichiro",
        cover: "https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg",
        description: "Gol D. Roger, Vua Hải Tặc, trước khi bị hành quyết đã tiết lộ rằng kho báu vĩ đại nhất của ông, One Piece, được giấu ở Grand Line. Lời tuyên bố này đã mở ra 'Kỷ nguyên Đại hải tặc'...",
        source: "seed",
        source_url: "",
        tags: ["Action", "Adventure", "Comedy", "Manga", "Shounen"],
        chapters: [
            { number: 1, title: "Chương 1: Romance Dawn", content: "<p>Nội dung chương 1...</p>" },
            { number: 2, title: "Chương 2: Luffy mũ rơm", content: "<p>Nội dung chương 2...</p>" }
        ]
    },
    {
        title: "Chú Thuật Hồi Chiến (Jujutsu Kaisen)",
        slug: "chu-thuat-hoi-chien",
        author: "Gege Akutami",
        cover: "https://upload.wikimedia.org/wikipedia/en/4/46/Jujutsu_kaisen_cover_volume_1.jpg",
        description: "Yuji Itadori là một học sinh trung học có thể chất phi thường. Cậu vô tình nuốt phải ngón tay của Ryoumen Sukuna, một nguyền hồn mạnh mẽ, và chia sẻ cơ thể với hắn...",
        source: "seed",
        source_url: "",
        tags: ["Action", "Horror", "School Life", "Shounen", "Supernatural"],
        chapters: [
            { number: 1, title: "Chương 1: Ryoumen Sukuna", content: "<p>Nội dung chương 1...</p>" }
        ]
    }
]

function seed() {
    console.log('🌱 Starting seed...')

    try {
        const stmtStory = db.prepare(`
            INSERT OR IGNORE INTO stories (title, slug, author, cover, description, source, source_url, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const stmtTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
        const stmtStoryTag = db.prepare('INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)')
        const stmtChapter = db.prepare(`
            INSERT OR IGNORE INTO chapters (story_id, chapter_number, title, content, source_url)
            VALUES (?, ?, ?, ?, ?)
        `)

        for (const story of SAMPLE_STORIES) {
            // Insert story
            const rating = (Math.random() * 1.5 + 3.5).toFixed(1)
            stmtStory.run(story.title, story.slug, story.author, story.cover, story.description, story.source, story.source_url, rating)
            const storyId = db.prepare('SELECT id FROM stories WHERE slug = ?').get(story.slug).id

            console.log(`✅ Seeded: ${story.title}`)

            // Insert tags
            for (const tag of story.tags) {
                const tagSlug = tag.toLowerCase().replace(/\s+/g, '-')
                stmtTag.run(tag, tagSlug)
                const tagId = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug).id
                stmtStoryTag.run(storyId, tagId)
            }

            // Insert chapters
            for (const chapter of story.chapters) {
                stmtChapter.run(storyId, chapter.number, chapter.title, chapter.content, '')
            }
        }

        console.log('✅ Seeding complete!')
        return { success: true, count: SAMPLE_STORIES.length }
    } catch (error) {
        console.error('Seed error:', error)
        return { success: false, error: error.message }
    }
}

// Allow importing or running directly
if (process.argv[1] === __filename) {
    seed()
}

export default seed
