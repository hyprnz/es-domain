export class EventBusError extends Error {
  constructor(events: any[], errors: string[]) {
    super(`Event bus error for events: ${log(events)} errors: ${errors.join(', ')}`)
  }
}

const log = (events: any[]): string => {
  try {
    return events.map(x => JSON.stringify(x)).join('\n')
  } catch {
    return 'Events could not be converted to string'
  }
}

// const log = (events: { id: string, eventType: string }[]): string => events
//     .map(x => `id: ${x.id}, eventType: ${x.eventType}`)
//     .join(', ')
