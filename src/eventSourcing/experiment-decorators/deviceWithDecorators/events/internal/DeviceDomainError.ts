import * as Uuid from '../../../../../util/UUID'

export class DeviceDomainError extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message: string) {
    super(message)
  }
}

