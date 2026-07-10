import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { RequestUser } from '../../common/types/request-user'
import { MobileIdCardInfoDto, MobileCustomerExtraDto, MobileUserListQueryDto } from './dto/mobile-business.dto'
import { mapGender, parseBirthDate, formatDateTime, mapCustomer, guardMobileEntryStorageAsync } from './mobile-business.utils'
import { getDefaultOrg, findCustomerByUuid, getCustomerByUuid, ensureCustomerDraftApplication } from './mobile-business.db-helpers'
import { MobileFileService } from './mobile-file.service'
import { getRequiredTenantId } from '../../common/utils/helpers'

@Injectable()
export class MobileCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fileService: MobileFileService
  ) {}

  async addOrUpdateUserBasic(dto: MobileIdCardInfoDto & Partial<MobileCustomerExtraDto>, user: RequestUser, headerOrgId?: number) {
    return guardMobileEntryStorageAsync(async () => {
      const org = await getDefaultOrg(this.prisma, headerOrgId)
      const customerByUuid = dto.uuid ? await findCustomerByUuid(this.prisma, dto.uuid) : null
      const customerByPhone = customerByUuid
        ? null
        : await this.prisma.customer.findFirst({ where: { orgId: org.id, phone: dto.telephone } })
      const data: Record<string, any> = {
        orgId: customerByUuid?.orgId ?? customerByPhone?.orgId ?? org.id,
        name: dto.personName,
        phone: dto.telephone,
        idCard: dto.personIdcard,
        gender: mapGender(dto.gender),
        birthDate: parseBirthDate(dto.personIdcard),
        nation: dto.race,
        householdAddress: dto.personAddress,
        issuingAuthority: dto.personIssuingAuthority,
        idCardValidFrom: dto.personValidDateStart,
        idCardValidTo: dto.personValidDateEnd,
        idCardFront: dto.idcardFront,
        idCardBack: dto.idcardBack,
        address: dto.personAddress,
        status: 'ACTIVE'
      }

      if (dto.dwellingCondition !== undefined) data.dwellingCondition = dto.dwellingCondition
      if (dto.liveProvince !== undefined) data.liveProvince = dto.liveProvince
      if (dto.liveCity !== undefined) data.liveCity = dto.liveCity
      if (dto.liveDistrict !== undefined) data.liveDistrict = dto.liveDistrict
      if (dto.liveDetailedAddress !== undefined) data.liveDetailedAddress = dto.liveDetailedAddress
      if (
        dto.liveAddress !== undefined &&
        dto.liveDetailedAddress === undefined &&
        !dto.liveProvince &&
        !dto.liveCity &&
        !dto.liveDistrict
      ) {
        data.liveDetailedAddress = dto.liveAddress
      }
      if (dto.marriage !== undefined) data.maritalStatus = dto.marriage
      if (dto.personIncome !== undefined) data.monthlyIncome = dto.personIncome
      if (dto.childrenNum !== undefined) data.childrenNum = dto.childrenNum
      if (dto.education !== undefined) data.education = dto.education
      if (dto.degree !== undefined) data.degree = dto.degree
      if (dto.personOccupation !== undefined) data.occupation = dto.personOccupation
      if (dto.workingName !== undefined) data.companyName = dto.workingName
      if (dto.workingProvince !== undefined) data.workingProvince = dto.workingProvince
      if (dto.workingCity !== undefined) data.workingCity = dto.workingCity
      if (dto.workingDistrict !== undefined) data.workingDistrict = dto.workingDistrict
      if (dto.workingDetailedAddress !== undefined) data.workingDetailedAddress = dto.workingDetailedAddress
      if (dto.workingTelephone !== undefined) data.workingTelephone = dto.workingTelephone

      const customer =
        customerByUuid || customerByPhone
          ? await this.prisma.customer.update({
              where: { id: (customerByUuid || customerByPhone).id },
              data
            })
          : await this.prisma.customer.create({ data })

      await this.fileService.linkCustomerImages(customer, dto.idcardFront, dto.idcardBack, user)

      const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
      const mappedCustomer = mapCustomer(customer, apiPrefix)
      if (!dto.createOrder) return mappedCustomer

      const application = await ensureCustomerDraftApplication(this.prisma, customer, user, {
        businessType: dto.businessType
      })
      await this.fileService.linkApplicationFiles(application, customer)

      return {
        ...mappedCustomer,
        creditOrderId: application.applicationNo,
        applicationId: application.id,
        currentNode: application.currentNode,
        currentStatus: application.currentStatus
      }
    })
  }

  async getUserBasic(uuid: string) {
    return guardMobileEntryStorageAsync(async () => {
      const tenantId = getRequiredTenantId()
      const customer = await getCustomerByUuid(this.prisma, uuid, tenantId)
      const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
      return mapCustomer(customer, apiPrefix)
    })
  }

  async getUserList(query: MobileUserListQueryDto) {
    return guardMobileEntryStorageAsync(async () => {
      const where: Record<string, unknown> = {}
      if (query.personName) where.name = { contains: query.personName, mode: 'insensitive' }

      const customers = await this.prisma.customer.findMany({
        where,
        orderBy: { id: 'desc' },
        take: 100
      })

      const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
      const rows = customers.map((customer: any) => ({
        ...mapCustomer(customer, apiPrefix),
        dataSource: query.dataSource ?? 2,
        approval: 4,
        updateTime: formatDateTime(customer.updatedAt)
      }))

      return {
        code: 200,
        msg: 'success',
        data: rows,
        rows,
        total: customers.length
      }
    })
  }
}
