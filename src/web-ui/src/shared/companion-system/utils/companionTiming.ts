export interface CompanionPulseWindowConfig {
  intervalMs: number;
  visibleMs: number;
  initialDelayMs?: number;
}

export function isCompanionPulseWindowActive(
  now: number,
  startedAt: number,
  config: CompanionPulseWindowConfig,
): boolean {
  const intervalMs = Math.max(0, config.intervalMs);
  const visibleMs = Math.max(0, Math.min(config.visibleMs, intervalMs));
  const initialDelayMs = Math.max(0, config.initialDelayMs ?? 0);

  if (intervalMs === 0 || visibleMs === 0) {
    return false;
  }

  const elapsedMs = now - startedAt - initialDelayMs;
  if (elapsedMs < 0) {
    return false;
  }

  return elapsedMs % intervalMs < visibleMs;
}
