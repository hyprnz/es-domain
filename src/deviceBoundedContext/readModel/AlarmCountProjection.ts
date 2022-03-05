import * as Uuid from '../../eventSourcing/UUID'
import { AlarmCreatedEvent, AlarmDestroyedEvent } from '../events/internal/DeviceEvents'
import { ChangeEvent, EntityEvent} from '../../eventSourcing/MessageTypes'
import { calculateNextAction, Projection, ProjectionRow, StaticProjectionEventHandler, persistReadModelState, makeProjection } from '../../readModelRepository/Projection'
import {StaticEventHandler} from "../../eventSourcing/Entity";
import {ReadModelRepository} from "../../readModelRepository/ReadModelRepository";

export interface AlarmCountProjection extends Projection {
  /** Count of all devices that have ever been */
  countOfAlarms: number

  /** Count of current devices */
  countOfCurrentAlarms: number  

  // countOfDevices: number
}

const eventHandlers: Record<string, StaticProjectionEventHandler<AlarmCountProjection>> = {
  [AlarmCreatedEvent.eventType]: (state, evt) => { 
    state.countOfAlarms++
    state.countOfCurrentAlarms++
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => { 
    state.countOfCurrentAlarms--
    return 'update'
  }
}

const defaultValue =  (id: Uuid.UUID): AlarmCountProjection => ({ 
  id, 
  version: 0, 
  countOfAlarms:0, 
  countOfCurrentAlarms:0, 
  // countOfDevices:0 
}) 


const allAlarmCountProjectionId = Uuid.makeWelKnownUuid('d855f06c-89a2-4600-be96-2d86e9f0bff4')
export const allAlarmCountProjection =  makeProjection<AlarmCountProjection>('allAlarmCountProjection', eventHandlers, defaultValue, (evt) => allAlarmCountProjectionId)
export const deviceAlarmCountProjection =  makeProjection<AlarmCountProjection>('deviceAlarmCountProjection', eventHandlers, defaultValue, (evt) => evt.aggregateRootId)