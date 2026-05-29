import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000/saas/api'
const tenantCode = 'default'
const password = '123456'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> HTTP ${res.status}: ${text}`)
  }
  if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
    throw new Error(`${options.method || 'GET'} ${path} -> API ${body.code}: ${body.msg || text}`)
  }
  return body?.data ?? body
}

function post(path, data, token, tenantId) {
  return request(path, {
    method: 'POST',
    headers: authHeaders(token, tenantId),
    body: JSON.stringify(data || {})
  })
}

function get(path, token, tenantId) {
  return request(path, { headers: authHeaders(token, tenantId) })
}

function authHeaders(token, tenantId) {
  const headers = {}
  if (tenantId) headers['x-tenant-id'] = String(tenantId)
  if (token) headers.authorization = token
  return headers
}

async function ensureSeed() {
  const tenant = await prisma.tenant.upsert({
    where: { code: tenantCode },
    update: {},
    create: { name: 'Default Tenant', code: tenantCode }
  })

  const passwordHash = await bcrypt.hash(password, 10)
  const role = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'R_SUPER' } },
    update: { name: 'Super Admin', description: 'Smoke super admin', dataScope: 'ALL' },
    create: { tenantId: tenant.id, name: 'Super Admin', code: 'R_SUPER', description: 'Smoke super admin', dataScope: 'ALL' }
  })

  const user = await prisma.user.upsert({
    where: { tenantId_userName: { tenantId: tenant.id, userName: 'Super' } },
    update: { nickName: 'Super Admin', passwordHash, status: 'ONLINE' },
    create: {
      tenantId: tenant.id,
      userName: 'Super',
      nickName: 'Super Admin',
      email: 'super@example.com',
      phone: '13800000001',
      gender: 'Male',
      status: 'ONLINE',
      passwordHash
    }
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id }
  })

  return { tenant, user }
}

async function main() {
  const { tenant, user } = await ensureSeed()

  const health = await request('/health')
  console.log('health:', JSON.stringify(health))

  const docs = await request('/docs-json')
  const requiredPaths = [
    '/saas/api/application',
    '/saas/api/application/list',
    '/saas/api/application/{id}/submit',
    '/saas/api/application/{id}/approve',
    '/saas/api/application/{id}/start-signing',
    '/saas/api/application/{id}/complete-signing',
    '/saas/api/application/{id}/gps-installed',
    '/saas/api/application/{id}/mortgage-done',
    '/saas/api/application/{id}/confirm-disbursement'
  ]
  for (const path of requiredPaths) {
    assert(docs.paths?.[path], `Swagger missing path: ${path}`)
  }
  console.log('swagger:', `found ${requiredPaths.length} required application paths`)

  const login = await post('/auth/login', { userName: 'Super', password }, null, tenant.id)
  assert(login.token?.startsWith('Bearer '), 'login token missing')
  const token = login.token
  console.log('login:', 'ok')

  const suffix = Date.now().toString().slice(-8)
  const org = await post('/org', {
    name: `烟测机构${suffix}`,
    code: `SMOKE${suffix}`,
    contactName: '烟测联系人',
    contactPhone: '13818821494',
    status: 'ACTIVE',
    packageType: 'STANDARD',
    apiEnabled: true
  }, token, tenant.id)

  const product = await post('/product', {
    orgId: org.id,
    name: `车贷产品${suffix}`,
    productType: 'CAR_LOAN',
    minRate: 0.036,
    maxRate: 0.12,
    minAmount: 10000,
    maxAmount: 500000,
    minTerm: 12,
    maxTerm: 36,
    repaymentMethod: '等额本息',
    status: 'ACTIVE'
  }, token, tenant.id)

  const funder = await post('/funder', {
    orgId: org.id,
    name: `烟测资方${suffix}`,
    code: `FD${suffix}`,
    funderType: 'BANK',
    contactName: '资方联系人',
    contactPhone: '13800000009',
    status: 'ACTIVE'
  }, token, tenant.id)

  const customer = await post('/customer', {
    orgId: org.id,
    name: `烟测客户${suffix}`,
    phone: `139${suffix.padStart(8, '0')}`,
    gender: 'UNKNOWN',
    status: 'ACTIVE',
    vehicles: [{ vin: `VIN${suffix}`, plateNumber: `沪A${suffix.slice(-5)}`, brand: 'Tesla', model: 'Model 3', estimateValue: 180000 }],
    bankCards: [{ bankName: '招商银行', cardNo: `622588${suffix}`, cardType: 'DEBIT', isDefault: true }]
  }, token, tenant.id)

  const application = await post('/application', {
    orgId: org.id,
    customerId: customer.id,
    productId: product.id,
    funderId: funder.id,
    amount: 120000,
    term: 24,
    rate: 6.8,
    repaymentMethod: '等额本息',
    creatorId: user.id,
    purpose: '购车周转'
  }, token, tenant.id)
  assert(application.status === 'DRAFT', `expected DRAFT, got ${application.status}`)

  const steps = []
  const submit = await post(`/application/${application.id}/submit`, {}, token, tenant.id)
  steps.push(['submit', submit.status])
  assert(submit.status === 'PENDING_FIRST_REVIEW', `submit status ${submit.status}`)

  const firstApprove = await post(`/application/${application.id}/approve`, {
    approverId: user.id,
    opinion: '初审通过',
    amount: 120000,
    term: 24,
    rate: 6.8
  }, token, tenant.id)
  steps.push(['approve-first', firstApprove.status])
  assert(firstApprove.status === 'PENDING_FINAL_REVIEW', `first approve status ${firstApprove.status}`)

  const finalApprove = await post(`/application/${application.id}/approve`, {
    approverId: user.id,
    stage: 'FINAL_REVIEW',
    opinion: '终审通过',
    amount: 118000,
    term: 24,
    rate: 6.6
  }, token, tenant.id)
  steps.push(['approve-final', finalApprove.status])
  assert(finalApprove.status === 'FINAL_REVIEW_PASSED', `final approve status ${finalApprove.status}`)

  const startSigning = await post(`/application/${application.id}/start-signing`, {
    contractUrl: 'https://example.com/contract.pdf'
  }, token, tenant.id)
  steps.push(['start-signing', startSigning.status])
  assert(startSigning.status === 'PENDING_SIGN', `start signing status ${startSigning.status}`)

  const completeSigning = await post(`/application/${application.id}/complete-signing`, {
    contractUrl: 'https://example.com/contract-signed.pdf',
    videoUrl: 'https://example.com/video.mp4'
  }, token, tenant.id)
  steps.push(['complete-signing', completeSigning.status])
  assert(completeSigning.status === 'PENDING_DISBURSEMENT', `complete signing status ${completeSigning.status}`)

  const gps = await post(`/application/${application.id}/gps-installed`, {
    gpsDeviceNo: `GPS${suffix}`,
    gpsInstallImg: 'https://example.com/gps.jpg'
  }, token, tenant.id)
  steps.push(['gps-installed', gps.status])
  assert(gps.status === 'GPS_INSTALLED', `gps status ${gps.status}`)

  const mortgage = await post(`/application/${application.id}/mortgage-done`, {
    mortgageStatus: 'DONE',
    mortgageImg: 'https://example.com/mortgage.jpg'
  }, token, tenant.id)
  steps.push(['mortgage-done', mortgage.status])
  assert(mortgage.status === 'MORTGAGE_DONE', `mortgage status ${mortgage.status}`)

  const disbursed = await post(`/application/${application.id}/confirm-disbursement`, {
    disburseAmount: 118000,
    disburseAccount: '招商银行 622588',
    transactionNo: `TX${suffix}`,
    voucherUrl: 'https://example.com/voucher.jpg',
    remark: '烟测放款确认'
  }, token, tenant.id)
  steps.push(['confirm-disbursement', disbursed.status])
  assert(disbursed.status === 'DISBURSED', `disbursed status ${disbursed.status}`)

  const detail = await get(`/application/${application.id}`, token, tenant.id)
  assert(detail.status === 'DISBURSED', `detail status ${detail.status}`)
  assert(detail.signRecord?.status === 'SIGNED', 'signRecord not signed')
  assert(detail.disbursement?.status === 'DISBURSED', 'disbursement not disbursed')

  console.log('application:', `${application.id} ${application.applicationNo}`)
  for (const [name, status] of steps) console.log(`${name}: ${status}`)
  console.log('detail:', `status=${detail.status}, sign=${detail.signRecord.status}, disbursement=${detail.disbursement.status}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
