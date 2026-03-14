export interface IConcurrencyLimiter {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
