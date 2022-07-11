import { v4 as uuidv4 } from 'uuid'

// Havr a look at ts-essentials
declare const validUUID: unique symbol
const nullUUID = '00000000-0000-0000-0000-000000000000'
export type UUID = string & { [validUUID]: true }

export function assertValidUUID(input: string): asserts input is UUID {
  if (!isValidUUID(input)) {
    throw new Error(`The string: ${input} is not a valid UUID`)
  }
}

export function isValidUUID(input: string): input is UUID {
  const s = '' + input
  const match = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)
  return match
}

export function makeFromString(uuid: string): UUID {
  assertValidUUID(uuid)
  return uuid
}

export function makeWelKnownUuid(uuid: string): UUID {
  assertValidUUID(uuid)
  return uuid
}

export function createV4(): UUID {
  const uuid = uuidv4()
  assertValidUUID(uuid)
  return uuid
}

export const EmptyUUID: UUID = makeWelKnownUuid(nullUUID)
