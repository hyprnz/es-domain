import { Message } from '../eventSourcing/contracts/MessageTypes'

export interface ExternalEvent extends Message {
  eventId: string
  readonly eventType: string
}
