import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import axios from 'axios'
import * as cheerio from 'cheerio'
import * as iconv from 'iconv-lite'
import pLimit from 'p-limit'
import { PrismaService } from '../prisma/prisma.service'

interface ChapterLink {
  title: string
  link: string
}

export interface CrawlProgress {
  status: 'preparing' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled'
  currentChapter: number
  totalChapters: number
  currentChapterTitle: string
  completedChapters: number
  failedChapters: number
  totalWordCount: number
  message: string
  result?: any
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name)
  private progressMap = new Map<string, CrawlProgress>()
  private cancelFlags = new Map<string, boolean>()
  private pauseFlags = new Map<string, boolean>()

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取进度
   */
  getProgress(taskId: string): CrawlProgress | null {
    return this.progressMap.get(taskId) || null
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    const progress = this.progressMap.get(taskId)
    if (!progress || progress.status !== 'downloading') return false
    this.pauseFlags.set(taskId, true)
    progress.status = 'paused'
    progress.message = '任务已暂停'
    return true
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId: string): boolean {
    const progress = this.progressMap.get(taskId)
    if (!progress || progress.status !== 'paused') return false
    this.pauseFlags.set(taskId, false)
    progress.status = 'downloading'
    progress.message = '任务已恢复...'
    return true
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const progress = this.progressMap.get(taskId)
    if (!progress || progress.status === 'completed' || progress.status === 'cancelled') return false
    this.cancelFlags.set(taskId, true)
    this.pauseFlags.set(taskId, false) // 如果暂停中，先解除暂停以便退出循环
    return true
  }

  /**
   * 下载小说并写入数据库（带进度）
   */
  async downloadNovel(
    tenantId: number,
    url: string,
    name?: string,
    startChapter?: number,
    endChapter?: number,
    categoryId?: number,
    taskId?: string
  ) {
    const progressKey = taskId || `task_${Date.now()}`
    
    const updateProgress = (data: Partial<CrawlProgress>) => {
      // 检查取消标志
      if (this.cancelFlags.get(progressKey)) {
        data.status = 'cancelled'
        data.message = '任务已取消'
        const current = this.progressMap.get(progressKey) || {
          status: 'cancelled' as const,
          currentChapter: 0,
          totalChapters: 0,
          currentChapterTitle: '',
          completedChapters: 0,
          failedChapters: 0,
          totalWordCount: 0,
          message: '任务已取消'
        }
        this.progressMap.set(progressKey, { ...current, ...data })
        throw new Error('__CANCELLED__')
      }
      const current = this.progressMap.get(progressKey) || {
        status: 'preparing' as const,
        currentChapter: 0,
        totalChapters: 0,
        currentChapterTitle: '',
        completedChapters: 0,
        failedChapters: 0,
        totalWordCount: 0,
        message: ''
      }
      this.progressMap.set(progressKey, { ...current, ...data })
    }

    updateProgress({ status: 'preparing', message: '正在获取目录页...' })

    this.logger.log(`开始爬取: ${url}`)

    // 1. 获取目录页
    let { html } = await this.fetchPage(url)
    let $ = cheerio.load(html)

    // 检查是否有"全文目录"链接
    const catalogLink =
      $('a:contains("全文目录")').attr('href') ||
      $('a:contains("完整目录")').attr('href') ||
      $('a:contains("章节列表")').attr('href')

    if (catalogLink) {
      const fullCatalogUrl = new URL(catalogLink, url).toString()
      if (fullCatalogUrl !== url && !url.includes('index.html')) {
        this.logger.log(`发现完整目录链接: ${fullCatalogUrl}，切换中...`)
        updateProgress({ message: '正在获取完整目录...' })
        const res = await this.fetchPage(fullCatalogUrl)
        html = res.html
        $ = cheerio.load(html)
      }
    }

    // 自动检测书名
    if (!name) {
      name =
        $('meta[property="og:title"]').attr('content') ||
        $('h1').first().text().trim() ||
        'Unknown_Novel'
    }

    // 尝试提取作者
    const author =
      $('meta[property="og:novel:author"]').attr('content') ||
      $('meta[name="author"]').attr('content') ||
      ''

    // 尝试提取简介
    const desc =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''

    // 尝试提取封面
    const cover = $('meta[property="og:image"]').attr('content') || ''

    // 2. 提取章节链接
    const chapterLinks: ChapterLink[] = this.extractChapterLinks($, url)

    // 去重
    let uniqueChapters = chapterLinks.filter(
      (v, i, a) => a.findIndex((t) => t.link === v.link) === i
    )

    if (uniqueChapters.length === 0) {
      this.progressMap.delete(progressKey)
      throw new BadRequestException('未找到章节列表，请确认链接正确或网站结构暂不支持')
    }

    // 3. 处理章节范围
    const total = uniqueChapters.length
    let start = 0
    let end = total

    if (startChapter && startChapter > 0) {
      start = startChapter - 1
    }
    if (endChapter && endChapter > 0 && endChapter <= total) {
      end = endChapter
    }

    if (start >= total || start >= end) {
      this.progressMap.delete(progressKey)
      throw new BadRequestException(`章节范围无效，总章节数: ${total}`)
    }

    uniqueChapters = uniqueChapters.slice(start, end)

    this.logger.log(
      `共找到 ${total} 章，准备下载 ${uniqueChapters.length} 章 (${start + 1} - ${end})，书名: ${name}`
    )

    updateProgress({
      status: 'downloading',
      totalChapters: uniqueChapters.length,
      message: `共 ${uniqueChapters.length} 章，开始下载...`
    })

    // 4. 创建书籍记录
    const book = await this.prisma.book.create({
      data: {
        tenantId,
        title: name,
        author: author || '未知',
        cover,
        desc,
        categoryId: categoryId || undefined,
        wordCount: 0,
        chapterCount: uniqueChapters.length,
        isFree: true,
        isSerial: true
      }
    })

    this.logger.log(`书籍记录已创建: id=${book.id}, title=${book.title}`)

    // 5. 并发下载章节内容
    const limit = pLimit(3)
    let completedCount = 0
    let totalWordCount = 0
    let failedCount = 0

    // 等待暂停恢复的辅助函数
    const waitIfPaused = async () => {
      while (this.pauseFlags.get(progressKey)) {
        await this.sleep(500)
        // 暂停期间也检查取消
        if (this.cancelFlags.get(progressKey)) {
          throw new Error('__CANCELLED__')
        }
      }
    }

    const tasks = uniqueChapters.map((chapter, index) => {
      return limit(async () => {
        // 检查暂停
        await waitIfPaused()

        // 随机延迟，避免被封
        await this.sleep(500 + Math.random() * 1000)

        // 再次检查暂停
        await waitIfPaused()

        updateProgress({
          currentChapter: start + index + 1,
          currentChapterTitle: chapter.title,
          message: `正在下载: ${chapter.title}`
        })

        const maxRetries = 3
        let retryCount = 0
        while (retryCount < maxRetries) {
          try {
            const content = await this.fetchChapterContent(chapter.link)
            const wordCount = content.length
            totalWordCount += wordCount

            // 写入章节记录
            await this.prisma.bookChapter.create({
              data: {
                tenantId,
                bookId: book.id,
                title: chapter.title,
                content,
                wordCount,
                sort: start + index + 1,
                isVip: false,
                price: 0
              }
            })

            completedCount++
            updateProgress({
              completedChapters: completedCount,
              totalWordCount,
              message: `已完成 ${completedCount}/${uniqueChapters.length}`
            })

            if (completedCount % 20 === 0 || completedCount === uniqueChapters.length) {
              this.logger.log(`下载进度: ${completedCount}/${uniqueChapters.length}`)
              // 更新书籍字数
              await this.prisma.book.update({
                where: { id: book.id },
                data: { wordCount: totalWordCount }
              })
            }
            return
          } catch (error: any) {
            retryCount++
            this.logger.warn(
              `章节 "${chapter.title}" 下载失败 (第 ${retryCount}/${maxRetries} 次): ${error.message}`
            )
            if (retryCount >= maxRetries) {
              this.logger.error(`章节 "${chapter.title}" 永久下载失败`)
              failedCount++
              updateProgress({
                failedChapters: failedCount,
                message: `章节 "${chapter.title}" 下载失败`
              })
              // 创建失败占位章节
              await this.prisma.bookChapter.create({
                data: {
                  tenantId,
                  bookId: book.id,
                  title: chapter.title,
                  content: '[下载失败，请手动补充]',
                  wordCount: 0,
                  sort: start + index + 1,
                  isVip: false,
                  price: 0
                }
              })
            } else {
              await this.sleep(1000 * retryCount)
            }
          }
        }
      })
    })

    try {
      await Promise.all(tasks)
    } catch (err: any) {
      if (err.message === '__CANCELLED__' || err?.cause?.message === '__CANCELLED__') {
        // 任务被取消
        this.logger.log(`任务 ${progressKey} 已被取消`)
        this.cancelFlags.delete(progressKey)
        this.pauseFlags.delete(progressKey)
        // 更新已下载的书籍章节计数
        const finalChapters = await this.prisma.bookChapter.count({ where: { bookId: book.id } })
        await this.prisma.book.update({
          where: { id: book.id },
          data: { wordCount: totalWordCount, chapterCount: finalChapters }
        })
        updateProgress({
          status: 'cancelled',
          completedChapters: completedCount,
          failedChapters: failedCount,
          totalWordCount,
          message: `任务已取消，已完成 ${completedCount} 章`,
          result: {
            bookId: book.id,
            title: book.title,
            author: book.author,
            totalChapters: completedCount,
            failedChapters: failedCount,
            totalWordCount,
            cancelled: true
          }
        })
        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          totalChapters: completedCount,
          failedChapters: failedCount,
          totalWordCount,
          cancelled: true
        }
      }
      throw err
    }

    this.cancelFlags.delete(progressKey)
    this.pauseFlags.delete(progressKey)

    // 6. 最终更新书籍统计
    await this.prisma.book.update({
      where: { id: book.id },
      data: {
        wordCount: totalWordCount,
        chapterCount: uniqueChapters.length
      }
    })

    this.logger.log(
      `下载完成: ${book.title}，共 ${uniqueChapters.length} 章，${failedCount} 章失败，总字数 ${totalWordCount}`
    )

    const result = {
      bookId: book.id,
      title: book.title,
      author: book.author,
      totalChapters: uniqueChapters.length,
      failedChapters: failedCount,
      totalWordCount
    }

    updateProgress({
      status: 'completed',
      completedChapters: completedCount,
      failedChapters: failedCount,
      totalWordCount,
      message: '下载完成！',
      result
    })

    // 5分钟后清理进度数据
    setTimeout(() => {
      this.progressMap.delete(progressKey)
    }, 5 * 60 * 1000)

    return result
  }

  /**
   * 获取页面内容（自动检测编码）
   */
  private async fetchPage(url: string): Promise<{ html: string; charset: string }> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        Referer: new URL(url).origin + '/'
      },
      timeout: 15000
    })

    const htmlPreview = response.data.toString('ascii')
    let charset = 'utf-8'

    // 检测编码
    const contentType = String(response.headers['content-type'] || '')
    if (contentType && contentType.includes('charset=')) {
      charset = contentType.split('charset=')[1].trim()
    } else {
      const metaMatch =
        htmlPreview.match(/<meta[^>]*?charset=["']?([a-zA-Z0-9-]+)["']?/i) ||
        htmlPreview.match(/content=["'][^"']*?charset=([a-zA-Z0-9-]+)[^"']*?["']/i)
      if (metaMatch && metaMatch[1]) {
        charset = metaMatch[1].toLowerCase()
      }
    }

    if (['gbk', 'gb2312', 'gb18030', 'cn'].includes(charset)) {
      charset = 'gbk'
    }

    let html = ''
    if (charset === 'gbk') {
      html = iconv.decode(response.data, 'gbk')
    } else {
      html = response.data.toString('utf-8')
    }

    return { html, charset }
  }

  /**
   * 提取章节链接（支持多种网站结构）
   */
  private extractChapterLinks($: cheerio.CheerioAPI, baseUrl: string): ChapterLink[] {
    const chapterLinks: ChapterLink[] = []

    // 策略1: #list dl dd a（笔趣阁等常见模板）
    let listItems = $('#list dl dd a')

    // 策略2: .book_list a
    if (listItems.length === 0) {
      listItems = $('.book_list a')
    }

    // 策略3: .chapterlist a
    if (listItems.length === 0) {
      listItems = $('.chapterlist a')
    }

    // 策略4: .list-chapter a
    if (listItems.length === 0) {
      listItems = $('.list-chapter a')
    }

    // 策略5: #chapterList a
    if (listItems.length === 0) {
      listItems = $('#chapterList a')
    }

    // 策略6: 回退 - 找包含最多链接的容器
    if (listItems.length === 0) {
      $('div').each((_i, el) => {
        const links = $(el).find('a')
        if (links.length > 50) {
          listItems = links
          return false
        }
      })
    }

    listItems.each((_i, el) => {
      const link = $(el).attr('href')
      const title = $(el).text().trim()
      if (link && title) {
        try {
          const fullLink = new URL(link, baseUrl).toString()
          chapterLinks.push({ title, link: fullLink })
        } catch {
          // 忽略无效链接
        }
      }
    })

    return chapterLinks
  }

  /**
   * 获取章节内容
   */
  private async fetchChapterContent(url: string): Promise<string> {
    try {
      const { html } = await this.fetchPage(url)
      const $ = cheerio.load(html)

      // 常见内容选择器
      let content = $('#content').text()
      if (!content || content.length < 50) {
        content = $('.content').text()
      }
      if (!content || content.length < 50) {
        content = $('#chaptercontent').text()
      }
      if (!content || content.length < 50) {
        content = $('#BookText').text()
      }
      if (!content || content.length < 50) {
        content = $('.chapter-content').text()
      }
      if (!content || content.length < 50) {
        content = $('.read-content').text()
      }

      // 回退: 找文字最多的 div
      if (!content || content.length < 50) {
        let maxLen = 0
        $('div').each((_i, el) => {
          if ($(el).find('a').length > 5) return
          const text = $(el).text()
          if (text.length > maxLen) {
            maxLen = text.length
            content = text
          }
        })
      }

      if (!content || content.length < 50) {
        throw new Error('内容过短或未找到')
      }

      return content
        .replace(/&nbsp;/g, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim()
    } catch (e: any) {
      this.logger.error(`获取章节内容失败 ${url}: ${e.message}`)
      throw e
    }
  }

    private sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
