import * as Uuid from './UUID'
import { ChangeEvent} from "./EventSourcingTypes";

export abstract class AbstractChangeEvent implements ChangeEvent{
  readonly id: Uuid.UUID;
  readonly correlationId: Uuid.UUID;
  readonly causationId: Uuid.UUID;

  constructor(public eventType:string, public readonly aggregateRootId: Uuid.UUID, public readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
    this.correlationId = Uuid.createV4()
    this.causationId = Uuid.createV4()
  } 
}