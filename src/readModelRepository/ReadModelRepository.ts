import * as Uuid from "../eventSourcing/UUID";
import {Projection} from "./Projection";

export interface ReadModelRepository {
    find<T extends Projection>(name: string, id: Uuid.UUID): Promise<T | undefined>

    create<T extends Projection>(name: string, state: T): Promise<void>

    update<T extends Projection>(name: string, state: T): Promise<void>

    delete<T extends Projection>(name: string, state: T): Promise<void>
}