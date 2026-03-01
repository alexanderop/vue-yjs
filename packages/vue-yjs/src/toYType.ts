import * as Y from "yjs";

/**
 * Recursively converts a plain JS value to the corresponding Yjs shared type.
 * - Objects (plain) → Y.Map
 * - Arrays → Y.Array
 * - Primitives (string, number, boolean, null, Uint8Array) pass through
 * - Already a Y.AbstractType → pass through unchanged
 */
export function toYType(value: unknown): unknown {
  // If already a Yjs type, return as-is
  if (value instanceof Y.AbstractType) return value;

  // Plain object → Y.Map
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Uint8Array)
  ) {
    const yMap = new Y.Map<unknown>();
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      yMap.set(k, toYType(v));
    }
    return yMap;
  }

  // Array → Y.Array
  if (Array.isArray(value)) {
    const yArray = new Y.Array<unknown>();
    yArray.push(value.map(toYType));
    return yArray;
  }

  // Primitive: string, number, boolean, null, Uint8Array
  return value;
}
