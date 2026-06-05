import { randomInt } from 'crypto'
import { Prisma } from '@prisma/client'

const APPLICATION_NO_PREFIX = 'APP'
const APPLICATION_NO_RANDOM_WIDTH = 6
const DEFAULT_MAX_ATTEMPTS = 5

export function generateApplicationNo(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  const rand = randomInt(10 ** APPLICATION_NO_RANDOM_WIDTH)
    .toString()
    .padStart(APPLICATION_NO_RANDOM_WIDTH, '0')

  return `${APPLICATION_NO_PREFIX}${yyyy}${mm}${dd}${hh}${mi}${ss}${ms}${rand}`
}

export function isApplicationNoUniqueError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== 'P2002') return false
  const target = error.meta?.target
  return Array.isArray(target)
    ? target.includes('applicationNo')
    : String(target || '').includes('applicationNo')
}

export async function createApplicationWithUniqueNo<T>(
  create: (applicationNo: string) => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
) {
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await create(generateApplicationNo())
    } catch (error) {
      if (!isApplicationNoUniqueError(error)) throw error
      lastError = error
    }
  }

  throw lastError
}
