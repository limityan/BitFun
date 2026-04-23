import { useEffect, useRef, useState } from 'react';

export function useCompanionBurst(
  enabled: boolean,
  durationMs: number,
): boolean {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const previousEnabledRef = useRef(enabled);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const wasEnabled = previousEnabledRef.current;
    previousEnabledRef.current = enabled;

    if (!enabled) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setActive(false);
      return;
    }

    if (wasEnabled) {
      return;
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    setActive(true);
    timerRef.current = window.setTimeout(() => {
      setActive(false);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs, enabled]);

  return enabled && active;
}
