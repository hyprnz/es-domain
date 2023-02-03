import { Uuid } from '../../../..'
import { baseChangeEventBuilder, ChangeEvent, ChangeEventFactory, EventData } from '../../../MessageTypes'

export interface AlarmArmedEvent extends ChangeEvent {
  eventType: 'AlarmArmedEvent'
  threshold: number
}

export interface AlarmArmedPayload {
  threshold: number
}

export namespace AlarmArmedEvent {
  export const eventType = 'AlarmArmedEvent'

  export const make: ChangeEventFactory<AlarmArmedEvent, AlarmArmedPayload> = (
    idProvider: () => Uuid.UUID,
    data: EventData & AlarmArmedPayload
  ): AlarmArmedEvent => ({
    ...baseChangeEventBuilder(idProvider, data),
    eventType,
    threshold: data.threshold
  })

  export const isAlarmArmedEvent = (e: ChangeEvent): e is AlarmArmedEvent => e.eventType === eventType

  export function assertAlarmArmedEvent(e: ChangeEvent): asserts e is AlarmArmedEvent {
    if (e.eventType === eventType) return
    throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
  }
}
