/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  error(message?: any, ...optionalParams: any[]): void
  info(message?: any, ...optionalParams: any[]): void
  debug(message?: any, ...optionalParams: any[]): void
}

export const makeConsoleLogger = () => {
  return {
    debug: (message?: any, ...optionalParams: any[]) => console.debug(message, optionalParams),
    info: (message?: any, ...optionalParams: any[]) => console.info(message, optionalParams),
    error: (message?: any, ...optionalParams: any[]) => console.error(message, optionalParams)
  }
}

export const makeNoOpLogger = () => {
  return {
    debug: (message?: any, ...optionalParams: any[]) => {},
    info: (message?: any, ...optionalParams: any[]) => {},
    error: (message?: any, ...optionalParams: any[]) => {}
  }
}
