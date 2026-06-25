import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import * as fs from 'fs';
import * as path from 'path';
import pLimit from 'p-limit';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly saveDir = path.join(process.cwd(), 'uploads', 'novels');

  constructor() {
    if (!fs.existsSync(this.saveDir)) {
      fs.mkdirSync(this.saveDir, { recursive: true });
    }
  }

  async downloadNovel(
    url: string,
    name?: string,
    startChapter?: number,
    endChapter?: number,
  ) {
    this.logger.log(`Start crawling: ${url}`);

    // 1. Fetch Table of Contents
    let { html } = await this.fetchPage(url);
    let $ = cheerio.load(html);

    // Check if there is a "Full Catalog" link (common in some templates)
    // e.g. "全文目录", "完整目录", or link to "index.html" when on info page
    const catalogLink =
      $('a:contains("全文目录")').attr('href') ||
      $('a:contains("完整目录")').attr('href') ||
      $('a:contains("章节列表")').attr('href');

    if (catalogLink) {
      const fullCatalogUrl = new URL(catalogLink, url).toString();
      if (fullCatalogUrl !== url && !url.includes('index.html')) {
        this.logger.log(
          `Found full catalog link: ${fullCatalogUrl}, switching...`,
        );
        const res = await this.fetchPage(fullCatalogUrl);
        html = res.html;
        $ = cheerio.load(html);
      }
    }

    // Try to detect book name if not provided
    if (!name) {
      name =
        $('meta[property="og:title"]').attr('content') ||
        $('h1').text().trim() ||
        'Unknown_Novel';
    }
    // Sanitize filename
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_').trim();

    // 2. Extract Chapter Links
    const chapterLinks: { title: string; link: string }[] = [];

    // Strategy 1: Look for list dl dd a (common in bishenge, biquge)
    let listItems = $('#list dl dd a');

    // Strategy 2: .book_list a
    if (listItems.length === 0) {
      listItems = $('.book_list a');
    }

    // Strategy 3: .chapterlist a
    if (listItems.length === 0) {
      listItems = $('.chapterlist a');
    }

    // Strategy 4: Fallback - find the container with most links
    if (listItems.length === 0) {
      // This is a naive heuristic
      // Find div that contains > 50 links
      $('div').each((i, el) => {
        const links = $(el).find('a');
        if (links.length > 50) {
          listItems = links;
          return false; // break
        }
      });
    }

    listItems.each((i, el) => {
      const link = $(el).attr('href');
      const title = $(el).text();
      if (link && title) {
        try {
          const fullLink = new URL(link, url).toString();
          chapterLinks.push({ title, link: fullLink });
        } catch (e) {
          // ignore invalid links
        }
      }
    });

    // Remove duplicates if any
    let uniqueChapters = chapterLinks.filter(
      (v, i, a) => a.findIndex((t) => t.link === v.link) === i,
    );

    if (uniqueChapters.length === 0) {
      throw new BadRequestException(
        '未找到章节列表，请确认链接正确或网站结构暂不支持',
      );
    }

    // Handle Custom Chapter Range
    const total = uniqueChapters.length;
    let start = 0;
    let end = total;

    if (startChapter && startChapter > 0) {
      start = startChapter - 1; // user input is 1-based
    }
    if (endChapter && endChapter > 0 && endChapter <= total) {
      end = endChapter;
    }

    if (start >= total || start >= end) {
      throw new BadRequestException(
        `Invalid chapter range. Total chapters: ${total}`,
      );
    }

    uniqueChapters = uniqueChapters.slice(start, end);

    this.logger.log(
      `Found ${total} chapters, downloading ${
        uniqueChapters.length
      } chapters (${start + 1} - ${end}) for ${safeName}`,
    );

    // 3. Concurrent Download
    const limit = pLimit(3); // Reduce concurrency to avoid 429
    const chaptersContent: string[] = new Array(uniqueChapters.length).fill('');

    let completedCount = 0;

    const tasks = uniqueChapters.map((chapter, index) => {
      return limit(async () => {
        // Add random delay to be polite (500ms - 1500ms)
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000),
        );

        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
          try {
            const content = await this.fetchChapterContent(chapter.link);
            chaptersContent[index] = `\n\n${chapter.title}\n\n${content}`;
            completedCount++;
            if (
              completedCount % 20 === 0 ||
              completedCount === uniqueChapters.length
            ) {
              this.logger.log(
                `Progress: ${completedCount}/${uniqueChapters.length}`,
              );
            }
            return; // Success, exit loop
          } catch (error: unknown) {
            retryCount++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(
              `Failed to download chapter ${chapter.title} (Attempt ${retryCount}/${maxRetries}): ${errorMessage}`,
            );
            if (retryCount >= maxRetries) {
              this.logger.error(
                `Permanently failed to download chapter ${chapter.title}`,
              );
              chaptersContent[index] = `\n\n${chapter.title}\n\n[下载失败]`;
            } else {
              // Wait a bit before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount),
              );
            }
          }
        }
      });
    });

    await Promise.all(tasks);

    // 4. Save to File
    const filePath = path.join(this.saveDir, `${safeName}.txt`);
    fs.writeFileSync(filePath, chaptersContent.join(''));

    this.logger.log(`Download finished: ${filePath}`);
    return {
      path: filePath,
      filename: `${safeName}.txt`,
      totalChapters: uniqueChapters.length,
      downloadUrl: `/uploads/novels/${encodeURIComponent(safeName)}.txt`, // Assuming static serve or similar
    };
  }

  private async fetchPage(
    url: string,
  ): Promise<{ html: string; charset: string }> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        Referer: new URL(url).origin + '/',
      },
      timeout: 15000,
    });

    // Use a preliminary decode to find charset in meta tags
    // decoding as ascii is safe for finding headers/meta tags
    const htmlPreview = response.data.toString('ascii');
    let charset = 'utf-8';

    // Detect charset
    // 1. Check Content-Type header
    const contentType = String(response.headers['content-type'] || '');
    if (contentType && contentType.includes('charset=')) {
      charset = contentType.split('charset=')[1].trim();
    } else {
      // 2. Check meta tag (improved regex)
      // Matches <meta charset="gbk"> or <meta http-equiv="..." content="...charset=gbk...">
      const metaMatch =
        htmlPreview.match(/<meta[^>]*?charset=["']?([a-zA-Z0-9-]+)["']?/i) ||
        htmlPreview.match(
          /content=["'][^"']*?charset=([a-zA-Z0-9-]+)[^"']*?["']/i,
        );

      if (metaMatch && metaMatch[1]) {
        charset = metaMatch[1].toLowerCase();
      }
    }

    // Normalize charset
    if (['gbk', 'gb2312', 'gb18030', 'cn'].includes(charset)) {
      charset = 'gbk';
    }

    // Decode content
    let html = '';
    if (charset === 'gbk') {
      html = iconv.decode(response.data, 'gbk');
    } else {
      html = response.data.toString('utf-8');
    }

    return { html, charset };
  }

  private async fetchChapterContent(url: string): Promise<string> {
    try {
      const { html } = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Common content selectors
      let content = $('#content').text(); // Bishenge / Biquge
      if (!content || content.length < 50) {
        content = $('.content').text();
      }
      if (!content || content.length < 50) {
        content = $('#chaptercontent').text();
      }
      if (!content || content.length < 50) {
        // Fallback: finding the div with longest text
        let maxLen = 0;
        $('div').each((i, el) => {
          // Ignore navigation, header, footer
          if ($(el).find('a').length > 5) return;

          const text = $(el).text();
          if (text.length > maxLen) {
            maxLen = text.length;
            content = text;
          }
        });
      }

      if (!content || content.length < 50) {
        throw new Error('Content too short or not found');
      }

      return content
        .replace(/&nbsp;/g, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n/g, '\n\n') // Merge multiple newlines
        .trim();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error fetching chapter ${url}: ${errorMessage}`);
      throw e;
    }
  }
}
