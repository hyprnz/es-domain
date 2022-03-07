import * as Uuid from '../../eventSourcing/UUID'
import { Thespian, TMocked } from 'thespian'
import { alarmProjectionHandler } from "./AlarmsProjection"
import { AlarmArmedEvent, AlarmCreatedEvent } from '../events/internal/DeviceEvents'
import { EntityEvent } from '../../eventSourcing/MessageTypes'
import {ReadModelRepository} from "../../readModelRepository/ReadModelRepository";


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
      {version:0, event:{
        id: Uuid.createV4(), 
        correlationId: Uuid.createV4(), 
        causationId: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        payload: {},
        eventType: AlarmCreatedEvent.eventType
      }},                 
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
      {version:0, event:{
        id: Uuid.createV4(), 
        correlationId: Uuid.createV4(), 
        causationId: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        payload: {},
        eventType: AlarmCreatedEvent.eventType
      }},      
      
      {version:1, event:{
        id: Uuid.createV4(), 
        correlationId: Uuid.createV4(), 
        causationId: Uuid.createV4(), 
        entityId:alarmId, 
        aggregateRootId:aggregateRootId, 
        eventType: AlarmArmedEvent.eventType, 
        payload: {
          threshold:10, 
        },
      }}
    ]
    repository.setup(x => x.find(projectionName, alarmId))
      .returns(()=> Promise.resolve(undefined))

    repository.setup(x => x.create(projectionName, {id:alarmId, version:1,  isActive: true, threshold: 10}))
      .returns(() => Promise.resolve())
    
    await alarmProjectionHandler(events, repository.object)
  })
})