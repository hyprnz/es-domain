export interface EventBus<E> {
  registerHandlerForEvents<T extends E>(handler: (events: T[]) => Promise<void>): void

  callHandlers<T extends E>(events: T[]): Promise<void>
}

export const isString = (s: any): s is string => {
  return typeof s === 'string'
}
