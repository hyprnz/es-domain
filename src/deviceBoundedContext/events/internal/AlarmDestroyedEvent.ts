import { ChangeEvent } from '../../../eventSourcing/contracts/MessageTypes'
import * as Uuid from '../../../util/UUID'

export interface AlarmDestroyedEvent extends ChangeEvent {
  eventType: 'AlarmDestroyedEvent'
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AlarmDestroyedEvent {
  export const eventType = 'AlarmDestroyedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): AlarmDestroyedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId,
    causationId: data.causationId,
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmDestroyedEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType

  export const assertAlarmDestroyedEvent = (e: ChangeEvent): asserts e is AlarmDestroyedEvent => {
    if (isAlarmDestroyedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmDestroyedEvent, received ${typeof e}`)
  }
}
