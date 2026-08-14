import { useState } from "react";
import { delay } from "@/lib/delay";

export function useConfirmDelete<T>(
  action: (item: T) => Promise<void>,
  failMessage = "Operation failed.",
) {
  const [pending, setPending] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function begin(item: T) {
    setError(null);
    setPending(item);
  }

  function cancel() {
    setPending(null);
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const item = pending;
      await Promise.all([action(item), delay(1200)]);
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : failMessage);
    } finally {
      setBusy(false);
    }
  }

  return { pending, busy, error, begin, cancel, confirm };
}
