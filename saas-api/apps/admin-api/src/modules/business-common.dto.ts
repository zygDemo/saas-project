/**
 * @deprecated 此文件已拆分到各模块 dto/ 目录。
 * - 共享装饰器 (ToNumber/ToDate/ToBoolean) 和基础 DTO (IdParamDto/PageQueryDto/OrgScopedQueryDto) 移至 common/dto/common.dto.ts
 * - 各业务 DTO 移至对应模块的 dto/ 目录
 * 此文件保留为 re-export barrel，后续应逐步迁移 import 路径。
 */

// 共享装饰器和基础 DTO
export { ToNumber, ToDate, ToBoolean, IdParamDto, PageQueryDto, OrgScopedQueryDto } from './common/dto/common.dto'

// 各业务模块 DTO
export { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './org/dto/org.dto'
export { CreateDeptDto, UpdateDeptDto, DeptQueryDto } from './dept/dto/dept.dto'
export { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product/dto/product.dto'
export { CreateFunderDto, UpdateFunderDto, FunderQueryDto } from './funder/dto/funder.dto'
export { CreateFlowConfigDto, UpdateFlowConfigDto, FlowConfigQueryDto } from './flow-config/dto/flow-config.dto'
export { CreateLeadFollowUpDto, CreateLeadDto, UpdateLeadDto, LeadQueryDto } from './lead/dto/lead.dto'
export { CustomerContactDto, VehicleDto, BankCardDto, CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './customer/dto/customer.dto'
export { ApplicationFileDto, CreateApplicationDto, UpdateApplicationDto, ApplicationQueryDto } from './application/dto/application.dto'
export { CreateApprovalDto, UpdateApprovalDto, ApprovalQueryDto } from './approval/dto/approval.dto'
export { CreateSigningDto, UpdateSigningDto, SigningQueryDto } from './signing/dto/signing.dto'
export { CreateDisbursementDto, UpdateDisbursementDto, DisbursementQueryDto } from './disbursement/dto/disbursement.dto'
export { CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto } from './repayment/dto/repayment.dto'
export { CreatePackagePlanDto, UpdatePackagePlanDto, PackagePlanQueryDto } from './package-plan/dto/package-plan.dto'
export { CreateProductTemplateDto, UpdateProductTemplateDto, ProductTemplateQueryDto } from './product-template/dto/product-template.dto'
export { CreateThirdPartyServiceDto, UpdateThirdPartyServiceDto, ThirdPartyServiceQueryDto } from './third-party-service/dto/third-party-service.dto'
export { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderQueryDto } from './work-order/dto/work-order.dto'
