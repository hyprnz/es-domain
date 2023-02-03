import { EventSourcedEntity } from '../Entity'

/** Registers an entity with its aggregate for event handler management */
export function Entity<T extends { new (...args: any[]): EventSourcedEntity }>(BaseEntity: T) {
  return class extends BaseEntity {
    constructor(...args: any[]) {
      super(...args)
      this.aggregate.registerEntity(this)
    }
  }
}
