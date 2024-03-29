import { Thespian, TMocked } from 'thespian'
import { alarmCountProjection } from '..'
import { EntityEvent } from '../../eventSourcing/contracts/MessageTypes'
import { ReadModelRepository } from '../../readModelRepository/ReadModelRepository'
import * as Uuid from '../../util/UUID'
import { AlarmArmedEvent } from '../events/internal/AlarmArmedEvent'
import { AlarmCreatedEvent } from '../events/internal/AlarmCreatedEvent'

describe('AlarmsCountProjection', () => {
  let mocks: Thespian
  let repository: TMocked<ReadModelRepository>
  const projectionName = 'deviceAlarmCountProjection'

  beforeEach(() => {
    mocks = new Thespian()
    repository = mocks.mock('repository')
  })

  afterEach(() => mocks.verify())

  it('Create new Row', async () => {
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const events: Array<EntityEvent> = [
      {
        version: 0,
        event: {
          id: Uuid.createV4(),
          correlationId: Uuid.createV4(),
          causationId: Uuid.createV4(),
          entityId: alarmId,
          aggregateRootId: aggregateRootId,
          eventType: AlarmCreatedEvent.eventType,
          dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
        }
      }
    ]
    repository.setup(x => x.find(projectionName, aggregateRootId)).returns(() => Promise.resolve(undefined))

    repository
      .setup(x =>
        x.create(projectionName, {
          id: aggregateRootId,
          version: 0,
          countOfAlarms: 1,
          countOfCurrentAlarms: 1
        })
      )
      .returns(() => Promise.resolve())

    await alarmCountProjection(events, repository.object)
  })

  it('Active Alarm', async () => {
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const events = [
      {
        version: 0,
        event: {
          id: Uuid.createV4(),
          correlationId: Uuid.createV4(),
          causationId: Uuid.createV4(),
          entityId: alarmId,
          aggregateRootId: aggregateRootId,
          payload: {},
          eventType: AlarmCreatedEvent.eventType,
          dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
        }
      },
      {
        version: 1,
        event: {
          id: Uuid.createV4(),
          correlationId: Uuid.createV4(),
          causationId: Uuid.createV4(),
          entityId: alarmId,
          aggregateRootId: aggregateRootId,
          payload: {
            threshold: 10
          },
          eventType: AlarmArmedEvent.eventType,
          dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
        }
      }
    ]
    repository.setup(x => x.find(projectionName, aggregateRootId)).returns(() => Promise.resolve(undefined))

    repository
      .setup(x =>
        x.create(projectionName, {
          id: aggregateRootId,
          version: 0,
          countOfAlarms: 1,
          countOfCurrentAlarms: 1
        })
      )
      .returns(() => Promise.resolve())

    await alarmCountProjection(events, repository.object)
  })
})
