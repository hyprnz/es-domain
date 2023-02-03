import { EntityEvent } from '../eventSourcing'
import { makeNoOpLogger } from '../util/Logger'
import { EventBus } from '../eventSourcing/contracts/EventBus'
import { EventBusError } from './EventBusError'

export class EventBusProducer  implements EventBus<EntityEvent> {
  private eventHandlerFor: Array<(events: Array<EntityEvent>) => Promise<void>> = []

  constructor(private logger = makeNoOpLogger()) {}

  public registerHandlerForEvents(handler: (events: Array<EntityEvent>) => Promise<void>): void {
    this.eventHandlerFor.push(handler)
  }

  public async callHandlers(events: Array<EntityEvent>): Promise<void> {
    const errors: string[] = []
    for (const handler of this.eventHandlerFor) {
      await handler(events).catch((e: Error) => errors.push(messageFrom(e)))
    }
    if (errors.length > 0) {
      errors.forEach(err => this.logger.error(err))
      throw new EventBusError(events, errors)
    }
  }
}

const messageFrom = (e: any): string => {
  const isString = (s: any): s is string => typeof s === 'string'
  return isString(e?.message) ? e.message : 'Unknown error message'
}

