#!/bin/bash
# 每天清理 3 天前的日志审计数据
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:123456@127.0.0.1:5432/saas?schema=public}"

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const total = await prisma.operationLog.count();
  const toDelete = await prisma.operationLog.count({ where: { createdAt: { lt: threeDaysAgo } } });

  if (toDelete === 0) {
    console.log('[audit-cleanup] No old records to delete. Total:', total);
    await prisma.\$disconnect();
    return;
  }

  const result = await prisma.operationLog.deleteMany({ where: { createdAt: { lt: threeDaysAgo } } });
  console.log('[audit-cleanup] Deleted', result.count, 'records older than', threeDaysAgo.toISOString());
  const remaining = await prisma.operationLog.count();
  console.log('[audit-cleanup] Remaining:', remaining, 'records');
  await prisma.\$disconnect();
}

main().catch(e => { console.error('[audit-cleanup] Error:', e.message); process.exit(1); });
"
