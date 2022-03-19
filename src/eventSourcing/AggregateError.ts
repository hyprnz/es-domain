export class AggregateError extends Error {
  constructor(domainObjName: string, description: string) {
    super(`Error:${domainObjName}, ${description}`)
  }
}
