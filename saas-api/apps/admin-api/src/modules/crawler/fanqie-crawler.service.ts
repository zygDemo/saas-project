import { Injectable, Logger, BadRequestException, OnModuleDestroy } from '@nestjs/common'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { PrismaService } from '../prisma/prisma.service'

let pw: typeof import('playwright')
try { pw = require('playwright') } catch { /* 按需安装 */ }

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0 Safari/537.36',
}

export interface CrawlProgress {
  status: 'preparing' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled'
  currentChapter: number; totalChapters: number; currentChapterTitle: string
  completedChapters: number; failedChapters: number; totalWordCount: number; message: string
  result?: { bookId: number; title: string; author: string; totalChapters: number; failedChapters: number; totalWordCount: number }
}

@Injectable()
export class FanqieCrawlerService implements OnModuleDestroy {
  private readonly logger = new Logger(FanqieCrawlerService.name)
  private progressMap = new Map<string, CrawlProgress>()
  private cancelFlags = new Map<string, boolean>()
  private pauseFlags = new Map<string, boolean>()
  private browser: import('playwright').Browser | null = null

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() { await this.browser?.close() }

  private async getBrowser() {
    if (!this.browser) {
      if (!pw) throw new Error('请安装 playwright: pnpm add playwright -w --filter admin-api && npx playwright install chromium')
      this.browser = await pw.chromium.launch({ headless: true, args: ['--no-sandbox'] })
      this.logger.log('Playwright 浏览器已启动')
    }
    return this.browser
  }

  getProgress(taskId: string) { return this.progressMap.get(taskId) || null }

  pauseTask(taskId: string) {
    const p = this.progressMap.get(taskId)
    if (!p || p.status !== 'downloading') return false
    this.pauseFlags.set(taskId, true); p.status = 'paused'; return true
  }

  resumeTask(taskId: string) {
    const p = this.progressMap.get(taskId)
    if (!p || p.status !== 'paused') return false
    this.pauseFlags.set(taskId, false); p.status = 'downloading'; return true
  }

  cancelTask(taskId: string) {
    const p = this.progressMap.get(taskId)
    if (!p) return false
    if (['error', 'completed', 'cancelled'].includes(p.status)) {
      this.clearTask(taskId)
      return true
    }
    this.cancelFlags.set(taskId, true); this.pauseFlags.set(taskId, false); return true
  }

  clearTask(taskId: string): boolean {
    const existed = this.progressMap.has(taskId)
    this.progressMap.delete(taskId)
    this.cancelFlags.delete(taskId)
    this.pauseFlags.delete(taskId)
    return existed
  }

  private parseBookId(url: string): string {
    const m = url.match(/(\d{15,})/)
    if (!m) throw new BadRequestException('URL中未找到小说ID')
    return m[1]
  }

  /** Playwright 渲染阅读页，提取可见文字 */
  private async fetchChapterContent(chapterId: string) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto(`https://fanqienovel.com/reader/${chapterId}`, { waitUntil: 'networkidle', timeout: 20000 })
      // 等正文渲染
      await page.waitForSelector('[class*="content"] p, .muye-reader-content', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(1000)

      const result = await page.evaluate(() => {
        // 从 SSR 数据取元信息
        const state = (window as any).__INITIAL_STATE__
        const cd = state?.reader?.chapterData || {}

        // 从 DOM 取渲染后的可见文字（字体已解密）
        const selectors = ['.muye-reader-content p', '[class*="reader-content"] p', 'article p', '.content p']
        let text = ''
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel)
          if (els.length > 0) {
            text = Array.from(els).map(p => (p as HTMLElement).innerText.trim()).filter(Boolean).join('\n\n')
            if (text.length > 50) break
          }
        }
        return { text, title: cd.title || '', bookName: cd.bookName || '', author: cd.author || '' }
      })

      if (!result.text || result.text.length < 50) throw new Error('内容过短')
      return result
    } finally {
      await page.close()
    }
  }

  async getBookInfo(bookId: string) {
    const resp = await axios.get(`https://fanqienovel.com/page/${bookId}`, { headers: HEADERS, timeout: 15000 })
    const $ = cheerio.load(resp.data)
    const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || ''
    const author = $('meta[property="og:novel:author"]').attr('content') || ''
    const desc = $('meta[property="og:description"]').attr('content') || ''
    const cover = $('meta[property="og:image"]').attr('content') || ''
    const apiResp = await axios.get(`https://fanqienovel.com/api/reader/directory/detail?bookId=${bookId}`, { headers: HEADERS, timeout: 15000 })
    return { title, author, desc, cover, chapterIds: (apiResp.data?.data?.allItemIds || []) as string[] }
  }

  async downloadNovel(tenantId: number, url: string, name?: string, startChapter?: number, endChapter?: number, categoryId?: number, taskId?: string) {
    const key = taskId || `fanqie_${Date.now()}`
    const update = (d: Partial<CrawlProgress>) => {
      if (this.cancelFlags.get(key)) throw new Error('__CANCELLED__')
      const cur = this.progressMap.get(key) || {
        status: 'preparing' as const, currentChapter: 0, totalChapters: 0, currentChapterTitle: '',
        completedChapters: 0, failedChapters: 0, totalWordCount: 0, message: '',
      }
      this.progressMap.set(key, { ...cur, ...d })
    }

    try {
      const bookId = this.parseBookId(url)
      update({ status: 'preparing', message: '获取小说信息...' })
      const info = await this.getBookInfo(bookId)
      const title = name || info.title
      this.logger.log(`番茄: ${title}, ${info.chapterIds.length}章`)

      let ids = info.chapterIds
      const start = startChapter ? startChapter - 1 : 0
      const end = endChapter || ids.length
      if (start >= ids.length) throw new BadRequestException('起始章节超出范围')
      ids = ids.slice(start, end)
      update({ status: 'downloading', totalChapters: ids.length, message: '开始下载...' })

      const book = await this.prisma.book.create({
        data: { tenantId, title, author: info.author || '未知', cover: info.cover, desc: info.desc,
          categoryId: categoryId || undefined, wordCount: 0, chapterCount: ids.length, isFree: true, isSerial: true },
      })

      let completed = 0, failed = 0, totalWords = 0

      for (let i = 0; i < ids.length; i++) {
        while (this.pauseFlags.get(key)) {
          await new Promise(r => setTimeout(r, 500))
          if (this.cancelFlags.get(key)) throw new Error('__CANCELLED__')
        }
        const num = start + i + 1
        update({ currentChapter: num, message: `下载第${num}章...` })

        for (let retry = 0; retry < 3; retry++) {
          try {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 1000))
            const result = await this.fetchChapterContent(ids[i])
            await this.prisma.bookChapter.create({
              data: { tenantId, bookId: book.id, title: result.title || `第${num}章`,
                content: result.text, wordCount: result.text.length, sort: num, isVip: false, price: 0 },
            })
            completed++; totalWords += result.text.length
            update({ completedChapters: completed, totalWordCount: totalWords, currentChapterTitle: result.title,
              message: `已完成 ${completed}/${ids.length}` })
            if (completed % 20 === 0) await this.prisma.book.update({ where: { id: book.id }, data: { wordCount: totalWords } })
            break
          } catch (err: any) {
            if (err.message === '__CANCELLED__') throw err
            if (retry >= 2) {
              failed++; completed++
              await this.prisma.bookChapter.create({
                data: { tenantId, bookId: book.id, title: `第${num}章`, content: '[下载失败]', wordCount: 0, sort: num, isVip: false, price: 0 },
              })
              update({ failedChapters: failed, completedChapters: completed })
            } else { await new Promise(r => setTimeout(r, 2000 * (retry + 1))) }
          }
        }
      }

      await this.prisma.book.update({ where: { id: book.id }, data: { wordCount: totalWords, chapterCount: ids.length } })
      const result = { bookId: book.id, title: book.title, author: book.author, totalChapters: ids.length, failedChapters: failed, totalWordCount: totalWords }
      update({ status: 'completed', message: '下载完成！', result })
      setTimeout(() => this.progressMap.delete(key), 5 * 60 * 1000)
      return result
    } catch (err: any) {
      if (err.message === '__CANCELLED__') {
        update({ status: 'cancelled', message: '已取消' })
        this.cancelFlags.delete(key); this.pauseFlags.delete(key)
        return { cancelled: true }
      }
      update({ status: 'error', message: err.message })
      throw err
    }
  }
}
