import { Uuid } from '../../..'
import { ChangeEvent } from '../../../eventSourcing/contracts/MessageTypes'

export interface AlarmArmedEvent extends ChangeEvent {
  eventType: 'AlarmArmedEvent'
  threshold: number
}

// eslint-disable-next-line @typescript-eslint/no-namespace
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
    correlationId: data.correlationId,
    causationId: data.causationId,
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    threshold: data.threshold,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmArmedEvent = (e: ChangeEvent): e is AlarmArmedEvent => e.eventType === eventType

  export function assertAlarmArmedEvent(e: ChangeEvent): asserts e is AlarmArmedEvent {
    if (e.eventType === eventType) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmArmedEvent, received ${typeof e}`)
  }
}
