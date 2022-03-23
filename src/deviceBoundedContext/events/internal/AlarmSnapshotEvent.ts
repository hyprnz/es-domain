import { ChangeEvent } from '../../../eventSourcing/MessageTypes'
import * as Uuid from '../../../eventSourcing/UUID'
import { AlarmDestroyedEvent } from './AlarmDestroyedEvent'

export interface AlarmSnapshotEvent extends ChangeEvent {
  eventType: 'AlarmSnapshotEvent'
  isArmed: boolean
  threshold: number
  isTriggered: boolean
}

export namespace AlarmSnapshotEvent {
  export const eventType = 'AlarmSnapshotEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      isArmed: boolean
      threshold: number
      isTriggered: boolean
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
    dateTimeOfEvent: data.dateTimeOfEvent,
    isArmed: data.isArmed,
    threshold: data.threshold,
    isTriggered: data.isTriggered
  })

  export const isAlarmSnapshotEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType

  export const assertAlarmSnapshotEvent = (e: ChangeEvent): asserts e is AlarmDestroyedEvent => {
    if (isAlarmSnapshotEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmSnapshotEvent, received ${typeof e}`)
  }
}
