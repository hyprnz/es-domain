
import { EntityEvent } from "../EventSourcing/EventSourcingTypes";
import { ReadModelMemoryRepository } from "../ReadModelRepository/ReadModelMemoryRepository";
import { WriteModelMemoryRepository } from "../WriteModelRepository/WriteModelMemoryRepository";
import { alarmCountProjection } from "./readModel/AlarmCountProjection";
import { alarmProjectionHandler } from "./readModel/AlarmsProjection";


const readModelRepo = new ReadModelMemoryRepository();
const eventBus = (changes:Array<EntityEvent>) =>{
  const projections = [alarmCountProjection, alarmProjectionHandler]
  projections.forEach(x => x(changes, readModelRepo))
}

const deviceWriterepository = new WriteModelMemoryRepository()
deviceWriterepository.subscribeToChanges(eventBus)

