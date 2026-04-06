export async function useTry<T>(
  fn: () => Promise<T>
): Promise<[T | null, unknown | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err) {
    return [null, err];
  }
}
