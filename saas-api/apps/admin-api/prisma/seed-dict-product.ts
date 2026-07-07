import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始添加字典和产品数据...')

  // 获取默认租户
  const tenant = await prisma.tenant.findFirst({
    where: { status: 'active' }
  })

  if (!tenant) {
    console.error('未找到活跃租户')
    return
  }

  console.log(`使用租户: ${tenant.name} (ID: ${tenant.id})`)

  // 1. 添加贷款用途字典类型
  const dictType = await prisma.dictType.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'loan_purpose'
      }
    },
    update: {
      name: '贷款用途',
      status: 'ACTIVE'
    },
    create: {
      tenantId: tenant.id,
      name: '贷款用途',
      code: 'loan_purpose',
      status: 'ACTIVE',
      remark: '车贷业务贷款用途字典'
    }
  })

  console.log(`字典类型已创建/更新: ${dictType.name} (ID: ${dictType.id})`)

  // 2. 添加贷款用途字典数据
  const loanPurposes = [
    { label: '消费', value: '1', sort: 1 },
    { label: '经营', value: '2', sort: 2 },
    { label: '装修', value: '3', sort: 3 },
    { label: '教育', value: '4', sort: 4 },
    { label: '医疗', value: '5', sort: 5 },
    { label: '旅游', value: '6', sort: 6 },
    { label: '其他', value: '99', sort: 99 }
  ]

  for (const purpose of loanPurposes) {
    await prisma.dictData.upsert({
      where: {
        tenantId_typeId_value: {
          tenantId: tenant.id,
          typeId: dictType.id,
          value: purpose.value
        }
      },
      update: {
        label: purpose.label,
        sort: purpose.sort,
        status: 'ACTIVE'
      },
      create: {
        tenantId: tenant.id,
        typeId: dictType.id,
        label: purpose.label,
        value: purpose.value,
        sort: purpose.sort,
        status: 'ACTIVE'
      }
    })
  }

  console.log(`已添加 ${loanPurposes.length} 条贷款用途字典数据`)

  // 3. 获取默认组织
  const org = await prisma.organization.findFirst({
    where: { tenantId: tenant.id, status: 'ACTIVE' }
  })

  if (!org) {
    console.error('未找到活跃组织')
    return
  }

  console.log(`使用组织: ${org.name} (ID: ${org.id})`)

  // 4. 添加产品数据
  const products = [
    {
      name: '车抵贷标准产品',
      productType: '抵押贷',
      minRate: 0.06,
      maxRate: 0.12,
      minAmount: 50000,
      maxAmount: 500000,
      minTerm: 12,
      maxTerm: 36,
      repaymentMethod: '等额本息',
      minAge: 18,
      maxAge: 65,
      maxCarAge: 10,
      maxMileage: 150000,
      ltvLimit: 0.8,
      minDownPayment: 0.2,
      status: 'ACTIVE'
    },
    {
      name: '车抵贷优质客户产品',
      productType: '抵押贷',
      minRate: 0.05,
      maxRate: 0.10,
      minAmount: 100000,
      maxAmount: 1000000,
      minTerm: 12,
      maxTerm: 48,
      repaymentMethod: '等额本息',
      minAge: 22,
      maxAge: 60,
      maxCarAge: 8,
      maxMileage: 100000,
      ltvLimit: 0.7,
      minDownPayment: 0.3,
      status: 'ACTIVE'
    },
    {
      name: '车信贷产品',
      productType: '信用贷',
      minRate: 0.08,
      maxRate: 0.18,
      minAmount: 30000,
      maxAmount: 200000,
      minTerm: 6,
      maxTerm: 24,
      repaymentMethod: '等额本息',
      minAge: 22,
      maxAge: 55,
      status: 'ACTIVE'
    }
  ]

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: tenant.id,
        orgId: org.id,
        name: product.name
      }
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...product,
          maxTerm: product.maxTerm || product.maxTerm
        }
      })
      console.log(`产品已更新: ${product.name}`)
    } else {
      await prisma.product.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          ...product
        }
      })
      console.log(`产品已创建: ${product.name}`)
    }
  }

  console.log(`已添加/更新 ${products.length} 个产品`)
  console.log('字典和产品数据添加完成!')
}

main()
  .catch((e) => {
    console.error('添加字典和产品数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
