import { ExternalEventStoreRepository } from './ExternalEventStoreRepository'
import { Logger, makeNoOpLogger } from '../util/Logger'
import { EventBusExternal, FailedExternalEvent } from './EventBusExternal'
import { retryOnSpecificErrors } from './Retry'
import { OptimisticConcurrencyError } from '../eventSourcing/contracts/OptimisticConcurrencyError'
import { EventStoreExternalError } from './EventStoreExternalError'
import { IdempotencyError } from './IdempotencyError'
import { ExternalEvent } from './ExternalEvent'

export enum ExternalEventStoreProcessingState {
  RECEIVED = 'RECEIVED',
  APPENDED = 'APPENDED',
  HANDLED = 'HANDLED',
  PROCESSED = 'PROCESSED'
}

// Used for idempotent processing of external events.
export class EventStoreExternal {
  private readonly eventBus = new EventBusExternal()
  private readonly eventBusFailed = new EventBusExternal()

  constructor(private store: ExternalEventStoreRepository, private readonly logger: Logger = makeNoOpLogger()) {}

  async process(externalEvent: ExternalEvent): Promise<void> {
    let state = ExternalEventStoreProcessingState.RECEIVED
    try {
      const appended = await this.appendEvent(externalEvent)
      if (appended) {
        state = ExternalEventStoreProcessingState.APPENDED
        await this.handle(externalEvent)
        state = ExternalEventStoreProcessingState.HANDLED
      }
      state = ExternalEventStoreProcessingState.PROCESSED
    } catch (err) {
      this.logger.error(new EventStoreExternalError(externalEvent.id, externalEvent.eventId, state))
      await this.onAfterEventFailed({ ...externalEvent, processingState: state })
      this.logger.debug(`Handled failure for event id: ${externalEvent.id} with state: ${state}`)
    }
  }

  private async handle(externalEvent: ExternalEvent) {
    await retryOnSpecificErrors(() => this.onAfterEventsStored([externalEvent]), this.logger, [OptimisticConcurrencyError])
  }

  private async appendEvent(externalEvent: ExternalEvent): Promise<boolean> {
    try {
      await this.store.appendEvent(externalEvent)
      return true
    } catch (err) {
      if (err instanceof IdempotencyError) {
        return false
      } else {
        throw err
      }
    }
  }

  subscribeToEventsSynchronously(handler: (events: ExternalEvent[]) => Promise<void>) {
    this.eventBus.registerHandlerForEvents(handler)
  }

  subscribeToFailureSynchronously(handler: (events: FailedExternalEvent[]) => Promise<void>) {
    const h = handler as (events: ExternalEvent[]) => Promise<void>
    this.eventBusFailed.registerHandlerForEvents(h)
  }

  private async onAfterEventsStored(events: ExternalEvent[]): Promise<void> {
    await this.eventBus.callHandlers(events)
  }

  private async onAfterEventFailed(event: FailedExternalEvent): Promise<void> {
    await this.eventBusFailed.callHandlers([event])
  }
}
