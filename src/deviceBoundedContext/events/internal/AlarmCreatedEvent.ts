import { ChangeEvent } from '../../../eventSourcing/contracts/MessageTypes'
import * as Uuid from '../../../util/UUID'

export interface AlarmCreatedEvent extends ChangeEvent {
  eventType: 'AlarmCreatedEvent'
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AlarmCreatedEvent {
  export const eventType = 'AlarmCreatedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): AlarmCreatedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId,
    causationId: data.causationId,
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmCreatedEvent = (e: ChangeEvent): e is AlarmCreatedEvent => e.eventType === eventType

  export function assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
    if (isAlarmCreatedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof e}`)
  }
}
