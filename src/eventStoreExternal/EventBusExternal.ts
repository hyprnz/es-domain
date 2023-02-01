import { EventBus } from '../writeModelRepository/EventBus'
import { ExternalEventStoreProcessingState } from './EventStoreExternal'
import { ExternalEvent } from './ExternalEvent'
import { makeNoOpLogger } from '../util'
import { EventBusError } from '../eventBus/EventBusError'

export interface FailedExternalEvent extends ExternalEvent {
  processingState: ExternalEventStoreProcessingState
}

export class EventBusExternal implements EventBus<ExternalEvent> {
  private eventHandlerFor: Array<(events: Array<ExternalEvent>) => Promise<void>> = []

  constructor(private logger = makeNoOpLogger()) {}

  public registerHandlerForEvents(handler: (events: Array<ExternalEvent>) => Promise<void>): void {
    this.eventHandlerFor.push(handler)
  }

  public async callHandlers(events: Array<ExternalEvent>): Promise<void> {
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
