import {ChangeEvent} from '../../../eventSourcing/MessageTypes'
import * as Uuid from '../../../eventSourcing/UUID'
import {AlarmDestroyedEvent} from "./AlarmDestroyedEvent";


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
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmSnapshotEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType

  export const assertAlarmSnapshotEvent = (e: ChangeEvent): asserts e is AlarmDestroyedEvent => {
    if (isAlarmSnapshotEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmSnapshotEvent, received ${typeof e}`)
  }
}
