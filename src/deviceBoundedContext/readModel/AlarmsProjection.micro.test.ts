import * as Uuid from '../../EventSourcing/UUID'
import { Thespian, TMocked } from 'thespian'
import { ReadModelRepository } from "../../EventSourcing/ReadModelTypes"
import { alarmProjectionHandler } from "./AlarmsProjection"
import { AlarmArmedEvent, AlarmCreatedEvent } from '../events'
import { EntityEvent } from '../../EventSourcing/EventSourcingTypes'


describe('AlarmsProjection', ()=>{
  let mocks: Thespian
  let repository: TMocked<ReadModelRepository> 

  const projectionName = "alarmProjectionHandler"
  beforeEach(() => {
    mocks = new Thespian()
    repository = mocks.mock('repository')
  })

  afterEach(() => mocks.verify())
  
  it('Create new Row', async ()=>{
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    
    const events: Array<EntityEvent> = [
      {version:0, event: new AlarmCreatedEvent(aggregateRootId, aggregateRootId, { alarmId })},                 
    ]
    repository.setup(x => x.find(projectionName, alarmId))
      .returns(()=> Promise.resolve(undefined))

    repository.setup(x => x.create(projectionName, {id:alarmId, version:0,  isActive: false, threshold: 0}))
      .returns(() => Promise.resolve())
    
    await alarmProjectionHandler(events, repository.object)
  })

  it('Active Alarm', async ()=>{
    const aggregateRootId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    
    const events = [
      {version:0, event: new AlarmCreatedEvent(aggregateRootId, aggregateRootId, { alarmId })},                 
      {version:1, event: new AlarmArmedEvent(aggregateRootId, alarmId, { threshold: 10 })},                 
    ]
    repository.setup(x => x.find(projectionName, alarmId))
      .returns(()=> Promise.resolve(undefined))

    repository.setup(x => x.create(projectionName, {id:alarmId, version:1,  isActive: true, threshold: 10}))
      .returns(() => Promise.resolve())
    
    await alarmProjectionHandler(events, repository.object)
  })
})