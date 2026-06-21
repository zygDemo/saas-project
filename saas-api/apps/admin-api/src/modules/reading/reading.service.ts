import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBookCategoryDto,
  UpdateBookCategoryDto,
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
} from './dto/reading.dto';

@Injectable()
export class ReadingService {
  constructor(private prisma: PrismaService) {}

  // ==================== 书籍分类 ====================

  async getCategories(tenantId: number) {
    return this.prisma.bookCategory.findMany({
      where: { tenantId, status: 1 },
      orderBy: { sort: 'asc' },
    });
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
      where: { id, tenantId },
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
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    // 检查是否有书籍使用此分类
    const bookCount = await this.prisma.book.count({
      where: { categoryId: id },
    });
    if (bookCount > 0) {
      throw new BadRequestException('该分类下有书籍，无法删除');
    }
    return this.prisma.bookCategory.delete({ where: { id } });
  }

  // ==================== 书籍管理 ====================

  async getBooks(tenantId: number, query: BookQueryDto) {
    const { keyword, categoryId, status, isHot, isRecommend, isFinished, page = 1, pageSize = 20 } = query;
    const where: any = { tenantId };

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
      where: { id, tenantId },
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

  async updateBook(id: number, tenantId: number, dto: UpdateBookDto) {
    const book = await this.prisma.book.findFirst({
      where: { id, tenantId },
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
      where: { id, tenantId },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }
    return this.prisma.book.delete({ where: { id } });
  }

  // ==================== 章节管理 ====================

  async getChapters(tenantId: number, query: ChapterQueryDto) {
    const { bookId, page = 1, pageSize = 100 } = query;
    const where = { tenantId, bookId };

    const [items, total] = await Promise.all([
      this.prisma.bookChapter.findMany({
        where,
        orderBy: { sort: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bookChapter.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getChapterById(id: number, tenantId: number) {
    const chapter = await this.prisma.bookChapter.findFirst({
      where: { id, tenantId },
    });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    return chapter;
  }

  async createChapter(tenantId: number, dto: CreateChapterDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    const chapter = await this.prisma.bookChapter.create({
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

    // 更新书籍章节数
    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: { chapterCount: { increment: 1 } },
    });

    return chapter;
  }

  async updateChapter(id: number, tenantId: number, dto: UpdateChapterDto) {
    const chapter = await this.prisma.bookChapter.findFirst({
      where: { id, tenantId },
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
      where: { id, tenantId },
    });
    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }

    // 更新书籍章节数
    await this.prisma.book.update({
      where: { id: chapter.bookId },
      data: { chapterCount: { decrement: 1 } },
    });

    return this.prisma.bookChapter.delete({ where: { id } });
  }

  // ==================== 用户书架 ====================

  async getBookshelf(userId: number, tenantId: number) {
    return this.prisma.userBookshelf.findMany({
      where: { userId, tenantId },
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
      where: { id: dto.bookId, tenantId, status: 1 },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    const existing = await this.prisma.userBookshelf.findFirst({
      where: { userId, bookId: dto.bookId },
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
      where: { userId, bookId, tenantId },
    });
    if (!record) {
      throw new NotFoundException('书架记录不存在');
    }
    return this.prisma.userBookshelf.delete({ where: { id: record.id } });
  }

  // ==================== 阅读进度 ====================

  async getReadingProgress(userId: number, tenantId: number, bookId: number) {
    return this.prisma.readingProgress.findFirst({
      where: { userId, bookId, tenantId },
    });
  }

  async saveReadingProgress(userId: number, tenantId: number, dto: SaveReadingProgressDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    // 更新书架的最后阅读时间
    await this.prisma.userBookshelf.updateMany({
      where: { userId, bookId: dto.bookId },
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
    const { bookId, page = 1, pageSize = 20 } = query;
    const where = { tenantId, bookId, status: 1 };

    const [items, total] = await Promise.all([
      this.prisma.bookReview.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bookReview.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async createReview(userId: number, tenantId: number, dto: CreateReviewDto) {
    const book = await this.prisma.book.findFirst({
      where: { id: dto.bookId, tenantId },
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

    // 更新书籍评分
    const reviews = await this.prisma.bookReview.findMany({
      where: { bookId: dto.bookId, status: 1 },
    });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.book.update({
      where: { id: dto.bookId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: reviews.length,
      },
    });

    return review;
  }

  // ==================== 统计 ====================

  async getStatistics(tenantId: number) {
    const [bookCount, categoryCount, userCount, totalReads] = await Promise.all([
      this.prisma.book.count({ where: { tenantId } }),
      this.prisma.bookCategory.count({ where: { tenantId } }),
      this.prisma.userBookshelf.groupBy({
        by: ['userId'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.book.aggregate({
        where: { tenantId },
        _sum: { readCount: true },
      }),
    ]);

    return {
      bookCount,
      categoryCount,
      activeReaderCount: userCount.length,
      totalReads: totalReads._sum.readCount || 0,
    };
  }

  async getHotBooks(tenantId: number, limit = 10) {
    return this.prisma.book.findMany({
      where: { tenantId, status: 1 },
      orderBy: { readCount: 'desc' },
      take: limit,
      include: { category: true },
    });
  }

  async getRecommendBooks(tenantId: number, limit = 10) {
    return this.prisma.book.findMany({
      where: { tenantId, status: 1, isRecommend: true },
      orderBy: { rating: 'desc' },
      take: limit,
      include: { category: true },
    });
  }
}
