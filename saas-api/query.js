
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const app = await prisma.application.findFirst({
    where: { applicationNo: 'APP20260714141621112362456' },
    include: {
      customer: true,
      product: true,
      org: true,
      creator: { select: { id: true, userName: true, nickName: true } },
      approvals: { orderBy: { createdAt: 'desc' }, include: { approver: { select: { id: true, userName: true, nickName: true } } } },
      signRecord: true,
      disbursement: true,
      repayments: { orderBy: { period: 'asc' } }
    }
  });
  
  if (!app) {
    console.log('订单不存在');
  } else {
    console.log(JSON.stringify(app, null, 2));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
