import { UUID } from '../../../eventSourcing/UUID'
import { DeviceService } from '../../service/DeviceService'
import { ExternalEvent } from '../../../eventSourcing/MessageTypes'
import { EventStoreExternal } from '../../../eventStoreExternal/EventStoreExternal'
import { ExternalEventStoreInMemoryRepository } from '../../../eventStoreExternal/ExternalEventStoreInMemoryRepository'
import { AggregateRepository } from '../../../writeModelRepository/AggregateRepository'
import { InMemoryEventStoreRepository } from '../../../writeModelRepository/InMemoryEventStoreRepository'
import { ExternalEventBuilder } from '../../../eventStoreExternal/ExternalEventBuilder'

export interface AlarmTriggeredByExternalSystemEvent extends ExternalEvent {
  deviceId: UUID
  alarmId: UUID
}

const isAlarmTriggerredEvent = (e: ExternalEvent): e is AlarmTriggeredByExternalSystemEvent => {
  return e.eventType === 'AlarmTriggeredByExternalSystemEvent'
}

export class AlarmTriggeredByExternalSystemEventConsumer {
  constructor(private eventStoreExternal: EventStoreExternal) {}

  async consume(event: AlarmTriggeredByExternalSystemEvent) {
    await this.eventStoreExternal.process(event)
  }
}

export class AlarmTriggeredByExternalSystemEventHandler {
  constructor(private deviceService: DeviceService) {}

  async handle(events: ExternalEvent[]): Promise<void> {
    await this.handleAlarmTriggered(events.filter(isAlarmTriggerredEvent))
  }

  private async handleAlarmTriggered(events: AlarmTriggeredByExternalSystemEvent[]): Promise<void> {
    for (const event of events) {
      await this.deviceService.triggerAlarm(event.deviceId, event.alarmId)
    }
  }
}

// Example application start config
// const service = new DeviceService(new AggregateRootRepository(new InMemoryEventStoreRepository()))
// const handler = new AlarmTriggeredByExternalSystemEventHandler(service)
// const repository = new ExternalEventStoreInMemoryRepository()
// const eventStore = new EventStoreExternal(repository)
// eventStore.subscribeToEventsSynchronously((events: ExternalEvent[]) => handler.handle(events))
// const consumer = new AlarmTriggeredByExternalSystemEventConsumer(eventStore)
// await consumer.consume(ExternalEventBuilder.make().to() as AlarmTriggeredByExternalSystemEvent)
