export class WriteModelRepositoryError extends Error {
  constructor(domainObjName: string, description: string) {
    super(`Error:${domainObjName}, ${description}`)
  }
}
