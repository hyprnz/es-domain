import { ChangeEvent } from '../../../eventSourcing/MessageTypes'
import * as Uuid from '../../../eventSourcing/UUID'

export interface AlarmSnapshotEvent extends ChangeEvent {
  eventType: 'AlarmSnapshotEvent'
}

export namespace AlarmSnapshotEvent {
  export const eventType = 'AlarmSnapshotEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      dateTimeOfEvent: string
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): AlarmSnapshotEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: data.dateTimeOfEvent
  })

  export const isAlarmSnapshotEvent = (e: ChangeEvent): e is AlarmSnapshotEvent => e.eventType === eventType

  export const assertAlarmSnapshotEvent = (e: ChangeEvent): asserts e is AlarmSnapshotEvent => {
    if (isAlarmSnapshotEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
  }
}
