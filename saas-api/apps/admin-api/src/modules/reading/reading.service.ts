import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBookCategoryDto,
  UpdateBookCategoryDto,
  CategoryQueryDto,
  BatchCategoryStatusDto,
  CreateBookDto,
  UpdateBookDto,
  BookQueryDto,
  CreateChapterDto,
  UpdateChapterDto,
  ChapterQueryDto,
  AddBookshelfDto,
  SaveReadingProgressDto,
  CreateReviewDto,
  ReviewQueryDto,
  UpdateReviewStatusDto,
} from './dto/reading.dto';

@Injectable()
export class ReadingService {
  constructor(private prisma: PrismaService) {}

  private sanitizeChapterContent(text: string | null | undefined): string {
    if (!text) return '';
    let s = text;
    // 去除抓站常见的转码/广告噪声
    s = s.replace(/chapter_content\(\);?/g, '');
    s = s.replace(/site_con_ad\([^)]*\);?/g, '');
    s = s.replace(/\.\.\.\.\.\.\.👉👉 当前浏览器转码失败.*?原网页”。?/g, '');
    s = s.replace(/👉👉 当前浏览器转码失败.*?原网页”。?/g, '');
    s = s.replace(/当前浏览器转码失败.*?显示完整内容.*?原网页。?/g, '');
    // 规范化空白
    s = s.replace(/\u3000+/g, '    ').replace(/[ \t]{2,}/g, '    ').trim();
    return s;
  }

  // ==================== 书籍分类 ====================

  async getCategories(tenantId: number, query?: CategoryQueryDto) {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (query?.keyword) {
      where.name = { contains: query.keyword, mode: 'insensitive' };
    }

    const categories = await this.prisma.bookCategory.findMany({
      where,
      orderBy: { sort: 'asc' },
      include: {
        _count: { select: { books: true } },
      },
    });

    if (query?.tree) {
      return this.buildCategoryTree(categories);
    }

    return categories;
  }

  async getCategoryById(id: number, tenantId: number) {
    const category = await this.prisma.bookCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { books: true } },
      },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }

  private buildCategoryTree(categories: Record<string, unknown>[]) {
    const map = new Map<number, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const cat of categories) {
      map.set(cat.id as number, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id as number)!;
      if (cat.parentId && map.has(cat.parentId as number)) {
        (map.get(cat.parentId as number)!.children as Record<string, unknown>[]).push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async createCategory(tenantId: number, dto: CreateBookCategoryDto) {
    return this.prisma.bookCategory.create({
      data: {
        tenantId,
        name: dto.name,
        parentId: dto.parentId,
        sort: dto.sort || 0,
      },
    });
  }

  async updateCategory(id: number, tenantId: number, dto: UpdateBookCategoryDto) {
    const category = await this.prisma.bookCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return this.prisma.bookCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: number, tenantId: number) {
    const category = await this.prisma.bookCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    // 检查是否有子分类
    const childCount = await this.prisma.bookCategory.count({
      where: { parentId: id, tenantId },
    });
    if (childCount > 0) {
      throw new BadRequestException('该分类下有子分类，请先删除子分类');
    }
    // 检查是否有书籍使用此分类
    const bookCount = await this.prisma.book.count({
      where: { categoryId: id },
    });
    if (bookCount > 0) {
      throw new BadRequestException('该分类下有书籍，无法删除');
    }
    return this.prisma.bookCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async batchUpdateCategoryStatus(tenantId: number, dto: BatchCategoryStatusDto) {
    const categories = await this.prisma.bookCategory.findMany({
      where: { id: { in: dto.ids }, tenantId, deletedAt: null },
    });
    if (categories.length !== dto.ids.length) {
      throw new NotFoundException('部分分类不存在');
    }
    await this.prisma.bookCategory.updateMany({
      where: { id: { in: dto.ids }, tenantId },
      data: { status: dto.status },
    });
    return { affected: categories.length };
  }

  // ==================== 书籍管理 ====================

  async getBooks(tenantId: number, query: BookQueryDto) {
    const { keyword, categoryId, status, isHot, isRecommend, isFinished, page = 1, pageSize = 20 } = query;
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { author: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status !== undefined) where.status = status;
    if (isHot !== undefined) where.isHot = isHot;
    if (isRecommend !== undefined) where.isRecommend = isRecommend;
    if (isFinished !== undefined) where.isFinished = isFinished;

    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getBookById(id: number, tenantId: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true, _count: { select: { chapters: true, reviews: true } } },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }
    return book;
  }

  async createBook(tenantId: number, dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        tenantId,
        title: dto.title,
        author: dto.author,
        cover: dto.cover,
        desc: dto.desc,
        categoryId: dto.categoryId,
        isbn: dto.isbn,
        publisher: dto.publisher,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : null,
        wordCount: dto.wordCount || 0,
        price: dto.price || 0,
        isFree: dto.isFree ?? true,
        isVip: dto.isVip ?? false,
        isSerial: dto.isSerial ?? true,
        tags: dto.tags,
      },
    });
  }

  /**
   * 上传 TXT 文件创建图书（自动分章）
   */
  async createBookFromTxt(
    tenantId: number,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    dto: {
      title?: string;
      author?: string;
      categoryId?: number;
      desc?: string;
      tags?: string;
      chapterRegex?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('请上传 TXT 文件');
    }

    // 检测编码：尝试 UTF-8，如果出现大量替换字符则尝试 GBK
    let content = file.buffer.toString('utf-8');
    if (content.includes('\ufffd') && content.indexOf('\ufffd') < 100) {
      try {
        const iconv = require('iconv-lite');
        content = iconv.decode(file.buffer, 'gbk');
      } catch {
        // iconv-lite 不可用，继续用 UTF-8
      }
    }

    // 清理 BOM
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    // 修复文件名编码：Windows 文件名是 GBK，Multer 按 Latin-1 解析会导致乱码
    let originalname = file.originalname
    try {
      const iconv = require('iconv-lite')
      const buffer = Buffer.from(originalname, 'latin1')
      const decoded = iconv.decode(buffer, 'gbk')
      // 如果解码后包含中文字符，说明 GBK 解码成功
      if (/[\u4e00-\u9fff]/.test(decoded)) {
        originalname = decoded
      }
    } catch {
      // iconv-lite 不可用，使用原始名称
    }

    // 书名：优先用传入的 title，否则用文件名去掉扩展名
    const bookTitle = dto.title || originalname.replace(/\.txt$/i, '').trim() || '未命名图书';
    const bookAuthor = dto.author || '未知';

    // 分章
    const chapters = this.splitTxtToChapters(content, dto.chapterRegex);

    if (chapters.length === 0) {
      throw new BadRequestException('TXT 文件内容为空或无法解析章节');
    }

    // 计算总字数
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    // 创建图书和章节（事务）
    const book = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.book.create({
        data: {
          tenantId,
          title: bookTitle,
          author: bookAuthor,
          desc: dto.desc || null,
          categoryId: dto.categoryId || null,
          tags: dto.tags || null,
          wordCount: totalWordCount,
          chapterCount: chapters.length,
          isSerial: true,
          isFinished: false,
          status: 1,
        },
      });

      // 批量创建章节
      const chapterData = chapters.map((ch, idx) => ({
        tenantId,
        bookId: created.id,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
        sort: idx + 1,
      }));

      // 分批插入，每批 100 条
      for (let i = 0; i < chapterData.length; i += 100) {
        await tx.bookChapter.createMany({
          data: chapterData.slice(i, i + 100),
        });
      }

      return created;
    });

    return {
      bookId: book.id,
      title: book.title,
      chapterCount: chapters.length,
      totalWordCount,
    };
  }

  /**
   * 将 TXT 内容按章节标题拆分
   */
  private splitTxtToChapters(
    content: string,
    customRegex?: string,
  ): Array<{ title: string; content: string; wordCount: number }> {
    // 默认章节匹配模式
    const defaultPatterns = [
      // 第X章/回/节/卷/篇 + 可选标题
      '^\s*(第[零一二三四五六七八九十百千万\d]+[章回节卷篇幕]\s*.*)$',
      // Chapter X / CHAPTER X
      '^\s*(chapter\s+\d+.*)$',
      // 数字序号标题，如 "001 标题" 或 "1. 标题"
      '^\s*(\d{1,4}[\.、\s]\s*.{2,30})$',
      // 卷标题
      '^\s*(第[零一二三四五六七八九十百千万\d]+[卷部]\s*.*)$',
    ];

    let regex: RegExp;
    if (customRegex) {
      try {
        regex = new RegExp(customRegex, 'gmi');
      } catch {
        regex = new RegExp(defaultPatterns.join('|'), 'gmi');
      }
    } else {
      regex = new RegExp(defaultPatterns.join('|'), 'gmi');
    }

    // 查找所有章节标题位置
    const matches: Array<{ index: number; title: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      matches.push({
        index: m.index,
        title: m[1]?.trim() || m[0].trim(),
      });
    }

    // 如果没找到章节标题，按固定字数分章
    if (matches.length === 0) {
      return this.splitByLength(content, 3000);
    }

    const chapters: Array<{ title: string; content: string; wordCount: number }> = [];

    // 第一个章节标题之前的内容作为"序章/前言"
    if (matches[0].index > 0) {
      const preface = content.slice(0, matches[0].index).trim();
      if (preface.length > 100) {
        chapters.push({
          title: '前言',
          content: preface,
          wordCount: this.countWords(preface),
        });
      }
    }

    // 按章节标题拆分
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const raw = content.slice(start, end).trim();

      // 提取标题（第一行）和正文（剩余部分）
      const newlineIdx = raw.indexOf('\n');
      const title = matches[i].title;
      const body = newlineIdx >= 0 ? raw.slice(newlineIdx + 1).trim() : '';

      if (body.length > 0 || i === 0) {
        chapters.push({
          title: title.length > 50 ? title.slice(0, 50) + '...' : title,
          content: body || raw,
          wordCount: this.countWords(body || raw),
        });
      }
    }

    return chapters;
  }

  private splitByLength(content: string, maxLen: number): Array<{ title: string; content: string; wordCount: number }> {
    const chapters: Array<{ title: string; content: string; wordCount: number }> = [];
    // 先按双换行分段
    const paragraphs = content.split(/\n\s*\n/);
    let current = '';
    let chapterIdx = 1;

    for (const para of paragraphs) {
      if (current.length + para.length > maxLen && current.length > 0) {
        chapters.push({
          title: `第${chapterIdx}节`,
          content: current.trim(),
          wordCount: this.countWords(current),
        });
        chapterIdx++;
        current = para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }

    if (current.trim()) {
      chapters.push({
        title: chapters.length > 0 ? `第${chapterIdx}节` : '正文',
        content: current.trim(),
        wordCount: this.countWords(current),
      });
    }

    return chapters;
  }

  private countWords(text: string): number {
    if (!text) return 0;
    // 去除空白后计算字符数
    return text.replace(/\s/g, '').length;
  }


  async updateBook(id: number, tenantId: number, dto: UpdateBookDto) {
    const book = await this.prisma.book.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }
    return this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      },
    });
  }

  async deleteBook(id: number, tenantId: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }
    return this.prisma.book.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ==================== 章节管理 ====================

  async getChaptersLite(tenantId: number, bookId: number) {
    const chapters = await this.prisma.bookChapter.findMany({
      where: { tenantId, bookId, deletedAt: null },
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        title: true,
        sort: true,
        isVip: true,
      },
    });
    return { items: chapters };
  }

  async getChapters(tenantId: number, query: ChapterQueryDto) {
    const { bookId, keyword, page = 1, pageSize = 100 } = query;
    const where: Record<string, unknown> = { tenantId, bookId, deletedAt: null };

    if (keyword) {
      where.title = { contains: keyword, mode: 'insensitive' };
    }

    const [rows, total] = await Promise.all([
      this.prisma.bookChapter.findMany({
        where,
        orderBy: { sort: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        // 列表只返回元信息，不返回正文 content
        select: {
          id: true,
          tenantId: true,
          bookId: true,
          title: true,
          wordCount: true,
          sort: true,
          isVip: true,
          price: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.bookChapter.count({ where }),
    ]);

    return { items: rows, total, page, pageSize };
  }

  async getChapterById(id: number, tenantId: number) {
    const chapter = await this.prisma.bookChapter.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    return {
      ...chapter,
      content: this.sanitizeChapterContent(chapter.content),
    };
  }

  async createChapter(tenantId: number, dto: CreateChapterDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const chapter = await tx.bookChapter.create({
        data: {
          tenantId,
          bookId: dto.bookId,
          title: dto.title,
          content: dto.content,
          wordCount: dto.content?.length || 0,
          sort: dto.sort || 0,
          isVip: dto.isVip || false,
          price: dto.price || 0,
        },
      });

      await tx.book.update({
        where: { id: dto.bookId },
        data: { chapterCount: { increment: 1 } },
      });

      return chapter;
    });
  }

  async updateChapter(id: number, tenantId: number, dto: UpdateChapterDto) {
    const chapter = await this.prisma.bookChapter.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    return this.prisma.bookChapter.update({
      where: { id },
      data: {
        ...dto,
        wordCount: dto.content?.length || chapter.wordCount,
      },
    });
  }

  async deleteChapter(id: number, tenantId: number) {
    const chapter = await this.prisma.bookChapter.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.book.update({
        where: { id: chapter.bookId },
        data: { chapterCount: { decrement: 1 } },
      });

      return tx.bookChapter.update({ where: { id }, data: { deletedAt: new Date() } });
    });
  }

  // ==================== 用户书架 ====================

  async getBookshelf(userId: number, tenantId: number) {
    return this.prisma.userBookshelf.findMany({
      where: { userId, tenantId, deletedAt: null },
      include: {
        book: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
    });
  }

  async addToBookshelf(userId: number, tenantId: number, dto: AddBookshelfDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId, status: 1, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    const existing = await this.prisma.userBookshelf.findFirst({
      where: { userId, bookId: dto.bookId, deletedAt: null },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.userBookshelf.create({
      data: {
        tenantId,
        userId,
        bookId: dto.bookId,
        lastReadAt: new Date(),
      },
    });
  }

  async removeFromBookshelf(userId: number, tenantId: number, bookId: number) {
    const record = await this.prisma.userBookshelf.findFirst({
      where: { userId, bookId, tenantId, deletedAt: null },
    });
    if (!record) {
      throw new NotFoundException('书架记录不存在');
    }
    return this.prisma.userBookshelf.update({ where: { id: record.id }, data: { deletedAt: new Date() } });
  }

  // ==================== 阅读进度 ====================

  async getReadingProgress(userId: number, tenantId: number, bookId: number) {
    return this.prisma.readingProgress.findFirst({
      where: { userId, bookId, tenantId, deletedAt: null },
    });
  }

  async saveReadingProgress(userId: number, tenantId: number, dto: SaveReadingProgressDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    // 更新书架的最后阅读时间
    await this.prisma.userBookshelf.updateMany({
      where: { userId, bookId: dto.bookId, deletedAt: null },
      data: { lastReadAt: new Date() },
    });

    return this.prisma.readingProgress.upsert({
      where: { userId_bookId: { userId, bookId: dto.bookId } },
      create: {
        tenantId,
        userId,
        bookId: dto.bookId,
        chapterId: dto.chapterId,
        page: dto.page || 0,
        progress: dto.progress || 0,
        readTime: dto.readTime || 0,
      },
      update: {
        chapterId: dto.chapterId,
        page: dto.page,
        progress: dto.progress,
        readTime: { increment: dto.readTime || 0 },
        lastReadAt: new Date(),
      },
    });
  }

  // ==================== 书籍评价 ====================

  async getReviews(tenantId: number, query: ReviewQueryDto) {
    const { bookId, keyword, status, page = 1, pageSize = 20 } = query;
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (bookId) where.bookId = bookId;
    if (status !== undefined) where.status = status;
    if (keyword) {
      where.content = { contains: keyword, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.bookReview.findMany({
        where,
        include: {
          book: { select: { id: true, title: true } },
          user: { select: { id: true, username: true, nickname: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bookReview.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async updateReviewStatus(tenantId: number, dto: UpdateReviewStatusDto) {
    const review = await this.prisma.bookReview.findFirst({
      where: { id: dto.id, tenantId, deletedAt: null },
    });
    if (!review) {
      throw new NotFoundException('评价不存在');
    }
    return this.prisma.bookReview.update({
      where: { id: dto.id },
      data: { status: dto.status },
    });
  }

  async deleteReview(tenantId: number, id: number) {
    const review = await this.prisma.bookReview.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!review) {
      throw new NotFoundException('评价不存在');
    }
    // 删除后需重新计算书籍评分
    await this.prisma.bookReview.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const agg = await this.prisma.bookReview.aggregate({
      where: { bookId: review.bookId, status: 1, deletedAt: null },
      _avg: { rating: true },
      _count: true,
    });
    const avgRating = agg._avg.rating ?? 0;

    await this.prisma.book.update({
      where: { id: review.bookId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: agg._count,
      },
    });

    return { success: true };
  }

  async createReview(userId: number, tenantId: number, dto: CreateReviewDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId, deletedAt: null },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    const existing = await this.prisma.bookReview.findFirst({
      where: { userId, bookId: dto.bookId },
    });
    if (existing) {
      throw new BadRequestException('您已经评价过这本书');
    }

    const review = await this.prisma.bookReview.create({
      data: {
        tenantId,
        userId,
        bookId: dto.bookId,
        rating: dto.rating,
        content: dto.content,
      },
    });

    // 更新书籍评分（使用 aggregate 避免加载全部记录到内存）
    const agg = await this.prisma.bookReview.aggregate({
      where: { bookId: dto.bookId, status: 1 },
      _avg: { rating: true },
      _count: true,
    });
    const avgRating = agg._avg.rating ?? 0;

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: agg._count,
      },
    });

    return review;
  }

  // ==================== 统计 ====================

  async getStatistics(tenantId: number, userId?: number) {
    const [bookCount, categoryCount, userCount, totalReads] = await Promise.all([
      this.prisma.book.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.bookCategory.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.userBookshelf.groupBy({
        by: ['userId'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.book.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: { readCount: true },
      }),
    ]);

    const result: Record<string, unknown> = {
      bookCount,
      categoryCount,
      activeReaderCount: userCount.length,
      totalReads: totalReads._sum.readCount || 0,
    };

    // 用户级统计
    if (userId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        userShelfCount,
        userCompletedCount,
        todayProgressRecords,
        totalProgressRecords,
      ] = await Promise.all([
        this.prisma.userBookshelf.count({ where: { userId, tenantId } }),
        this.prisma.readingProgress.count({
          where: { userId, tenantId, progress: { gte: 100 } },
        }),
        this.prisma.readingProgress.findMany({
          where: { userId, tenantId, updatedAt: { gte: todayStart } },
          select: { readTime: true, progress: true },
        }),
        this.prisma.readingProgress.findMany({
          where: { userId, tenantId },
          select: { readTime: true },
        }),
      ]);

      // 今日阅读分钟数（从保存的readTime累计，或按记录数估算每分钟）
      const todayMinutes = todayProgressRecords.reduce(
        (sum: number, r: { readTime: number | null }) => sum + (r.readTime || 0),
        0,
      );
      const totalMinutes = totalProgressRecords.reduce(
        (sum: number, r: { readTime: number | null }) => sum + (r.readTime || 0),
        0,
      );

      Object.assign(result, {
        personal: {
          shelfCount: userShelfCount,
          completedCount: userCompletedCount,
          todayReadMinutes: todayMinutes,
          totalReadMinutes: totalMinutes,
        },
      });
    }

    return result;
  }

  async getHotBooks(tenantId: number, limit = 10) {
    const books = await this.prisma.book.findMany({
      where: { tenantId, status: 1, deletedAt: null },
      orderBy: { readCount: 'desc' },
      take: limit,
      include: { category: true },
    });
    return books.map((item: { price: number | string; rating: number | string }) => ({
      ...item,
      price: Number(item.price),
      rating: Number(item.rating),
    }));
  }

  async getRecommendBooks(tenantId: number, limit = 10) {
    const books = await this.prisma.book.findMany({
      where: { tenantId, status: 1, isRecommend: true, deletedAt: null },
      orderBy: { rating: 'desc' },
      take: limit,
      include: { category: true },
    });
    return books.map((item: { price: number | string; rating: number | string }) => ({
      ...item,
      price: Number(item.price),
      rating: Number(item.rating),
    }));
  }
}
