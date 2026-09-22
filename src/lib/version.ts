/**
 * `version` >= `minimum`, comparing dotted numeric parts ("1.10.0" > "1.9.2").
 * Missing parts count as 0; anything unparsable is treated as too old.
 */
export function isVersionAtLeast(version: string, minimum: string): boolean {
  const parse = (value: string) => value.trim().replace(/^v/i, "").split(".").map(Number);
  const have = parse(version);
  const need = parse(minimum);
  if (have.some(Number.isNaN)) return false;
  for (let i = 0; i < Math.max(have.length, need.length); i++) {
    const a = have[i] ?? 0;
    const b = need[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
}
