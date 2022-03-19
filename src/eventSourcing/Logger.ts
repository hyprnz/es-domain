export interface Logger {
  error(err: any): void

  debug(message: string): void
}

export const makeConsoleLogger = () => {
  return {
    debug(message: string) {
      console.log(message)
    },
    error(err: any) {
      console.log(err)
    }
  }
}

export const makeNoOpLogger = () => {
  return {
    debug(message: string) {},
    error(err: any) {}
  }
}
