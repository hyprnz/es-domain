export class IdempotencyError extends Error {
  constructor(id: string, eventId: string) {
    super(`Idempotency error for event id: ${id}, eventId: ${eventId}`)
  }
}
