import * as Uuid from '../../../../util/UUID'
import { baseChangeEventBuilder, ChangeEvent, ChangeEventFactory, EventData } from '../../../MessageTypes'

export interface AlarmTriggeredEvent extends ChangeEvent {
  eventType: 'AlarmTriggeredEvent'
}

export namespace AlarmTriggeredEvent {
  export const eventType = 'AlarmTriggeredEvent'

  export const make: ChangeEventFactory<AlarmTriggeredEvent> = (
    idProvider: () => Uuid.UUID,
    data: EventData
  ): AlarmTriggeredEvent => ({
    ...baseChangeEventBuilder(idProvider, data),
    eventType
  })

  export const isAlarmTriggeredEvent = (e: ChangeEvent): e is AlarmTriggeredEvent => e.eventType === eventType

  export const assertAlarmTriggeredEvent = (e: ChangeEvent): asserts e is AlarmTriggeredEvent => {
    if (isAlarmTriggeredEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
  }
}
