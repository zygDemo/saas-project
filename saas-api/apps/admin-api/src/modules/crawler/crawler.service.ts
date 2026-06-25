import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import axios from 'axios'
import * as cheerio from 'cheerio'
import * as iconv from 'iconv-lite'
import * as http from 'http'
import * as https from 'https'
import pLimit from 'p-limit'
import { PrismaService } from '../prisma/prisma.service'

interface ChapterLink {
  title: string
  link: string
}

interface CrawlerRequestOptions {
  cookie?: string
  userAgent?: string
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
  result?: {
    bookId: number
    title: string
    author: string
    totalChapters: number
    failedChapters: number
    totalWordCount: number
    cancelled?: boolean
  }
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
    if (!progress) return false
    // 已结束的任务直接清除
    if (progress.status === 'error' || progress.status === 'completed' || progress.status === 'cancelled') {
      this.clearTask(taskId)
      return true
    }
    this.cancelFlags.set(taskId, true)
    this.pauseFlags.set(taskId, false) // 如果暂停中，先解除暂停以便退出循环
    return true
  }

  /**
   * 清除任务进度记录（用于清理失败/已完成/已取消的任务）
   */
  clearTask(taskId: string): boolean {
    const existed = this.progressMap.has(taskId)
    this.progressMap.delete(taskId)
    this.cancelFlags.delete(taskId)
    this.pauseFlags.delete(taskId)
    return existed
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
    taskId?: string,
    requestOptions: CrawlerRequestOptions = {}
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
    this.logger.log(`fetchPage: ${url}`)
    let html: string
    let effectiveUrl = url
    try {
      const res = await this.fetchCatalogPageWithFallback(url, requestOptions)
      html = res.html
      effectiveUrl = res.url
      this.logger.log(`fetchPage成功: ${html.length}字, charset=${res.charset}, url=${effectiveUrl}`)
    } catch (e: unknown) {
      const errorMessage = this.normalizeErrorMessage(e)
      this.logger.error(`fetchPage失败: ${errorMessage}`)
      updateProgress({ status: 'error', message: `获取目录页失败: ${errorMessage}` })
      throw e
    }
    let $ = cheerio.load(html)

    // 检查是否有完整目录入口。很多站点首页只展示最近章节，需要跳到目录页。
    const catalogLink = this.findCatalogLink($)

    if (catalogLink) {
      const fullCatalogUrl = this.resolveUrl(catalogLink, effectiveUrl)
      if (fullCatalogUrl && fullCatalogUrl !== effectiveUrl && !this.isSameNormalizedUrl(fullCatalogUrl, effectiveUrl)) {
        this.logger.log(`发现完整目录链接: ${fullCatalogUrl}，切换中...`)
        updateProgress({ message: '正在获取完整目录...' })
        const res = await this.fetchPage(fullCatalogUrl, effectiveUrl, requestOptions)
        html = res.html
        $ = cheerio.load(html)
      }
    }

    const bookMeta = this.extractBookMeta($, effectiveUrl)

    // 自动检测书名
    if (!name) {
      name = bookMeta.title || 'Unknown_Novel'
    }

    const author = bookMeta.author
    const desc = bookMeta.desc
    const cover = bookMeta.cover

    // 2. 提取章节链接
    const chapterLinks: ChapterLink[] = this.extractChapterLinks($, effectiveUrl)

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
            const content = await this.fetchChapterContent(chapter.link, effectiveUrl, requestOptions)
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
          } catch (error: unknown) {
            retryCount++
            const errMsg = error instanceof Error ? error.message : String(error)
            this.logger.warn(
              `章节 "${chapter.title}" 下载失败 (第 ${retryCount}/${maxRetries} 次): ${errMsg}`
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
    } catch (err: unknown) {
      const errObj = err as { message?: string; cause?: { message?: string } }
      if (errObj.message === '__CANCELLED__' || errObj.cause?.message === '__CANCELLED__') {
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

  private async fetchCatalogPageWithFallback(
    url: string,
    requestOptions: CrawlerRequestOptions = {}
  ): Promise<{ html: string; charset: string; url: string }> {
    const candidates = this.buildCatalogUrlCandidates(url)
    const errors: string[] = []

    for (const candidate of candidates) {
      try {
        if (candidate !== url) {
          this.logger.warn(`目录页原地址不可用，尝试候选地址: ${candidate}`)
        }
        const res = await this.fetchPage(candidate, undefined, requestOptions)
        return { ...res, url: candidate }
      } catch (error: unknown) {
        const msg = this.normalizeErrorMessage(error)
        errors.push(`${candidate} => ${msg}`)
        if (!this.isDnsResolveError(error)) {
          throw error
        }
      }
    }

    throw new BadRequestException(
      `目录页域名无法解析或被本机 DNS 拦截，已尝试 ${candidates.length} 个地址：${errors.join('；')}`
    )
  }

  private buildCatalogUrlCandidates(url: string): string[] {
    const result: string[] = []
    const push = (value: string) => {
      if (!result.includes(value)) result.push(value)
    }

    try {
      const parsed = new URL(url)
      push(parsed.toString())

      const hosts = new Set<string>([parsed.hostname])
      if (parsed.hostname.startsWith('www.')) {
        hosts.add(parsed.hostname.slice(4))
      } else {
        hosts.add(`www.${parsed.hostname}`)
      }

      for (const host of hosts) {
        for (const protocol of [parsed.protocol, parsed.protocol === 'https:' ? 'http:' : 'https:']) {
          const candidate = new URL(parsed.toString())
          candidate.protocol = protocol
          candidate.hostname = host
          push(candidate.toString())
        }
      }
    } catch {
      push(url)
    }

    return result
  }

  private isDnsResolveError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false
    const code = error.code || ''
    const message = error.message || ''
    return ['ENOTFOUND', 'ENOENT', 'EAI_AGAIN'].includes(code) || /getaddrinfo|ENOTFOUND|ENOENT|EAI_AGAIN/i.test(message)
  }

  /**
   * 获取页面内容（自动检测编码）
   */
  private async fetchPage(
    url: string,
    referer?: string,
    requestOptions: CrawlerRequestOptions = {}
  ): Promise<{ html: string; charset: string }> {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      throw new BadRequestException('小说地址格式不正确')
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('仅支持 http/https 小说地址')
    }

    const requestHeaders: Record<string, string> = {
      'User-Agent':
        requestOptions.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      // 与历史可用 crawler copy 保持一致，部分小说站依赖常规浏览器压缩协商。
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      Referer: referer || `${parsedUrl.origin}/`
    }

    if (requestOptions.cookie?.trim()) {
      requestHeaders.Cookie = requestOptions.cookie.trim()
    }

    const response = await this.requestPageWithRetry(url, requestHeaders)

    if (!response.data || Buffer.from(response.data).length === 0) {
      throw new BadRequestException('请求目录页失败：页面响应为空')
    }

    const buffer = Buffer.from(response.data)
    const htmlPreview = buffer.toString('ascii')
    let charset = 'utf-8'

    const contentType = String(response.headers['content-type'] || '')
    const headerCharset = contentType.match(/charset=([^;\s]+)/i)?.[1]
    const metaCharset =
      htmlPreview.match(/<meta[^>]*?charset=["']?\s*([a-zA-Z0-9_-]+)/i)?.[1] ||
      htmlPreview.match(/content=["'][^"']*?charset=\s*([a-zA-Z0-9_-]+)/i)?.[1]

    charset = (headerCharset || metaCharset || charset).toLowerCase().replace(/["']/g, '').trim()
    if (['gbk', 'gb2312', 'gb18030', 'x-gbk', 'cn'].includes(charset)) {
      charset = 'gbk'
    }

    const html = charset === 'gbk' ? iconv.decode(buffer, 'gbk') : buffer.toString('utf-8')
    return { html, charset }
  }

  private async requestPageWithRetry(url: string, headers: Record<string, string>) {
    const retryableCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EAI_AGAIN', 'ENOTFOUND'])
    let lastError: unknown

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 500,
          headers,
          timeout: 20000 + attempt * 15000,
          httpAgent: new http.Agent({ family: 4, keepAlive: false }),
          httpsAgent: new https.Agent({ family: 4, keepAlive: false }),
          proxy: false
        })

        if (response.status >= 400) {
          const bodyPreview = Buffer.from(response.data || []).toString('utf-8').slice(0, 1000)
          if (response.status === 403 && /cloudflare|cf-mitigated|challenge/i.test(bodyPreview)) {
            throw new BadRequestException('目标站点启用了 Cloudflare 人机验证；请在浏览器打开目录页通过验证后，把该站点 Cookie 和 User-Agent 一起传入，或换可直接访问的镜像站/章节目录页')
          }
          throw new BadRequestException(`目标站点返回 HTTP ${response.status}${response.statusText ? ' ' + response.statusText : ''}`)
        }

        return response
      } catch (error: unknown) {
        lastError = error
        const code = axios.isAxiosError(error) ? error.code : undefined
        // DNS 解析类错误直接失败，重试也不会解出来
        const dnsFatal = ['ENOTFOUND', 'ENOENT', 'EAI_AGAIN'].includes(code || '')
        const shouldRetry = !dnsFatal && (!code || retryableCodes.has(code))
        if (!shouldRetry || attempt >= 3) break
        this.logger.warn(`请求目录页超时/失败，准备重试 ${attempt}/3: ${this.normalizeErrorMessage(error)}`)
        await this.sleep(1000 * attempt)
      }
    }

    throw new BadRequestException(`请求目录页失败：${this.normalizeErrorMessage(lastError)}`)
  }

  private findCatalogLink($: cheerio.CheerioAPI): string | undefined {
    const catalogTexts = ['全文目录', '完整目录', '章节列表', '全部章节', '查看目录', '目录']
    for (const text of catalogTexts) {
      const href = $(`a:contains("${text}")`).first().attr('href')
      if (href) return href
    }
    const href = $('a[href$="index.html"], a[href$="/index/"], a[href*="/list/"]').first().attr('href')
    return href || undefined
  }

  private extractBookMeta($: cheerio.CheerioAPI, baseUrl: string) {
    const title = this.cleanInlineText(
      $('meta[property="og:title"]').attr('content') ||
        $('meta[name="og:title"]').attr('content') ||
        $('.book-info h1, .info h1, #info h1, h1').first().text() ||
        ''
    )
    const pageText = this.cleanInlineText($('.book-info, .info, #info, .intro, .book').first().text())
    const authorText =
      $('meta[property="og:novel:author"]').attr('content') ||
      $('meta[name="author"]').attr('content') ||
      $('.author, .book-author').first().text() ||
      pageText.match(/作者[:：]\s*([^\s|/]+)/)?.[1] ||
      ''
    const desc = this.cleanInlineText(
      $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        $('#intro, .intro, .book-intro, .description, .desc').first().text() ||
        ''
    )
    const coverRaw =
      $('meta[property="og:image"]').attr('content') ||
      $('.book-img img, .cover img, #fmimg img, img[alt*="封面"]').first().attr('src') ||
      ''
    return {
      title,
      author: this.cleanInlineText(authorText).replace(/^作者[:：]\s*/, '') || '未知',
      desc,
      cover: this.resolveUrl(coverRaw, baseUrl) || coverRaw
    }
  }

  /**
   * 提取章节链接（支持多种网站结构）
   */
  private extractChapterLinks($: cheerio.CheerioAPI, baseUrl: string): ChapterLink[] {
    const chapterLinks: ChapterLink[] = []
    const selectorGroups = [
      '#list dl dd a', '#list a', '.book_list a', '.book-list a', '.chapterlist a',
      '.chapter-list a', '.list-chapter a', '#chapterList a', '.chapters a', '.catalog a',
      '.volume a', 'ul li a[href$=".html"]', 'dd a[href]'
    ]

    let listItems: cheerio.Cheerio<any> | null = null
    for (const selector of selectorGroups) {
      const items = $(selector)
      if (items.length > 0) {
        listItems = items
        break
      }
    }

    if (!listItems || listItems.length === 0) {
      let bestLinks: cheerio.Cheerio<any> | null = null
      let bestScore = 0
      $('div, dl, ul, section').each((_i, el) => {
        const links = $(el).find('a[href]')
        if (links.length < 20) return
        const text = this.cleanInlineText($(el).text())
        const navHit = /(首页|登录|注册|排行|书架|搜索|推荐|上一页|下一页)/.test(text.slice(0, 120))
        const score = links.length - (navHit ? 20 : 0)
        if (score > bestScore) {
          bestScore = score
          bestLinks = links
        }
      })
      listItems = bestLinks
    }

    if (!listItems) return chapterLinks

    listItems.each((_i, el) => {
      const link = $(el).attr('href')
      const title = this.cleanInlineText($(el).text())
      if (!link || !title || this.isNonChapterTitle(title)) return
      const fullLink = this.resolveUrl(link, baseUrl)
      if (!fullLink || !this.isLikelyChapterUrl(fullLink, baseUrl)) return
      chapterLinks.push({ title, link: fullLink })
    })

    return chapterLinks.filter((v, i, a) => a.findIndex((t) => t.link === v.link) === i)
  }

  /**
   * 获取章节内容
   */
  private async fetchChapterContent(
    url: string,
    bookUrl?: string,
    requestOptions: CrawlerRequestOptions = {}
  ): Promise<string> {
    try {
      const { html } = await this.fetchPage(url, bookUrl, requestOptions)
      const $ = cheerio.load(html)
      $('script, style, iframe, noscript, header, footer, nav, form, .header, .footer, .nav, .menu, .ads, .ad, .banner, .recommend').remove()

      const selectors = [
        '#content', '.content', '#chaptercontent', '#BookText', '.chapter-content',
        '.read-content', '.reader-content', '.article-content', '.entry-content', '#article', '#txt'
      ]
      let content = ''
      for (const selector of selectors) {
        const el = $(selector).first()
        if (!el.length) continue
        const text = this.extractReadableText(el)
        if (text.length > content.length) content = text
        if (content.length >= 80) break
      }

      if (!content || content.length < 80) {
        let maxLen = 0
        $('article, main, div, section').each((_i, el) => {
          const node = $(el)
          if (node.find('a').length > 8) return
          const text = this.extractReadableText(node)
          if (text.length > maxLen) {
            maxLen = text.length
            content = text
          }
        })
      }

      content = this.cleanChapterContent(content)
      if (!content || content.length < 50) {
        throw new Error('内容过短或未找到')
      }
      return content
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      this.logger.error(`获取章节内容失败 ${url}: ${errorMsg}`)
      throw e
    }
  }

  private extractReadableText(node: cheerio.Cheerio<any>): string {
    const html = node.html() || node.text()
    const normalizedHtml = html
      .replace(/<\s*br\s*\/?\s*>/gi, '\n')
      .replace(/<\s*\/p\s*>/gi, '\n')
      .replace(/<\s*\/div\s*>/gi, '\n')
    return cheerio.load(`<div>${normalizedHtml}</div>`).text()
  }

  private normalizeErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const statusText = error.response?.statusText
      const code = error.code
      const message = error.message
      if (['ENOTFOUND', 'ENOENT', 'EAI_AGAIN'].includes(code || '') || /getaddrinfo/i.test(message || '')) {
        return `${code || 'DNS'} / 域名解析失败，可能是域名失效、DNS 污染或本机网络拦截：${message}`
      }
      if (/0\.0\.0\.0|::/.test(message || '')) {
        return `${code || 'DNS'} / 域名解析到无效地址，可能被本机 DNS/路由器拦截：${message}`
      }
      const parts = [
        status ? `HTTP ${status}` : '',
        statusText || '',
        code || '',
        message || ''
      ].filter(Boolean)
      return parts.join(' / ') || '网络请求失败'
    }

    if (error instanceof BadRequestException) {
      const response = error.getResponse()
      if (typeof response === 'string') return response
      if (response && typeof response === 'object' && 'message' in response) {
        const message = (response as { message?: unknown }).message
        if (Array.isArray(message)) return message.join('；')
        if (message) return String(message)
      }
      return error.message || '请求参数错误'
    }

    if (error instanceof Error) {
      return error.message || error.name || '未知错误'
    }

    if (typeof error === 'string' && error.trim()) return error.trim()

    try {
      const serialized = JSON.stringify(error)
      return serialized && serialized !== '{}' ? serialized : '未知错误'
    } catch {
      return '未知错误'
    }
  }

  private cleanChapterContent(content: string): string {
    return content
      .replace(/\u00a0/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(?:本章未完.*|点击下一页继续阅读.*|请收藏本站.*|最新网址.*|手机用户请浏览.*|\(本章完\))/g, '')
      .trim()
  }

  private cleanInlineText(text: string): string {
    return (text || '').replace(/\s+/g, ' ').trim()
  }

  private resolveUrl(link: string | undefined, baseUrl: string): string | undefined {
    if (!link) return undefined
    try {
      return new URL(link.trim(), baseUrl).toString()
    } catch {
      return undefined
    }
  }

  private isSameNormalizedUrl(a: string, b: string): boolean {
    const normalize = (value: string) => value.replace(/[#?].*$/, '').replace(/\/+$/, '')
    return normalize(a) === normalize(b)
  }

  private isNonChapterTitle(title: string): boolean {
    return /^(首页|书架|登录|注册|排行|分类|目录|上一章|下一章|上一页|下一页|返回|加入书签|推荐阅读)$/i.test(title)
  }

  private isLikelyChapterUrl(link: string, baseUrl: string): boolean {
    try {
      const url = new URL(link)
      const base = new URL(baseUrl)
      if (url.origin !== base.origin) return false
      if (/\.(jpg|jpeg|png|gif|webp|css|js|zip|rar|apk)$/i.test(url.pathname)) return false
      return true
    } catch {
      return false
    }
  }

    private sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
