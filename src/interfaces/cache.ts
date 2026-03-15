/**
 * Generic async cache interface.
 * Implementations handle TTL, eviction, and storage internally.
 * Consumers only care about get/set/delete.
 */
export interface ICache<T = string> {
  get(key: string): Promise<T | undefined> | T | undefined;
  set(key: string, value: T): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}
