// helpers/vo-utils.ts
export function safeCreate<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}
