import { Uuid } from '../../..'
import { ChangeEvent } from '../../../eventSourcing/MessageTypes'

export interface AlarmArmedEvent extends ChangeEvent {
  eventType: 'AlarmArmedEvent'
  threshold: number
}

export namespace AlarmArmedEvent {
  export const eventType = 'AlarmArmedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      threshold: number
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): AlarmArmedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    threshold: data.threshold,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmArmedEvent = (e: ChangeEvent): e is AlarmArmedEvent => e.eventType === eventType

  export function assertAlarmArmedEvent(e: ChangeEvent): asserts e is AlarmArmedEvent {
    if (e.eventType === eventType) return
    throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
  }
}
