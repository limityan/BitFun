import { useEffect, useRef, useState } from 'react';
import type { CompanionPulseWindowConfig } from '../utils/companionTiming';
import { isCompanionPulseWindowActive } from '../utils/companionTiming';

const COMPANION_PULSE_TICK_MS = 700;

export function useCompanionPulse(
  enabled: boolean,
  config: CompanionPulseWindowConfig,
): boolean {
  const startedAtRef = useRef<number | null>(enabled ? Date.now() : null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      startedAtRef.current = null;
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, COMPANION_PULSE_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  if (!enabled || startedAtRef.current === null) {
    return false;
  }

  return isCompanionPulseWindowActive(now, startedAtRef.current, config);
}
