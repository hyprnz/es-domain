import {Logger} from "./Logger";

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

export function retryOnSpecificErrors<T>(
    fn: () => Promise<T>,
    logger: Logger,
    retryableErrors: any[],
    retries: number = 3,
    timeout: number = 100,
    action?: string,
): Promise<T> {
    return fn().catch(e => {
        if (retries <= 0) {
            throw e;
        }
        if (retryableErrors.filter(retryableError => e instanceof retryableError).length === 0) {
            throw e;
        }
        logger.debug(`retry after exception for action: ${action}`);
        return delay(timeout).then(success => retryOnSpecificErrors(fn, logger, retryableErrors, retries - 1, timeout * 2, action)); // Exponential back-off
    });
}

export function delay<T>(milliseconds: number, value?: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value as any), milliseconds));
}
