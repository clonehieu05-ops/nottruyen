/**
 * ZTruyen Crawler - ztruyen.io.vn
 * Crawl truyện tranh Manhwa, Manga, Manhua tiếng Việt
 */

import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_URL = 'https://ztruyen.io.vn'
const db = new Database(join(__dirname, '..', '..', 'server', 'db', 'database.sqlite'))

// Helper function to create slug
function createSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

// Helper to fetch with retry
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': BASE_URL
                }
            })
            if (response.ok) {
                return await response.text()
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message)
            await new Promise(r => setTimeout(r, 2000))
        }
    }
    throw new Error(`Failed to fetch ${url}`)
}

// Get story list from main page
async function getStoryList(page = 1) {
    console.log(`📚 Fetching story list page ${page}...`)

    const url = page === 1
        ? `${BASE_URL}/danh-sach/truyen-moi.html`
        : `${BASE_URL}/danh-sach/truyen-moi.html?page=${page}`

    const html = await fetchWithRetry(url)
    const $ = cheerio.load(html)

    const stories = []

    $('article, .manga-item, .story-item, [class*="card"], .truyen-item').each((_, el) => {
        const $el = $(el)
        const $link = $el.find('a[href*="truyen-tranh"]').first()
        const title = $el.find('h3, h4, .title, .name').text().trim() || $link.attr('title')
        const cover = $el.find('img').attr('src') || $el.find('img').attr('data-src')
        const storyUrl = $link.attr('href')

        if (title && storyUrl) {
            stories.push({
                title,
                cover: cover?.startsWith('http') ? cover : `${BASE_URL}${cover}`,
                url: storyUrl.startsWith('http') ? storyUrl : `${BASE_URL}${storyUrl}`,
                source: 'ztruyen'
            })
        }
    })

    console.log(`Found ${stories.length} stories on page ${page}`)
    return stories
}

// Get story details
async function getStoryDetails(storyUrl) {
    console.log(`📖 Fetching story details: ${storyUrl}`)

    const html = await fetchWithRetry(storyUrl)
    const $ = cheerio.load(html)

    const title = $('h1, .manga-title, .story-title, .truyen-title').first().text().trim()
    const author = $('.author a, .tacgia, .info:contains("Tác giả") a').text().trim() || 'Unknown'
    const description = $('.description, .summary, .detail-content, .mota').text().trim()
    const cover = $('.manga-info img, .truyen-cover img, .story-cover img').first().attr('src')

    // Get tags/genres
    const tags = []
    $('.genre a, .the-loai a, a[href*="the-loai"]').each((_, el) => {
        const tagName = $(el).text().trim()
        if (tagName && tagName.length < 50) tags.push(tagName)
    })

    // Get chapter list
    const chapters = []
    $('a[href*="chapter"], .chapter-list a, .list-chapter a').each((_, el) => {
        const $el = $(el)
        const chapterTitle = $el.text().trim()
        const chapterUrl = $el.attr('href')

        const match = chapterTitle.match(/chapter\s*(\d+)|chương\s*(\d+)|ch\.?\s*(\d+)/i)
        const chapterNum = match ? parseInt(match[1] || match[2] || match[3]) : chapters.length + 1

        if (chapterUrl && chapterTitle) {
            chapters.push({
                number: chapterNum,
                title: chapterTitle,
                url: chapterUrl.startsWith('http') ? chapterUrl : `${BASE_URL}${chapterUrl}`
            })
        }
    })

    return {
        title,
        slug: createSlug(title),
        author,
        description,
        cover: cover?.startsWith('http') ? cover : `${BASE_URL}${cover}`,
        tags,
        chapters: chapters.reverse(),
        sourceUrl: storyUrl
    }
}

// Get chapter content
async function getChapterContent(chapterUrl) {
    console.log(`📄 Fetching chapter: ${chapterUrl}`)

    const html = await fetchWithRetry(chapterUrl)
    const $ = cheerio.load(html)

    // Get images for manga/manhwa
    const images = []
    $('.reading-detail img, .chapter-content img, .page-chapter img, .truyen-content img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original')
        if (src && !src.includes('logo') && !src.includes('ads') && !src.includes('icon')) {
            images.push(src.startsWith('http') ? src : `${BASE_URL}${src}`)
        }
    })

    if (images.length > 0) {
        return {
            type: 'images',
            content: images.map(img => `<img src="${img}" loading="lazy" class="chapter-image" />`).join('\n')
        }
    }

    // Text content
    const textContent = $('.chapter-content, .content-chapter, .truyen-content')
        .clone()
        .find('script, style, .ads')
        .remove()
        .end()
        .text()
        .trim()

    return {
        type: 'text',
        content: textContent.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('\n')
    }
}

// Save story to database
function saveStory(story) {
    try {
        const existing = db.prepare('SELECT id FROM stories WHERE slug = ?').get(story.slug)

        if (existing) {
            db.prepare(`
        UPDATE stories SET 
          title = ?, author = ?, cover = ?, description = ?, 
          source_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(story.title, story.author, story.cover, story.description, story.sourceUrl, existing.id)

            console.log(`✅ Updated story: ${story.title}`)
            return existing.id
        }

        const result = db.prepare(`
      INSERT INTO stories (title, slug, author, cover, description, source, source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(story.title, story.slug, story.author, story.cover, story.description, 'ztruyen', story.sourceUrl)

        const storyId = result.lastInsertRowid

        for (const tagName of story.tags) {
            const tagSlug = createSlug(tagName)
            db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)').run(tagName, tagSlug)
            const tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug)
            if (tag) {
                db.prepare('INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)').run(storyId, tag.id)
            }
        }

        console.log(`✅ Saved new story: ${story.title}`)
        return storyId
    } catch (error) {
        console.error(`❌ Error saving story: ${error.message}`)
        return null
    }
}

// Save chapter to database  
function saveChapter(storyId, chapter) {
    try {
        const existing = db.prepare(
            'SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ?'
        ).get(storyId, chapter.number)

        if (existing) {
            db.prepare(`
        UPDATE chapters SET title = ?, content = ?, source_url = ? WHERE id = ?
      `).run(chapter.title, chapter.content, chapter.url, existing.id)
        } else {
            db.prepare(`
        INSERT INTO chapters (story_id, chapter_number, title, content, source_url)
        VALUES (?, ?, ?, ?, ?)
      `).run(storyId, chapter.number, chapter.title, chapter.content, chapter.url)
        }

        return true
    } catch (error) {
        console.error(`❌ Error saving chapter: ${error.message}`)
        return false
    }
}

// Main crawler function
async function crawl(pages = 1, chaptersPerStory = 5) {
    console.log('🚀 Starting ZTruyen crawler...')

    try {
        for (let page = 1; page <= pages; page++) {
            const stories = await getStoryList(page)

            for (const story of stories) {
                try {
                    const storyDetails = await getStoryDetails(story.url)
                    const storyId = saveStory(storyDetails)

                    if (!storyId) continue

                    const chaptersToFetch = storyDetails.chapters.slice(-chaptersPerStory)

                    for (const chapter of chaptersToFetch) {
                        const chapterContent = await getChapterContent(chapter.url)
                        saveChapter(storyId, {
                            ...chapter,
                            content: chapterContent.content
                        })
                        await new Promise(r => setTimeout(r, 1500))
                    }
                } catch (error) {
                    console.error(`Error processing ${story.title}:`, error.message)
                }
                await new Promise(r => setTimeout(r, 2000))
            }
        }

        console.log('✅ Crawl complete!')
    } catch (error) {
        console.error('❌ Crawl failed:', error)
    }
}

if (process.argv[1] === __filename) {
    const pages = parseInt(process.argv[2]) || 1
    const chapters = parseInt(process.argv[3]) || 3
    crawl(pages, chapters)
}

export { crawl, getStoryList, getStoryDetails, getChapterContent }
