export function delay(ms = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
