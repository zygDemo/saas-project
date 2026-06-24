import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { code: 'default' } })
  if (!tenant) {
    console.error('❌ 默认租户不存在，请先执行主 seed')
    process.exit(1)
  }

  console.log('📚 开始填充阅读模块种子数据...')

  // ============== 书籍分类 ==============
  const categories = await seedCategories(tenant.id)

  // ============== 书籍 + 章节 ==============
  await seedBooks(tenant.id, categories)

  console.log('✅ 阅读模块种子数据填充完成！')
}

async function seedCategories(tenantId: number) {
  const categoryData = [
    { name: '玄幻奇幻', sort: 1 },
    { name: '武侠仙侠', sort: 2 },
    { name: '都市言情', sort: 3 },
    { name: '历史军事', sort: 4 },
    { name: '科幻灵异', sort: 5 },
    { name: '网游竞技', sort: 6 },
    { name: '悬疑推理', sort: 7 },
    { name: '短篇文学', sort: 8 },
  ]

  const result: Record<string, number> = {}
  for (const cat of categoryData) {
    let existing = await prisma.bookCategory.findFirst({
      where: { tenantId, name: cat.name },
    })
    if (existing) {
      existing = await prisma.bookCategory.update({
        where: { id: existing.id },
        data: { sort: cat.sort, status: 1 },
      })
    } else {
      existing = await prisma.bookCategory.create({
        data: {
          tenantId,
          name: cat.name,
          sort: cat.sort,
          status: 1,
        },
      })
    }
    result[cat.name] = existing.id
  }
  console.log(`  📂 创建/更新 ${categoryData.length} 个分类`)
  return result
}

async function seedBooks(tenantId: number, categoryIds: Record<string, number>) {
  const books = [
    {
      title: '星辰变',
      author: '我吃西红柿',
      desc: '一部修真小说，讲述了一个少年秦羽的修真故事。他为了变得更强，不断突破自我，最终成为一代强者的传奇经历。',
      category: '玄幻奇幻',
      isFinished: true,
      isHot: true,
      isRecommend: true,
      rating: 4.8,
      tags: '修真,热血,升级流',
      chapters: [
        { title: '第一章 秦羽', content: '秦羽站在后山悬崖边上，望着远方翻滚的云海，心中充满了对未来的憧憬。他从小就知道，自己注定要走一条与众不同的路。父亲秦德是镇东王，但他却无法修炼内功。然而，秦羽从不认命。\n\n"我秦羽，绝不会输给任何人！"\n\n他握紧拳头，眼中闪烁着坚定的光芒。从今天开始，他要走一条前人未曾走过的路——外功修炼。虽然这条路艰难万分，但他别无选择。\n\n山风呼啸，吹起他的衣角。秦羽深吸一口气，开始了今天的训练。一万次挥拳，一万次踢腿，这是每天的必修课。汗水浸透了他的衣衫，但他的眼神始终坚定。' },
        { title: '第二章 流星泪', content: '夜深人静，秦羽独自坐在房间里。今天在拍卖会上，他花光了所有积蓄，买下了一颗看似普通的泪珠状晶体。这颗"流星泪"据说是一件上古奇物，但无人能参透其中的奥秘。\n\n"你到底藏着什么秘密呢？"\n\n秦羽将流星泪放在掌心，仔细端详。突然，一阵温热的感觉从掌心传来。流星泪竟然融化了，化作一道流光融入他的体内！\n\n秦羽震惊地发现，自己的身体正在发生翻天覆地的变化。一股奇异的力量在体内流转，他的经脉正在被重塑，肉体在以肉眼可见的速度变强。\n\n"这就是流星泪的力量吗？"' },
        { title: '第三章 外功大成', content: '三个月后，秦羽站在瀑布之下，任凭湍急的水流冲击着身体。他已经不是当初那个弱小的少年了。流星泪的力量让他的身体发生了质的飞跃，外功修炼一日千里。\n\n"喝！"\n\n秦羽一拳轰出，拳风直接劈开了瀑布的水幕！水流倒卷而回，形成了一道壮观的景象。\n\n"先天大圆满！"\n\n秦羽感受着体内澎湃的力量，忍不住仰天长啸。他终于达到了外功修炼的巅峰境界。放眼整个潜龙大陆，能在如此年纪达到这一境界的，恐怕也只有他秦羽一人了。\n\n但他知道，这只是开始。他的目标，是那传说中的修真界。' },
      ],
    },
    {
      title: '斗破苍穹',
      author: '天蚕土豆',
      desc: '这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！三十年河东，三十年河西，莫欺少年穷！',
      category: '玄幻奇幻',
      isFinished: true,
      isHot: true,
      isRecommend: true,
      rating: 4.7,
      tags: '斗气,热血,逆袭',
      chapters: [
        { title: '第一章 陨落的天才', content: '"斗之力，三段！"\n\n望着测验魔石碑上面闪亮得甚至有些刺眼的五个大字，少年面无表情，唇角有着一抹自嘲，紧握的手掌，因为大力，而导致略微尖锐的指甲深深的刺进了掌心之中，带来一阵阵钻心的疼痛。\n\n"萧炎，斗之力，三段！级别：低级！"\n\n测验魔石碑之旁，一位中年男子，看了一眼碑上所显示出来的信息，语气漠然的将之公布了出来。\n\n中年男子话刚刚脱口，便是不出意外的在人头汹涌的广场上带起了一阵嘲讽的骚动。\n\n"三段？嘿嘿，果然不出我所料，这个"天才"这一年又是在原地踏步！"\n\n"哎，这废物真是把家族的脸都给丢光了。"' },
        { title: '第二章 药老现世', content: '回到房间后，萧炎紧紧咬着嘴唇，拳头握得发白。曾经的天才如今沦为他人的笑柄，这种落差让他几乎喘不过气。\n\n就在这时，他手指上的黑色戒指微微发热。一个苍老的声音在他脑海中响起。\n\n"小家伙，你的天赋很不错嘛。"\n\n萧炎猛地跳了起来："谁？谁在说话？"\n\n戒指中飘出一缕青烟，逐渐凝聚成一个老者的虚影。老者身穿白袍，仙风道骨，面带微笑地看着萧炎。\n\n"老夫药尘，你可以叫我药老。这些年，你的斗气之所以不进反退，都是因为老夫在吸收你的斗气以恢复灵魂之力。"\n\n萧炎愣住了，随即一股怒火涌上心头："原来是你！"' },
        { title: '第三章 焚决入门', content: '在药老的指导下，萧炎开始修炼一种名为"焚决"的神秘功法。焚决不同于普通的斗气功法，它能够通过吞噬异火来进化。\n\n"这套功法虽然初始阶段等级较低，但它的成长性是无限的。"药老严肃地说，"只要你能够不断吞噬异火，焚决就能够进化到连天阶功法都无法企及的高度。"\n\n萧炎盘膝而坐，按照焚决的运功路线开始修炼。一股温热的能量在经脉中流动，与普通的斗气完全不同。\n\n"这种感觉...好神奇。"\n\n仅仅一夜的修炼，萧炎就感觉自己的斗气有了一丝增长。虽然微不足道，但对于停滞了三年之久的他来说，这已经是天大的好消息了。' },
      ],
    },
    {
      title: '盘龙',
      author: '我吃西红柿',
      desc: '大陆上传说中的四大终极战士之一的"龙血战士"已经千年未曾出现，而唯一拥有龙血战士血脉的家族也渐渐衰败了下来，成为一个小镇的普通贵族。',
      category: '玄幻奇幻',
      isFinished: true,
      isHot: true,
      isRecommend: false,
      rating: 4.6,
      tags: '西方玄幻,魔法,修炼',
      chapters: [
        { title: '第一章 小镇的早晨', content: '清晨的阳光透过窗户洒进房间，林雷睁开眼睛，从床上坐起身来。这是芬莱王国边陲的一个小镇——乌山镇，也是巴鲁克家族的领地。\n\n巴鲁克家族曾经是大陆上赫赫有名的龙血战士家族，然而千年过去了，龙血战士的血脉已经极为稀薄，巴鲁克家族也只剩下了这样一个偏远的小镇作为立足之地。\n\n"林雷少爷，早餐已经准备好了。"门外传来希尔曼叔叔的声音。\n\n希尔曼是家族的首席护卫，也是一位六级战士。在这个小镇上，他的实力已经算是顶尖了。\n\n"知道了，希尔曼叔叔。"林雷回应道。' },
        { title: '第二章 盘龙戒指', content: '林雷在家族藏宝室中翻找着，想找到一些能帮助修炼的东西。他的父亲霍格·巴鲁克是家族现任族长，虽然只是一个八级战士，但对林雷的期望很高。\n\n突然，林雷的手碰到了一枚不起眼的黑色戒指。戒指看起来十分古朴，上面刻着一条盘旋的龙纹。\n\n"这是...盘龙戒指？"\n\n林雷将戒指戴在手上，就在这一刻，戒指突然发出耀眼的光芒！一个苍老而威严的声音在林雷脑海中响起。\n\n"终于...有人唤醒了老夫。小子，你叫什么名字？"\n\n林雷震惊地发现，戒指中竟然有一个灵魂存在！这个发现彻底改变了他的人生轨迹。' },
      ],
    },
    {
      title: '盗墓笔记',
      author: '南派三叔',
      desc: '50年前由长沙土夫子出土的战国帛书，记载了一个奇特古墓的位置和进入方法。50年后，一个由老九门后人组成的探险队踏上了寻墓之路。',
      category: '悬疑推理',
      isFinished: true,
      isHot: false,
      isRecommend: true,
      rating: 4.5,
      tags: '悬疑,探险,盗墓',
      chapters: [
        { title: '第一章 帛书', content: '我叫吴邪，我爷爷是长沙老九门中吴家的传人。从小到大，我听到过无数关于地下世界的传说，但从未想过有一天，我自己也会踏入那个神秘的世界。\n\n事情的起因是一份帛书。\n\n那是一个闷热的下午，三叔突然打电话让我去他的铺子。到了之后，他神秘兮兮地从保险柜里拿出一块泛黄的帛书残片。\n\n"小邪，你看看这个。"\n\n我接过帛书，上面用战国文字记载着一些奇怪的内容。虽然我不太懂这些古文字，但帛书上描绘的地图让我感到一阵莫名的寒意。\n\n"这是..."\n\n"战国帛书。"三叔压低声音，"上面的内容，指向一个从未被发现的古墓。"' },
        { title: '第二章 出发', content: '三叔很快组织了一支队伍。除了我和三叔之外，还有几个老九门的后人——解雨臣、黑瞎子，以及三叔的老搭档潘子。\n\n"我们要去的地方是秦岭深处。"三叔摊开地图，"根据帛书的记载，那里有一座战国时期的大墓。"\n\n"战国大墓？"我心里一阵激动，但更多的是不安。"三叔，这会不会太危险了？"\n\n"富贵险中求嘛。"三叔笑了笑，"再说了，有潘子和黑瞎子在，不会有事的。"\n\n潘子是个老练的雇佣兵，据说在云南丛林里摸爬滚打了几十年。黑瞎子则是个奇人，虽然眼睛看不见，但在地下世界却有超乎常人的感知能力。' },
      ],
    },
    {
      title: '悟空传',
      author: '今何在',
      desc: '我要这天，再遮不住我眼；要这地，再埋不了我心；要这众生，都明白我意；要那诸佛，都烟消云散！',
      category: '武侠仙侠',
      isFinished: true,
      isHot: false,
      isRecommend: true,
      rating: 4.9,
      tags: '西游,热血,哲学',
      chapters: [
        { title: '第一章 齐天大圣', content: '那一年，我大闹天宫。\n\n那一年，我叫齐天大圣。\n\n那一天，我手持金箍棒，踏碎凌霄宝殿，将天庭搅得天翻地覆。十万天兵天将在我面前不堪一击，四大天王被我一棒一个打飞出去，杨戬的三尖两刃刀在我面前折断。\n\n我站在废墟之上，仰天长笑。\n\n"如来！你出来！"\n\n天空裂开，金光万丈。如来端坐莲台，面色慈悲。\n\n"泼猴，你可知罪？"\n\n"我何罪之有？"我傲然道，"我只是不想被任何人束缚。这天压不住我，你这如来也一样！"\n\n如来伸出手掌："既然如此，你且看看，能否翻出我这手掌心。"' },
        { title: '第二章 五指山下', content: '我被压在五指山下，已经五百年了。\n\n五百年来，风雨雷电，日晒雨淋，我全都承受着。但我从未低下过头。五百年算什么？一万年，我也不会屈服。\n\n经常有一只小鸟飞过来，停在我的肩膀上，叽叽喳喳地唱歌。它是这五百年里，我唯一的陪伴。\n\n"小鸟，你说，天外面是什么？"\n\n小鸟歪着头看着我，似乎不明白我在说什么。\n\n"我以前飞过的地方，你还记得吗？花叶山，水帘洞，那棵大桃树...不知道还在不在。"\n\n小鸟飞到我的面前，用小小的喙啄了啄我的鼻子。\n\n我笑了。五百年来第一次笑。\n\n"你放心，我一定会出去的。"' },
      ],
    },
    {
      title: '诛仙',
      author: '萧鼎',
      desc: '天地不仁，以万物为刍狗。这世间本是没有什么神仙，但自太古以来，人类眼见周遭世界，诸般奇异之事，遂以为九天之上，有诸般神灵。',
      category: '武侠仙侠',
      isFinished: true,
      isHot: false,
      isRecommend: false,
      rating: 4.7,
      tags: '仙侠,言情,悲剧',
      chapters: [
        { title: '第一章 青云门', content: '青云山脉巍峨高耸，虎踞中原，山阴处有大河"洪川"，山阳乃重镇"河阳城"，扼天下咽喉，地理位置十分重要。\n\n青云山连绵百里，峰峦起伏，最高有七峰，高耸入云，平日里只见白云环山腰，却不识山顶真容。青云山山林密布，飞瀑奇岩，珍禽异兽，在所多有，景色幽险奇峻，天下闻名。\n\n而更有名的，却是在这山上的修真门派——青云门。\n\n青云门乃是当今天下修真界中的正道领袖，门下弟子数万人，能人辈出。\n\n这一日，一个相貌平平的少年正跪在青云山下，他的名字叫张小凡。' },
      ],
    },
  ]

  for (const bookData of books) {
    const categoryId = categoryIds[bookData.category] || null
    const wordCount = bookData.chapters.reduce((sum, ch) => sum + ch.content.length, 0)

    // findFirst + update or create
    let book = await prisma.book.findFirst({
      where: { tenantId, title: bookData.title },
    })

    const bookCreateData = {
      tenantId,
      title: bookData.title,
      author: bookData.author,
      desc: bookData.desc,
      categoryId,
      isSerial: false,
      isFinished: bookData.isFinished,
      isHot: bookData.isHot,
      isRecommend: bookData.isRecommend,
      rating: bookData.rating,
      ratingCount: Math.floor(Math.random() * 500) + 50,
      readCount: Math.floor(Math.random() * 10000) + 1000,
      wordCount,
      chapterCount: bookData.chapters.length,
      tags: bookData.tags,
      status: 1,
    }

    if (book) {
      book = await prisma.book.update({
        where: { id: book.id },
        data: bookCreateData,
      })
    } else {
      book = await prisma.book.create({
        data: bookCreateData,
      })
    }

    // 批量 upsert 章节（bookChapter 有 @@unique([bookId, sort])）
    for (let i = 0; i < bookData.chapters.length; i++) {
      const ch = bookData.chapters[i]
      await prisma.bookChapter.upsert({
        where: {
          bookId_sort: { bookId: book.id, sort: i + 1 },
        },
        update: {
          title: ch.title,
          content: ch.content,
          wordCount: ch.content.length,
        },
        create: {
          tenantId,
          bookId: book.id,
          title: ch.title,
          content: ch.content,
          wordCount: ch.content.length,
          sort: i + 1,
          isVip: false,
          price: 0,
        },
      })
    }
    console.log(`  📖 ${bookData.title}（${bookData.chapters.length} 章，${wordCount} 字）`)
  }

  console.log(`  ✨ 共填充 ${books.length} 本书籍`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('❌ 种子数据填充失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
