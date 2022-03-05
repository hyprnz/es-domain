import * as Uuid from '../../eventSourcing/UUID'
import { Thespian, TMocked } from 'thespian'
import { ReadModelRepository } from "../../eventSourcing/ReadModelTypes"
import { AlarmArmedEvent, AlarmCreatedEvent } from '../events/deviceEvents'
import { alarmCountProjection } from '..'
import { EntityEvent } from '../../eventSourcing/MessageTypes'
import { match } from 'mismatched'


describe('AlarmsCountProjection', ()=>{
  let mocks: Thespian
  let repository: TMocked<ReadModelRepository> 
  const projectionName = "deviceAlarmCountProjection"
  
  beforeEach(() => {
    mocks = new Thespian()
    repository = mocks.mock('repository')
  })

  afterEach(() => mocks.verify())
  
  it('Create new Row', async ()=>{
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    
    const events : Array<EntityEvent> = [
      {version:0, event:{
        id: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        eventType: AlarmCreatedEvent.eventType
      }},                 
    ]
    repository.setup(x => x.find(projectionName, aggregateRootId))
      .returns(()=> Promise.resolve(undefined))

    repository.setup(x => x.create(projectionName, {id:aggregateRootId, version:0, countOfAlarms:1, countOfCurrentAlarms:1 }))
      .returns(() => Promise.resolve())
    
    await alarmCountProjection(events, repository.object)
  })

  it('Active Alarm', async ()=>{
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    
    const events = [
      {version:0, event:{
        id: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        eventType: AlarmCreatedEvent.eventType
      }},      
      
      {version:1, event:{
        id: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        eventType: AlarmArmedEvent.eventType, 
        threshold:10, 
        isArmed: true
      }}
    ]
    repository.setup(x => x.find(projectionName, aggregateRootId))
      .returns(()=> Promise.resolve(undefined))

    repository.setup(x => x.create(projectionName, {id:aggregateRootId, version:0,  countOfAlarms:1, countOfCurrentAlarms:1}))
      .returns(() => Promise.resolve())
    
    await alarmCountProjection(events, repository.object)
  })
})