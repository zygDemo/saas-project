import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFile } from 'fs/promises'
import { basename, extname, resolve, sep } from 'path'
import { OcrObjectKeyDto } from './dto/ocr.dto'

const OCR_DEFAULT_URL = 'https://www.yugui.store/saas/ocr'
const OCR_SERVICE_DEFAULT_TIMEOUT_MS = 60_000
const OCR_IMAGE_LIMIT = 8 * 1024 * 1024
const ALLOWED_OCR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp'])
const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp'
}
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/bmp': '.bmp'
}
const ID_CARD_NATION_CODES: Record<string, string> = {
  汉: '1',
  回: '2',
  满: '3',
  藏: '4',
  阿昌: '5',
  白: '6',
  保安: '7',
  布朗: '8',
  布依: '9',
  朝鲜: '10',
  达斡尔: '11',
  傣: '12',
  德昂: '13',
  侗: '14',
  东乡: '15',
  独龙: '16',
  鄂伦春: '17',
  俄罗斯: '18',
  鄂温克: '19',
  高山: '20',
  仡佬: '21',
  哈尼: '22',
  哈萨克: '23',
  赫哲: '24',
  基诺: '25',
  京: '26',
  景颇: '27',
  柯尔克孜: '28',
  拉祜: '29',
  黎: '30',
  傈僳: '31',
  珞巴: '32',
  毛南: '33',
  门巴: '34',
  蒙古: '35',
  苗: '36',
  仫佬: '37',
  纳西: '38',
  怒: '39',
  普米: '40',
  羌: '41',
  撒拉: '42',
  畲: '43',
  水: '44',
  塔吉克: '45',
  塔塔尔: '46',
  土: '47',
  佤: '48',
  锡伯: '49',
  乌兹别克: '50',
  乌孜别克: '50',
  瑶: '51',
  彝: '52',
  裕固: '53',
  维吾尔: '54',
  壮: '55',
  土家: '56'
}
const ID_CARD_NATIONS = Object.keys(ID_CARD_NATION_CODES).sort((a, b) => b.length - a.length)

export interface OcrImageFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

export interface OcrRecognizeResult extends Record<string, unknown> {
  success: boolean
  text: string
  items: unknown[]
}

export interface IdCardFrontParsed {
  name: string
  gender: string
  nation: string
  birth: string
  address: string
  idNum: string
}

export interface IdCardBackParsed {
  authority: string
  validDate: string
}

export interface VehicleOcrParsed {
  plateNumber: string
  vehicleType: string
  owner: string
  address: string
  useCharacter: string
  model: string
  vin: string
  engineNumber: string
  registerDate: string
  issueDate: string
  sealInfo: string
}

@Injectable()
export class OcrService {
  constructor(private readonly config: ConfigService) {}

  async health() {
    const response = await this.fetchWithTimeout(this.getHealthEndpoint(), {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    if (!response.ok) {
      throw new BadGatewayException(`OCR 服务健康检查失败：${response.status}`)
    }
    return this.readResponsePayload(response)
  }

  async recognize(file: OcrImageFile | undefined) {
    this.validateFile(file)
    const response = await this.postImage(file)
    const payload = await this.readResponsePayload(response)

    if (!response.ok) {
      throw new BadGatewayException(this.extractPayloadMessage(payload) || `OCR 服务异常：${response.status}`)
    }

    const result = this.normalizeRecognizeResult(payload)
    if (result.success === false) {
      throw new BadGatewayException(this.extractPayloadMessage(payload) || 'OCR 识别失败')
    }

    return result
  }

  async recognizeByObjectKey(dto: OcrObjectKeyDto) {
    const file = await this.loadUploadedImage(dto)
    return this.recognize(file)
  }

  async recognizeVehicle(file: OcrImageFile | undefined) {
    return this.withVehicleFields(await this.recognize(file))
  }

  async recognizeVehicleByObjectKey(dto: OcrObjectKeyDto) {
    return this.withVehicleFields(await this.recognizeByObjectKey(dto))
  }

  async recognizeIdCard(file: OcrImageFile | undefined, side?: 'front' | 'back') {
    return this.withIdCardFields(await this.recognize(file), side)
  }

  async recognizeIdCardByObjectKey(dto: OcrObjectKeyDto) {
    return this.withIdCardFields(await this.recognizeByObjectKey(dto), dto.side)
  }

  private async postImage(file: OcrImageFile) {
    const form = new FormData()
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      this.normalizeFilename(file.originalname, file.mimetype)
    )

    return this.fetchWithTimeout(this.getRecognizeEndpoint(), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: form
    })
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs())

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('OCR 服务请求超时')
      }
      throw new BadGatewayException('OCR 服务不可用')
    } finally {
      clearTimeout(timeout)
    }
  }

  private async readResponsePayload(response: Response): Promise<unknown> {
    const text = await response.text()
    if (!text) return null

    try {
      return JSON.parse(text) as unknown
    } catch {
      return { text }
    }
  }

  private normalizeRecognizeResult(payload: unknown): OcrRecognizeResult {
    if (!payload || typeof payload !== 'object') {
      return {
        success: true,
        text: typeof payload === 'string' ? payload : '',
        items: []
      }
    }

    const record = payload as Record<string, unknown>
    const items = Array.isArray(record.items) ? record.items : []
    const text = typeof record.text === 'string' ? record.text : this.extractTextFromItems(items)
    const success = typeof record.success === 'boolean' ? record.success : true

    return {
      ...record,
      success,
      text,
      items
    }
  }

  private extractTextFromItems(items: unknown[]) {
    return items
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && typeof (item as { text?: unknown }).text === 'string') {
          return (item as { text: string }).text
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  private extractPayloadMessage(payload: unknown) {
    if (!payload || typeof payload !== 'object') return undefined
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.msg === 'string') return record.msg
    if (typeof record.error === 'string') return record.error
    return undefined
  }

  private validateFile(file: OcrImageFile | undefined): asserts file is OcrImageFile {
    if (!file) throw new BadRequestException('请选择要识别的图片')
    if (!file.buffer?.length) throw new BadRequestException('图片内容不能为空')
    if (file.size > OCR_IMAGE_LIMIT || file.buffer.length > OCR_IMAGE_LIMIT) {
      throw new BadRequestException('图片大小不能超过 8MB')
    }
    if (!ALLOWED_OCR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('OCR 仅支持 jpg、png、webp、bmp 图片')
    }
  }

  private async loadUploadedImage(dto: OcrObjectKeyDto): Promise<OcrImageFile> {
    const objectKey = this.resolveObjectKey(dto)
    const extension = extname(objectKey).toLowerCase()
    const mimetype = MIME_TYPE_BY_EXTENSION[extension]
    if (!mimetype) throw new BadRequestException('OCR 仅支持 jpg、png、webp、bmp 图片')

    const uploadsRoot = resolve(process.cwd(), 'uploads')
    const absolutePath = resolve(uploadsRoot, objectKey)
    if (absolutePath !== uploadsRoot && !absolutePath.startsWith(`${uploadsRoot}${sep}`)) {
      throw new BadRequestException('文件路径不合法')
    }

    let buffer: Buffer
    try {
      buffer = await readFile(absolutePath)
    } catch (error) {
      if (error && typeof error === 'object' && (error as { code?: unknown }).code === 'ENOENT') {
        throw new NotFoundException('图片文件不存在')
      }
      throw error
    }

    return {
      originalname: basename(objectKey),
      mimetype,
      size: buffer.length,
      buffer
    }
  }

  private resolveObjectKey(dto: OcrObjectKeyDto) {
    const input = dto.objectKey || dto.fileKey || dto.url || dto.fileUrl
    if (!input?.trim()) throw new BadRequestException('objectKey 不能为空')

    let value = input.trim()
    try {
      value = new URL(value).pathname
    } catch {
      // 不是完整 URL 时按 objectKey 处理。
    }

    const marker = '/uploads/'
    const markerIndex = value.indexOf(marker)
    if (markerIndex >= 0) value = value.slice(markerIndex + marker.length)

    value = value.split(/[?#]/)[0].replace(/\\/g, '/').replace(/^\/+/, '')
    if (!value || value.includes('\0')) throw new BadRequestException('objectKey 不合法')

    return value
  }

  private withVehicleFields(result: OcrRecognizeResult) {
    const parsed = this.parseVehicleText(result.text)
    return {
      ...result,
      parsed,
      fields: {
        plateNumber: parsed.plateNumber || undefined,
        vehicleBrand: parsed.vehicleType || undefined,
        vehicleModel: parsed.model || undefined,
        vehicleOwner: parsed.owner || undefined,
        address: parsed.address || undefined,
        usageNature: parsed.useCharacter || undefined,
        engineNumber: parsed.engineNumber || undefined,
        registerDate: parsed.registerDate || undefined,
        vehicleCode: parsed.vin || undefined,
        sealInfo: parsed.sealInfo || undefined
      }
    }
  }

  private withIdCardFields(result: OcrRecognizeResult, side?: 'front' | 'back') {
    const parsed =
      side === 'front'
        ? { side, front: this.parseIdCardFrontText(result.text) }
        : side === 'back'
          ? { side, back: this.parseIdCardBackText(result.text) }
          : {
              front: this.parseIdCardFrontText(result.text),
              back: this.parseIdCardBackText(result.text)
            }

    return {
      ...result,
      parsed,
      fields: this.buildIdCardFields(parsed)
    }
  }

  private buildIdCardFields(parsed: {
    front?: IdCardFrontParsed
    back?: IdCardBackParsed
  }) {
    const fields: Record<string, unknown> = {}
    if (parsed.front) {
      if (parsed.front.name) fields.personName = parsed.front.name
      if (parsed.front.idNum) fields.personIdcard = parsed.front.idNum
      const genderCode = this.getGenderCode(parsed.front.gender)
      if (genderCode) fields.gender = genderCode
      const race = this.getNationCode(parsed.front.nation)
      if (race) fields.race = race
      if (parsed.front.address) fields.personAddress = parsed.front.address
      if (parsed.front.birth) fields.birth = parsed.front.birth
    }
    if (parsed.back) {
      if (parsed.back.authority) fields.personIssuingAuthority = parsed.back.authority
      const validDate = this.parseValidDate(parsed.back.validDate)
      if (validDate.start) fields.personValidDateStart = validDate.start
      if (validDate.end) fields.personValidDateEnd = validDate.end
    }
    return fields
  }

  private parseIdCardFrontText(raw: string): IdCardFrontParsed {
    const result: IdCardFrontParsed = {
      name: '',
      gender: '',
      nation: '',
      birth: '',
      address: '',
      idNum: ''
    }

    let collectingAddress = false
    for (const line of this.getTextLines(raw)) {
      const nameMatch = line.match(
        /姓名[：:\s]*([\u4e00-\u9fff·]{2,10}?)(?=性别|民族|出生|生日|住址|地址|公民身份号码|身份证号|身份证|$)/
      )
      if (nameMatch) {
        result.name = nameMatch[1]
        collectingAddress = false
        const nameEndIndex = (nameMatch.index || 0) + nameMatch[0].length
        if (!/(?:性别|民族|出生|生日|住址|地址|公民身份号码|身份证号|身份证)/.test(line.slice(nameEndIndex))) {
          continue
        }
      }

      const genderMatch = line.match(/性别[：:\s]*(男|女)/)
      const nationMatch = line.match(/民族[：:\s]*([\u4e00-\u9fff]{1,12})/)
      if (genderMatch || nationMatch) {
        if (genderMatch) result.gender = genderMatch[1]
        if (nationMatch) result.nation = this.normalizeNation(nationMatch[1])
        collectingAddress = false
        if (!/(?:出生|生日|住址|地址|公民身份号码|身份证号|身份证)/.test(line)) continue
      }

      const birthMatch = line.match(/(?:出生|生日)[：:\s]*(\d{4})\D*(\d{1,2})\D*(\d{1,2})/)
      if (birthMatch) {
        result.birth = this.formatDateParts(birthMatch[1], birthMatch[2], birthMatch[3])
        collectingAddress = false
        continue
      }

      const addressMatch = line.match(/(?:住址|地址)[：:\s]*(.+)/)
      if (addressMatch) {
        result.address = addressMatch[1]
        collectingAddress = true
        continue
      }

      const idMatch = line.match(/(?:公民身份号码|身份证号|身份证)[：:\s]*(\d{17}[\dXx])/)
      if (idMatch) {
        result.idNum = idMatch[1].toUpperCase()
        collectingAddress = false
        continue
      }

      const pureIdMatch = line.match(/^(\d{17}[\dXx])$/)
      if (pureIdMatch) {
        result.idNum = pureIdMatch[1].toUpperCase()
        collectingAddress = false
        continue
      }

      if (collectingAddress && this.isIdCardAddressContinuation(line)) {
        result.address += line
      }
    }

    const compactText = raw.replace(/\s+/g, '')
    if (!result.gender) {
      const genderMatch = compactText.match(/性别[：:\s]*(男|女)/)
      if (genderMatch) result.gender = genderMatch[1]
    }
    if (!result.nation) {
      const nationMatch = compactText.match(/民族[：:\s]*([\u4e00-\u9fff]{1,12})/)
      if (nationMatch) result.nation = this.normalizeNation(nationMatch[1])
    }

    return result
  }

  private getGenderCode(value: string) {
    if (value === '男') return 1
    if (value === '女') return 2
    return undefined
  }

  private normalizeNation(value: string) {
    const text = value
      .replace(/[^\u4e00-\u9fff]/g, '')
      .replace(/^民族/, '')
      .replace(/族族/g, '族')
    if (!text) return ''

    const nation = ID_CARD_NATIONS.find(
      (item) => text === item || text === `${item}族` || text.startsWith(`${item}族`) || text.startsWith(item)
    )
    if (nation) return nation

    const fallback = text.match(/^([\u4e00-\u9fff]{1,4})族?/)
    return fallback?.[1] || ''
  }

  private getNationCode(value: string) {
    if (/^\d+$/.test(value)) return value
    const nation = this.normalizeNation(value)
    return nation ? ID_CARD_NATION_CODES[nation] : undefined
  }

  private isIdCardAddressContinuation(line: string) {
    if (!line) return false
    if (/^(?:姓名|性别|民族|出生|生日|住址|地址|公民身份号码|身份证号|身份证|签发机关|发证机关|有效期限|有效期)/.test(line)) {
      return false
    }
    if (/^\d{17}[\dXx]$/.test(line)) return false
    return /[\u4e00-\u9fffA-Za-z0-9-]/.test(line)
  }

  private parseIdCardBackText(raw: string): IdCardBackParsed {
    const result: IdCardBackParsed = { authority: '', validDate: '' }

    for (const line of this.getTextLines(raw)) {
      const authorityMatch = line.match(/(?:签发机关|发证机关)[：:\s]*(.+)/)
      if (authorityMatch) {
        result.authority = authorityMatch[1]
        continue
      }

      const validDateMatch = line.match(/(?:有效期限|有效期)[：:\s]*(.+)/)
      if (validDateMatch) result.validDate = validDateMatch[1]
    }

    return result
  }

  private parseVehicleText(raw: string): VehicleOcrParsed {
    const result: VehicleOcrParsed = {
      plateNumber: '',
      vehicleType: '',
      owner: '',
      address: '',
      useCharacter: '',
      model: '',
      vin: '',
      engineNumber: '',
      registerDate: '',
      issueDate: '',
      sealInfo: ''
    }

    const lines = this.getTextLines(raw)
    const getValue = (index: number, keywordPattern: RegExp, valuePattern?: RegExp) => {
      const sameLine = lines[index].replace(keywordPattern, '').replace(/^[：:\s]+/, '').trim()
      if (sameLine && (!valuePattern || valuePattern.test(sameLine))) return sameLine

      for (let offset = 1; offset <= 3; offset += 1) {
        const nextLine = lines[index + offset]
        if (!nextLine) break
        if (this.isVehicleOcrNoiseLine(nextLine)) continue
        if (this.isVehicleFieldLabel(nextLine)) break
        if (!valuePattern || valuePattern.test(nextLine)) return nextLine
      }
      return ''
    }

    lines.forEach((line, index) => {
      if (!result.plateNumber && /(?:号牌号码|车牌号)/.test(line)) {
        result.plateNumber = this.normalizePlateNumber(
          getValue(index, /.*?(?:号牌号码|车牌号)[：:\s]*/, /[\u4e00-\u9fffA-Z0-9]{6,8}/i)
        )
      }
      if (!result.vehicleType && /车辆类型/.test(line)) {
        result.vehicleType = getValue(index, /.*?车辆类型[：:\s]*/, /[\u4e00-\u9fffA-Za-z]/)
      }
      if (!result.owner && /(?:所有人|车主)/.test(line)) {
        result.owner = getValue(index, /.*?(?:所有人|车主)[：:\s]*/, /[\u4e00-\u9fffA-Za-z]/)
      }
      if (!result.address && /(?:住址|地址|^住$|^址)/.test(line)) {
        result.address = this.normalizeVehicleAddress(
          getValue(index, /.*?(?:住址|地址)[：:\s]*|^住[：:\s]*|^址[：:\s]*/, /[\u4e00-\u9fffA-Za-z0-9]/)
        )
      }
      if (!result.useCharacter && /使用性质/.test(line)) {
        result.useCharacter = getValue(index, /.*?使用性质[：:\s]*/, /[\u4e00-\u9fffA-Za-z]/)
      }
      if (!result.model && /(?:品牌型号|车辆型号)/.test(line)) {
        result.model = getValue(index, /.*?(?:品牌型号|车辆型号)[：:\s]*/, /[\u4e00-\u9fffA-Z0-9]/i)
      }
      if (!result.vin && /(?:车辆识别代号|车辆识别代码|车架号|VIN)/i.test(line)) {
        result.vin = this.normalizeVin(
          getValue(index, /.*?(?:车辆识别代号|车辆识别代码|车架号|VIN)[：:\s]*/i, /[A-HJ-NPR-Z0-9]{17}/i)
        )
      }
      if (!result.engineNumber && /发动机号/.test(line)) {
        result.engineNumber = this.normalizeEngineNumber(
          getValue(index, /.*?发动机号(?:码)?[：:\s]*/, /[A-Z0-9-]{5,30}/i)
        )
      }
      if (!result.registerDate && /(?:注册日期|注册日|注册目)/.test(line)) {
        result.registerDate = this.normalizeVehicleDate(
          getValue(index, /.*?(?:注册日期|注册日|注册目)[：:\s]*/, /\d{4}\D\d{1,2}\D\d{1,2}/)
        )
      }
      if (!result.issueDate && /(?:发证日期|发证日|发日期)/.test(line)) {
        result.issueDate = this.normalizeVehicleDate(
          getValue(index, /.*?(?:发证日期|发证日|发日期)[：:\s]*/, /\d{4}\D\d{1,2}\D\d{1,2}/)
        )
      }
    })

    const compactText = lines.join('\n')
    if (!result.plateNumber) result.plateNumber = this.normalizePlateNumber(compactText.match(/[\u4e00-\u9fff][A-Z0-9][A-Z0-9]{5,6}/i)?.[0] || '')
    if (!result.vin) result.vin = this.normalizeVin(compactText.match(/[A-HJ-NPR-Z0-9]{17}/i)?.[0] || '')
    if (!result.engineNumber) {
      const engineIndex = lines.findIndex((line) => /发动机号/.test(line))
      if (engineIndex >= 0) {
        const afterEngine = lines.slice(engineIndex, engineIndex + 4).join('\n')
        result.engineNumber = this.normalizeEngineNumber(afterEngine.match(/[A-Z0-9-]{5,30}/i)?.[0] || '')
      }
    }
    const dates = compactText.match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g) || []
    if (!result.registerDate && dates[0]) result.registerDate = this.formatDateText(dates[0])
    if (!result.issueDate && dates[1]) result.issueDate = this.formatDateText(dates[1])
    result.sealInfo = this.extractVehicleSealInfo(lines)

    return result
  }

  private isVehicleFieldLabel(line: string) {
    return /^(?:号牌号码|车牌号|车辆类型|所有人|车主|住址|地址|使用性质|品牌型号|车辆型号|车辆识别代号|车辆识别代码|车架号|发动机号|注册日期|注册日|注册目|发证日期|发证日|发日期|Plate|Vehicle|Owner|Address|Use|Model|VIN|Engine|Register|Issue)/i.test(line)
  }

  private isVehicleOcrNoiseLine(line: string) {
    return /^(?:Plate|Vehicle\s*Type|VehicleType|Owner|Owne|Address|Use\s*Char|Use\s*Character|Model|VIN|Engine\s*No|Register|Reglsier|Issue)/i.test(line)
  }

  private normalizePlateNumber(value: string) {
    return value.replace(/[^\u4e00-\u9fffA-Z0-9]/gi, '').toUpperCase()
  }

  private normalizeVin(value: string) {
    const match = value.replace(/[^A-Z0-9]/gi, '').match(/[A-HJ-NPR-Z0-9]{17}/i)
    return match?.[0].toUpperCase() || ''
  }

  private normalizeEngineNumber(value: string) {
    const match = value.replace(/[^A-Z0-9-]/gi, '').match(/[A-Z0-9-]{5,30}/i)
    return match?.[0].toUpperCase() || ''
  }

  private normalizeVehicleAddress(value: string) {
    return value.replace(/^址[：:\s]*/, '').trim()
  }

  private normalizeVehicleDate(value: string) {
    const match = value.match(/\d{4}\D\d{1,2}\D\d{1,2}/)
    return match ? this.formatDateText(match[0]) : ''
  }

  private extractVehicleSealInfo(lines: string[]) {
    const anchorIndex = lines.findIndex((line) => /(?:公安|车管所|支队|大队)/.test(line))
    if (anchorIndex < 0) return ''

    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line, index }) => Math.abs(index - anchorIndex) <= 4 && this.isVehicleSealCandidate(line))
      .map(({ line }) => line)
      .join('')
  }

  private isVehicleSealCandidate(line: string) {
    if (!/[\u4e00-\u9fff]/.test(line)) return false
    if (this.isVehicleFieldLabel(line)) return false
    if (/^(?:中华人民共和国|机动车行驶证|居民身份证)/.test(line)) return false
    if (/[A-HJ-NPR-Z0-9]{10,}/i.test(line)) return false
    if (/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(line)) return false
    return /(?:公安|车管所|支队|大队|交通|警察|省|市)/.test(line)
  }

  private parseValidDate(value: string) {
    if (!value) return { start: '', end: '' }
    if (value.includes('长期')) {
      const startMatch = value.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})/)
      return {
        start: startMatch ? this.formatDateText(startMatch[1]) : '',
        end: '长期'
      }
    }

    const dateMatches = value.match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g)
    if (dateMatches && dateMatches.length >= 2) {
      return {
        start: this.formatDateText(dateMatches[0]),
        end: this.formatDateText(dateMatches[1])
      }
    }

    const parts = value
      .replace(/\//g, '-')
      .split(/[-–—至~]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (parts.length < 2) return { start: '', end: '' }
    return {
      start: this.formatDateText(parts[0]),
      end: this.formatDateText(parts[1])
    }
  }

  private getTextLines(raw: string) {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  private formatDateText(value: string) {
    const [year, month, day] = value.split(/\D/).filter(Boolean)
    if (!year || !month || !day) return ''
    return this.formatDateParts(year, month, day)
  }

  private formatDateParts(year: string, month: string, day: string) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  private normalizeFilename(filename: string, mimetype?: string) {
    const safeName = basename(filename || 'ocr-image')
    if (extname(safeName)) return safeName
    return `${safeName}${EXTENSION_BY_MIME_TYPE[mimetype || ''] || '.jpg'}`
  }

  private getRecognizeEndpoint() {
    const ocrUrl = this.config.get<string>('OCR_URL')?.trim()
    if (ocrUrl) return ocrUrl.replace(/\/+$/, '')

    const legacyBaseUrl = this.getLegacyServiceBaseUrl()
    if (legacyBaseUrl) return `${legacyBaseUrl}/saas/ocr`

    return OCR_DEFAULT_URL
  }

  private getHealthEndpoint() {
    const ocrUrl = this.config.get<string>('OCR_URL')?.trim()
    if (ocrUrl) return `${ocrUrl.replace(/\/+$/, '')}/health`

    const legacyBaseUrl = this.getLegacyServiceBaseUrl()
    if (legacyBaseUrl) return `${legacyBaseUrl}/saas/ocr/health`

    return `${OCR_DEFAULT_URL}/health`
  }

  private getLegacyServiceBaseUrl() {
    return this.config.get<string>('OCR_SERVICE_URL')?.replace(/\/+$/, '')
  }

  private getAuthHeaders(): HeadersInit | undefined {
    const apiKey = this.config.get<string>('OCR_API_KEY')
    if (!apiKey?.trim()) {
      throw new InternalServerErrorException('OCR API Key 未配置')
    }
    return {
      'X-API-Key': apiKey.trim()
    }
  }

  private getTimeoutMs() {
    const raw = this.config.get<string>('OCR_TIMEOUT_MS') || this.config.get<string>('OCR_SERVICE_TIMEOUT_MS')
    const parsed = raw ? Number(raw) : OCR_SERVICE_DEFAULT_TIMEOUT_MS
    return Number.isFinite(parsed) && parsed > 0 ? parsed : OCR_SERVICE_DEFAULT_TIMEOUT_MS
  }
}
