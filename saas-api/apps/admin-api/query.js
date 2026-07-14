
const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module').Module._initPaths();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.application.update({
    where: { id: 21 },
    data: {
      currentNode: 1200,
      currentStatus: 10,
      status: 'PENDING_RISK_PRE'
    }
  });
  
  console.log('已更新订单状态:');
  console.log('  applicationNo:', result.applicationNo);
  console.log('  currentNode:', result.currentNode);
  console.log('  currentStatus:', result.currentStatus);
  console.log('  status:', result.status);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
