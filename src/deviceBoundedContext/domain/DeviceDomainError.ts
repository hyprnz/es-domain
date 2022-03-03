import { UUID } from "../../EventSourcing/UUID";


export class DeviceDomainError extends Error {
  constructor(public readonly aggregateRootId: UUID, message: string) {
    super(message);
  }
}
