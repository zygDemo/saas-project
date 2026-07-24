import { Test, TestingModule } from '@nestjs/testing'
import { MobileBusinessService } from './mobile-business.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { OcrService } from '../ocr/ocr.service'
import { MobileFileService } from './mobile-file.service'
import { MobileCustomerService } from './mobile-customer.service'
import { MobileVehicleService } from './mobile-vehicle.service'
import { MobileCreditService } from './mobile-credit.service'
import { MobileContactService } from './mobile-contact.service'
import { MobileLeadService } from './mobile-lead.service'
import { MobileSigningService } from './mobile-signing.service'
import { MobileBankCardService } from './mobile-bank-card.service'
import { MobilePostLoanService } from './mobile-post-loan.service'

jest.mock('../../common/tenant/tenant-context', () => ({
  getCurrentTenantId: jest.fn(() => 1),
  getRequiredTenantId: jest.fn(() => 1),
}))

describe('MobileBusinessService', () => {
  let service: MobileBusinessService

  const createMock = () => ({
    file: { upload: jest.fn(), uploadWithType: jest.fn(), getFileList: jest.fn(), deleteFile: jest.fn(), getProductFileList: jest.fn() },
    ocr: { recognizeIdCard: jest.fn(), recognizeIdCardByObjectKey: jest.fn(), recognizeVehicle: jest.fn(), recognizeVehicleByObjectKey: jest.fn() },
    customer: { getList: jest.fn(), getUserList: jest.fn(), getDetail: jest.fn(), create: jest.fn(), update: jest.fn() },
    vehicle: { getList: jest.fn(), getDetail: jest.fn(), create: jest.fn(), update: jest.fn() },
    credit: { getList: jest.fn(), getDetail: jest.fn(), create: jest.fn(), update: jest.fn() },
    contact: { getList: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    lead: { getList: jest.fn(), getDetail: jest.fn(), create: jest.fn(), update: jest.fn() },
    signing: { start: jest.fn(), getDetail: jest.fn() },
    bankCard: { getList: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    postLoan: { getList: jest.fn(), getDetail: jest.fn() },
  })

  beforeEach(async () => {
    const mocks = createMock()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileBusinessService,
        { provide: PrismaService, useValue: { $transaction: jest.fn((arr: unknown[]) => Promise.all(arr)) } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: OcrService, useValue: mocks.ocr },
        { provide: MobileFileService, useValue: mocks.file },
        { provide: MobileCustomerService, useValue: mocks.customer },
        { provide: MobileVehicleService, useValue: mocks.vehicle },
        { provide: MobileCreditService, useValue: mocks.credit },
        { provide: MobileContactService, useValue: mocks.contact },
        { provide: MobileLeadService, useValue: mocks.lead },
        { provide: MobileSigningService, useValue: mocks.signing },
        { provide: MobileBankCardService, useValue: mocks.bankCard },
        { provide: MobilePostLoanService, useValue: mocks.postLoan },
      ],
    }).compile()
    service = module.get<MobileBusinessService>(MobileBusinessService)
  })

  it('应将文件操作委托给 MobileFileService', async () => {
    await service.upload(undefined as any, {} as any)
    expect(service['fileService'].upload).toHaveBeenCalled()
  })

  it('应将 OCR 委托给 OcrService', async () => {
    await service.getIdCardOcr({} as any)
    expect(service['ocrService'].recognizeIdCardByObjectKey).toHaveBeenCalled()
  })

  it('应将客户操作委托给 MobileCustomerService', async () => {
    await service.getUserList({} as any)
    expect(service['customerService'].getUserList).toHaveBeenCalled()
  })
})
