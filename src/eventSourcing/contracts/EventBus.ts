export interface EventBus<E> {
  callHandlers(events: E[]): Promise<void>
  registerHandlerForEvents(handler: (events: E[]) => Promise<void>): void
}
