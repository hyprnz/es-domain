export * as Uuid from './EventSourcing/UUID'
export {AggregateError} from './EventSourcing/AggregateError'
export {
  Aggregate, 
  ChangeEvent, 
  Entity, 
  EntityEvent, 
  EntityContructor,
  Message,
  ParentAggregate,
  StaticEventHandler
} from './EventSourcing/EventSourcingTypes'

export {WriteModelRepository} from './EventSourcing/WriteModelTypes'

export {
  makeProjection,   
  Projection,
  ProjectionRow,
  ProjectionAction,
  ReadModelRepository, 
  StaticProjectionEventHandler,

} from './EventSourcing/ReadModelTypes'



export {EntityBase} from './EventSourcing/EntityBase'
export {AbstractChangeEvent} from './EventSourcing/AbstractChangeEvent'
export {AggregateContainer} from './EventSourcing/AggregateRoot'

export * as example from './deviceBoundedContext';