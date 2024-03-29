import { ChangeEvent } from '../../../eventSourcing/contracts/MessageTypes'
import * as Uuid from '../../../util/UUID'

export interface AlarmDisarmedEvent extends ChangeEvent {
  eventType: 'AlarmDisarmedEvent'
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AlarmDisarmedEvent {
  export const eventType = 'AlarmDisarmedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): AlarmDisarmedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId,
    causationId: data.causationId,
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  })

  export const isAlarmDisarmedEvent = (e: ChangeEvent): e is AlarmDisarmedEvent => e.eventType === eventType

  export function assertAlarmDisarmedEvent(e: ChangeEvent): asserts e is AlarmDisarmedEvent {
    if (isAlarmDisarmedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmDisarmedEvent, received ${typeof e}`)
  }
}
