export type StorageLocation = "cold" | "frozen" | "pantry";

export function parseStorageLocation(value: string): StorageLocation | null {
  if (value === "cold" || value === "frozen" || value === "pantry") return value;
  return null;
}

export function parseStorageLocationOrDefault(
  value: string,
  fallback: StorageLocation = "cold",
): StorageLocation {
  return parseStorageLocation(value) ?? fallback;
}
