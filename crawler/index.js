/**
 * TruyệnHub Crawler - Main Index
 * Unified crawler interface for multiple sources
 */

import { crawl as crawlTruyenQQ } from './sources/truyenqq.js'
import { crawl as crawlHoneyMoon } from './sources/honeymoontrust.js'
import { crawl as crawlZTruyen } from './sources/ztruyen.js'

const crawlers = {
    truyenqq: crawlTruyenQQ,
    honeymoontrust: crawlHoneyMoon,
    ztruyen: crawlZTruyen
}

async function runCrawler(source, pages = 1, chaptersPerStory = 5) {
    if (source === 'all') {
        console.log('🚀 Running all crawlers...')

        for (const [name, crawl] of Object.entries(crawlers)) {
            console.log(`\n${'='.repeat(50)}`)
            console.log(`Starting ${name} crawler...`)
            console.log('='.repeat(50))

            try {
                await crawl(pages, chaptersPerStory)
            } catch (error) {
                console.error(`${name} crawler failed:`, error.message)
            }

            // Wait between sources
            await new Promise(r => setTimeout(r, 5000))
        }
    } else if (crawlers[source]) {
        await crawlers[source](pages, chaptersPerStory)
    } else {
        console.error(`Unknown source: ${source}`)
        console.log('Available sources:', Object.keys(crawlers).join(', '))
    }
}

// CLI interface
const args = process.argv.slice(2)
const source = args[0] || 'all'
const pages = parseInt(args[1]) || 1
const chapters = parseInt(args[2]) || 3

console.log(`
╔════════════════════════════════════════════╗
║       TruyệnHub Crawler v1.0               ║
╠════════════════════════════════════════════╣
║ Source:  ${source.padEnd(32)} ║
║ Pages:   ${String(pages).padEnd(32)} ║
║ Chapters per story: ${String(chapters).padEnd(21)} ║
╚════════════════════════════════════════════╝
`)

runCrawler(source, pages, chapters)
    .then(() => {
        console.log('\n✅ All crawlers finished!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error)
        process.exit(1)
    })
