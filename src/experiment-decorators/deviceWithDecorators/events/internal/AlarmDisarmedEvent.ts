import { Uuid } from '../../../../util'
import { baseChangeEventBuilder, ChangeEvent, ChangeEventFactory, EventData } from '../../../MessageTypes'

export interface AlarmDisarmedEvent extends ChangeEvent {
  eventType: 'AlarmDisarmedEvent'
}

const eventType = 'AlarmDisarmedEvent'

const make: ChangeEventFactory<AlarmDisarmedEvent> = (idProvider: () => Uuid.UUID, data: EventData): AlarmDisarmedEvent => ({
  ...baseChangeEventBuilder(idProvider, data),
  eventType
})

const isAlarmDisarmedEvent = (e: ChangeEvent): e is AlarmDisarmedEvent => e.eventType === eventType

function assertAlarmDisarmedEvent(e: ChangeEvent): asserts e is AlarmDisarmedEvent {
  if (isAlarmDisarmedEvent(e)) return
  throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
}

export const AlarmDisarmedEvent = {
  make,
  eventType,
  isAlarmDisarmedEvent,
  assertAlarmDisarmedEvent
}
