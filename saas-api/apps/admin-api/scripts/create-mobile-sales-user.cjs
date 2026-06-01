const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: { name: 'Default Tenant', code: 'default' },
  });

  const org = await prisma.organization.upsert({
    where: { code: 'DEMO_ORG' },
    update: {
      tenantId: tenant.id,
      name: '示例车贷机构',
      status: 'ACTIVE',
      apiEnabled: true,
    },
    create: {
      tenantId: tenant.id,
      name: '示例车贷机构',
      code: 'DEMO_ORG',
      creditCode: '91110000DEMO000001',
      contactName: '张经理',
      contactPhone: '13810000000',
      address: '北京市朝阳区示例路 100 号',
      status: 'ACTIVE',
      packageType: 'STANDARD',
      apiEnabled: true,
    },
  });

  const role = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'R_SALES' } },
    update: {
      name: 'Sales',
      description: '业务员/客户经理',
      enabled: true,
      dataScope: 'SELF',
    },
    create: {
      tenantId: tenant.id,
      name: 'Sales',
      code: 'R_SALES',
      description: '业务员/客户经理',
      enabled: true,
      dataScope: 'SELF',
    },
  });

  const dept = await prisma.department.upsert({
    where: { orgId_name: { orgId: org.id, name: '移动端测试业务部' } },
    update: { tenantId: tenant.id, sort: 10 },
    create: {
      tenantId: tenant.id,
      orgId: org.id,
      name: '移动端测试业务部',
      sort: 10,
    },
  });

  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { tenantId_userName: { tenantId: tenant.id, userName: 'mobile_sales' } },
    update: {
      deptId: dept.id,
      nickName: '移动端测试业务员',
      email: 'mobile_sales@example.com',
      phone: '13818821494',
      gender: 'Unknown',
      status: 'ONLINE',
      passwordHash,
      updatedBy: 'hermes',
    },
    create: {
      tenantId: tenant.id,
      deptId: dept.id,
      userName: 'mobile_sales',
      nickName: '移动端测试业务员',
      email: 'mobile_sales@example.com',
      phone: '13818821494',
      gender: 'Unknown',
      status: 'ONLINE',
      passwordHash,
      createdBy: 'hermes',
      updatedBy: 'hermes',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  await prisma.department.update({ where: { id: dept.id }, data: { managerId: user.id } });

  const check = await prisma.user.findUnique({
    where: { tenantId_userName: { tenantId: tenant.id, userName: 'mobile_sales' } },
    include: { dept: { include: { org: true } }, roles: { include: { role: true } } },
  });

  console.log(JSON.stringify({
    id: check.id,
    tenantId: check.tenantId,
    userName: check.userName,
    nickName: check.nickName,
    deptId: check.deptId,
    deptName: check.dept?.name,
    orgId: check.dept?.orgId,
    orgCode: check.dept?.org?.code,
    roles: check.roles.map((r) => r.role.code),
    status: check.status,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
