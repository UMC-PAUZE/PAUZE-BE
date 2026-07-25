const UNIT_TO_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const secondsPerUnit = unit ? UNIT_TO_SECONDS[unit] : undefined;
  if (secondsPerUnit === undefined) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  return value * secondsPerUnit;
}
