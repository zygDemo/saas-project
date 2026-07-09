import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { RequestUser } from '../../common/types/request-user'
import { MobileVehicleInfoDto } from './dto/mobile-business.dto'
import { centToYuan, parseDate, mapVehicle, guardMobileEntryStorageAsync } from './mobile-business.utils'
import { getCustomerByUuid, findLatestDraftApplication } from './mobile-business.db-helpers'
import { MobileFileService } from './mobile-file.service'
import { getRequiredTenantId } from '../../common/utils/helpers'

@Injectable()
export class MobileVehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fileService: MobileFileService
  ) {}

  async addOrUpdateVehicle(dto: MobileVehicleInfoDto, user: RequestUser) {
    return guardMobileEntryStorageAsync(async () => {
      const tenantId = getRequiredTenantId()
      const customer = await getCustomerByUuid(this.prisma, dto.uuid, tenantId)
      const current = await this.prisma.vehicle.findFirst({
        where: {
          customerId: customer.id,
          OR: [{ vin: dto.vehicleCode }, { plateNumber: dto.plateNumber }]
        }
      })
      const data = {
        customerId: customer.id,
        vin: dto.vehicleCode,
        plateNumber: dto.plateNumber,
        brand: dto.vehicleBrand,
        model: dto.vehicleModel,
        ownerName: dto.vehicleOwner,
        address: dto.address,
        usageNature: dto.usageNature,
        sealInfo: dto.sealInfo,
        engineNumber: dto.engineNumber,
        registerDate: parseDate(dto.registerDate),
        vehicleImgUrl: dto.vehicleImgUrl,
        color: dto.vehicleColor,
        mileage: Number(dto.mileage),
        purchasePrice: centToYuan(dto.purchasePrice),
        isMortgaged: dto.isMortgage === 1,
        mortgageInfo: dto.isMortgage === 1 ? '已抵押' : undefined
      }

      const vehicle = current
        ? await this.prisma.vehicle.update({ where: { id: current.id }, data })
        : await this.prisma.vehicle.create({ data })

      if (dto.vehicleImgUrl) {
        await this.fileService.createFileAsset({
          orgId: customer.orgId,
          businessType: 'VEHICLE',
          businessId: vehicle.id,
          categoryCode: 'VEHICLE_LICENSE',
          categoryName: '行驶证',
          reference: dto.vehicleImgUrl,
          user
        })
      }

      const application = await findLatestDraftApplication(this.prisma, customer.id)
      if (application && application.currentNode < 1110) {
        await this.prisma.application.update({
          where: { id: application.id },
          data: { currentNode: 1110, currentStatus: 10 }
        })
      }

      const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
      return mapVehicle(vehicle, dto.uuid, apiPrefix)
    })
  }

  async getVehicleInfo(uuid: string) {
    return guardMobileEntryStorageAsync(async () => {
      const tenantId = getRequiredTenantId()
      const customer = await getCustomerByUuid(this.prisma, uuid, tenantId)
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { customerId: customer.id },
        orderBy: { id: 'desc' }
      })
      if (!vehicle) return null
      const apiPrefix = this.config.get<string>('API_PREFIX', 'saas/api')
      return mapVehicle(vehicle, uuid, apiPrefix)
    })
  }
}
