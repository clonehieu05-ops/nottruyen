/**
 * Crawler Scheduler - Tự động crawl truyện hàng ngày
 * Tích hợp trực tiếp vào server để chạy trên Render
 * Sử dụng NetTruyen làm nguồn (ổn định hơn TruyenQQ)
 */

import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import cron from 'node-cron'

// Danh sách các nguồn để thử (sẽ thử lần lượt nếu nguồn trước fail)
const SOURCES = [
    {
        name: 'NetTruyen',
        baseUrl: 'https://nettruyenviet.com',
        listPath: '/tim-truyen?status=-1&sort=15',
        pageParam: 'page'
    },
    {
        name: 'TruyenQQ',
        baseUrl: 'https://truyentranhqq.com',
        listPath: '/truyen-moi-cap-nhat/trang-',
        pageParam: 'path'
    }
]

let currentSource = SOURCES[0]

// Helper function to create slug
function createSlug(text) {
    if (!text) return ''
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

// Random delay to appear more human-like
function randomDelay(min = 1000, max = 3000) {
    return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)))
}

// Helper to fetch with retry and better headers
async function fetchWithRetry(url, retries = 3, referer = null) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]

    const targetUrl = new URL(url)
    const baseReferer = referer || targetUrl.origin

    for (let i = 0; i < retries; i++) {
        try {
            const ua = userAgents[Math.floor(Math.random() * userAgents.length)]

            const response = await fetch(url, {
                headers: {
                    'User-Agent': ua,
                    'Referer': baseReferer,
                    'Origin': targetUrl.origin,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'Host': targetUrl.host
                },
                timeout: 30000
            })

            if (response.ok) {
                return await response.text()
            }

            console.log(`Attempt ${i + 1}: Status ${response.status}`)
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message)
        }

        await randomDelay(2000, 5000)
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`)
}

// Get story list from NetTruyen
async function getStoryListNetTruyen(page = 1) {
    const url = `${currentSource.baseUrl}${currentSource.listPath}&page=${page}`
    console.log(`📚 Fetching: ${url}`)

    // Use currentSource.baseUrl as referer
    const html = await fetchWithRetry(url, 3, currentSource.baseUrl)
    const $ = cheerio.load(html)
    const stories = []

    // NetTruyen selectors
    $('.items .item, .list-stories .story-item, .row .item').each((_, el) => {
        const $el = $(el)
        const $link = $el.find('a').first()
        const title = $el.find('h3 a, .jtip, figcaption h3').text().trim() ||
            $el.find('a').attr('title') || ''
        const cover = $el.find('img').attr('data-original') ||
            $el.find('img').attr('src') ||
            $el.find('img').attr('data-src') || ''
        const storyUrl = $link.attr('href') || ''

        if (title && storyUrl) {
            stories.push({
                title: title.trim(),
                cover: cover.startsWith('http') ? cover : `${currentSource.baseUrl}${cover}`,
                url: storyUrl.startsWith('http') ? storyUrl : `${currentSource.baseUrl}${storyUrl}`,
                source: currentSource.name.toLowerCase()
            })
        }
    })

    console.log(`Found ${stories.length} stories on page ${page}`)
    return stories
}

// Get story details
async function getStoryDetails(storyUrl) {
    console.log(`📖 Fetching story details: ${storyUrl}`)

    await randomDelay(1000, 2000)
    // Use the storyUrl itself or baseUrl as Referer
    const html = await fetchWithRetry(storyUrl, 3, currentSource.baseUrl)
    const $ = cheerio.load(html)

    // Try multiple selectors for title
    const title = $('h1.title-detail, h1.truyen-title, .title-manga, h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') || 'Unknown'

    // Author
    const author = $('.author p:last-child, .author a, .info-holder .row:contains("Tác giả") a, li.author a').text().trim() || 'Unknown'

    // Description
    const description = $('.detail-content p, .story-detail-info, .summary-content, .desc-text').text().trim()

    // Cover
    const cover = $('.detail-info img, .book-avatar img, .col-image img').attr('src') ||
        $('.detail-info img, .book-avatar img, .col-image img').attr('data-original') ||
        $('meta[property="og:image"]').attr('content') || ''

    // Tags
    const tags = []
    $('.kind a, .genres a, .list-info .row:contains("Thể loại") a, li.kind a').each((_, el) => {
        const tagName = $(el).text().trim()
        if (tagName && !tagName.includes('Thể loại')) tags.push(tagName)
    })

    // Chapters
    const chapters = []
    $('#nt_listchapter ul li a, .list-chapter a, #list-chapter a, nav.chapter-box li a').each((_, el) => {
        const $el = $(el)
        const chapterTitle = $el.text().trim()
        const chapterUrl = $el.attr('href')

        if (!chapterUrl || chapterTitle.includes('Mới nhất')) return

        // Extract chapter number
        const match = chapterTitle.match(/chapter\s*(\d+)|chương\s*(\d+)|ch\.?\s*(\d+)|chap\s*(\d+)/i)
        const chapterNum = match ? parseInt(match[1] || match[2] || match[3] || match[4]) : chapters.length + 1

        chapters.push({
            number: chapterNum,
            title: chapterTitle,
            url: chapterUrl.startsWith('http') ? chapterUrl : `${currentSource.baseUrl}${chapterUrl}`
        })
    })

    return {
        title,
        slug: createSlug(title),
        author,
        description: description.substring(0, 2000), // Limit description length
        cover: cover.startsWith('http') ? cover : `${currentSource.baseUrl}${cover}`,
        tags: tags.slice(0, 10), // Limit tags
        chapters: chapters.reverse().slice(0, 100), // Oldest first, limit to 100
        sourceUrl: storyUrl
    }
}

// Get chapter content (images for manga)
async function getChapterContent(chapterUrl) {
    console.log(`📄 Fetching chapter: ${chapterUrl}`)

    await randomDelay(1000, 2000)
    // Use Base URL or Story URL would be better, but baseUrl is safe
    const html = await fetchWithRetry(chapterUrl, 3, currentSource.baseUrl)
    const $ = cheerio.load(html)

    // Get images
    const images = []
    $('.page-chapter img, .reading-detail img, #nt_content img, .content-chapter img, .chapter-content img').each((_, el) => {
        const src = $(el).attr('data-original') || $(el).attr('src') || $(el).attr('data-src')
        if (src && !src.includes('logo') && !src.includes('banner')) {
            const imgUrl = src.startsWith('http') ? src : `${currentSource.baseUrl}${src}`
            images.push(imgUrl)
        }
    })

    if (images.length > 0) {
        return {
            type: 'images',
            content: images.map(img => `<img src="${img}" loading="lazy" referrerpolicy="no-referrer" />`).join('\n')
        }
    }

    // Fallback to text content
    const textContent = $('.chapter-content, .content-chapter, #chapter-content')
        .text()
        .trim()

    return {
        type: 'text',
        content: textContent ? `<p>${textContent}</p>` : '<p>Không có nội dung</p>'
    }
}

// Save story to database
function saveStory(db, story) {
    try {
        const existing = db.prepare('SELECT id FROM stories WHERE slug = ?').get(story.slug)

        if (existing) {
            db.prepare(`
                UPDATE stories SET 
                    title = ?, author = ?, cover = ?, description = ?, 
                    source_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(story.title, story.author, story.cover, story.description, story.sourceUrl, existing.id)

            console.log(`✅ Updated: ${story.title}`)
            return existing.id
        }

        const result = db.prepare(`
            INSERT INTO stories (title, slug, author, cover, description, source, source_url, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            story.title,
            story.slug,
            story.author,
            story.cover,
            story.description,
            currentSource.name.toLowerCase(),
            story.sourceUrl,
            (Math.random() * 1.5 + 3.5).toFixed(1) // Random rating 3.5-5.0
        )

        const storyId = result.lastInsertRowid

        // Insert tags
        for (const tagName of story.tags) {
            const tagSlug = createSlug(tagName)
            if (!tagSlug) continue

            db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)').run(tagName, tagSlug)
            const tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug)

            if (tag) {
                db.prepare('INSERT OR IGNORE INTO story_tags (story_id, tag_id) VALUES (?, ?)').run(storyId, tag.id)
            }
        }

        console.log(`✅ Saved: ${story.title}`)
        return storyId
    } catch (error) {
        console.error(`❌ Error saving story: ${error.message}`)
        return null
    }
}

// Save chapter to database
function saveChapter(db, storyId, chapter) {
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
async function runCrawl(db, pages = 1, chaptersPerStory = 3) {
    console.log('🚀 Starting auto crawler...')
    console.log(`Source: ${currentSource.name}`)
    console.log(`Will crawl ${pages} page(s), ${chaptersPerStory} chapters per story`)

    let crawledCount = 0
    let errorCount = 0

    try {
        for (let page = 1; page <= pages; page++) {
            console.log(`\n--- Page ${page}/${pages} ---`)

            let stories = []
            try {
                stories = await getStoryListNetTruyen(page)
            } catch (err) {
                console.error(`Failed to get story list page ${page}:`, err.message)
                // Try switching source
                const currentIndex = SOURCES.indexOf(currentSource)
                if (currentIndex < SOURCES.length - 1) {
                    currentSource = SOURCES[currentIndex + 1]
                    console.log(`🔄 Switching to ${currentSource.name}...`)
                    try {
                        stories = await getStoryListNetTruyen(page)
                    } catch (e) {
                        console.error(`All sources failed, skipping page ${page}`)
                        continue
                    }
                }
            }

            for (const story of stories) {
                try {
                    await randomDelay(2000, 4000)

                    const storyDetails = await getStoryDetails(story.url)
                    const storyId = saveStory(db, storyDetails)

                    if (!storyId) continue

                    // Get limited chapters
                    const chaptersToFetch = storyDetails.chapters.slice(-chaptersPerStory)

                    for (const chapter of chaptersToFetch) {
                        try {
                            const chapterContent = await getChapterContent(chapter.url)
                            saveChapter(db, storyId, {
                                ...chapter,
                                content: chapterContent.content
                            })
                        } catch (chapterError) {
                            console.error(`  Error fetching chapter ${chapter.number}:`, chapterError.message)
                        }

                        await randomDelay(1500, 3000)
                    }

                    crawledCount++
                    console.log(`  Progress: ${crawledCount} stories crawled`)
                } catch (error) {
                    console.error(`Error processing ${story.title}:`, error.message)
                    errorCount++
                }

                await randomDelay(2000, 4000)
            }
        }

        console.log(`\n✅ Crawl complete! Crawled: ${crawledCount}, Errors: ${errorCount}`)
        return { crawledCount, errorCount }
    } catch (error) {
        console.error('❌ Crawl failed:', error)
        throw error
    }
}

// Track crawler status
let crawlerStatus = {
    isRunning: false,
    lastRun: null,
    lastResult: null,
    nextScheduled: null,
    currentSource: null
}

// Setup scheduler
function setupCrawlerScheduler(db) {
    const schedule = process.env.CRAWL_SCHEDULE || '0 3 * * *'
    console.log(`📅 Crawler scheduled: ${schedule}`)

    cron.schedule(schedule, async () => {
        if (crawlerStatus.isRunning) {
            console.log('⏳ Crawler already running, skipping...')
            return
        }

        console.log('⏰ Running scheduled crawl...')
        crawlerStatus.isRunning = true
        crawlerStatus.lastRun = new Date().toISOString()
        crawlerStatus.currentSource = currentSource.name

        try {
            const pages = parseInt(process.env.CRAWL_PAGES) || 2
            const chapters = parseInt(process.env.CRAWL_CHAPTERS) || 3

            const result = await runCrawl(db, pages, chapters)
            crawlerStatus.lastResult = { success: true, ...result }
        } catch (error) {
            crawlerStatus.lastResult = { success: false, error: error.message }
        } finally {
            crawlerStatus.isRunning = false
        }
    })

    crawlerStatus.nextScheduled = 'Daily at 3:00 AM UTC (10:00 AM Vietnam)'
}

// Manual trigger
async function triggerCrawl(db, pages = 1, chapters = 3) {
    if (crawlerStatus.isRunning) {
        throw new Error('Crawler is already running')
    }

    crawlerStatus.isRunning = true
    crawlerStatus.lastRun = new Date().toISOString()
    crawlerStatus.currentSource = currentSource.name

    try {
        const result = await runCrawl(db, pages, chapters)
        crawlerStatus.lastResult = { success: true, ...result }
        return result
    } catch (error) {
        crawlerStatus.lastResult = { success: false, error: error.message }
        throw error
    } finally {
        crawlerStatus.isRunning = false
    }
}

// Get status
function getCrawlerStatus() {
    return {
        ...crawlerStatus,
        availableSources: SOURCES.map(s => s.name)
    }
}

export { setupCrawlerScheduler, triggerCrawl, getCrawlerStatus }
