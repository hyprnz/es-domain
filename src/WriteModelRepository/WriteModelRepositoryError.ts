
export class WriteModelrRepositoryError extends Error {
  constructor(domainObjName: string, description: string) {
    super(`Error:${domainObjName}, ${description}`);
  }
}