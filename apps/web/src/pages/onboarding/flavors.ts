export function parseFlavorInput(raw: string): string[] {
  return raw
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function addPreferredFlavor(existing: string[], rawInput: string): string[] {
  const newItems = parseFlavorInput(rawInput);
  return Array.from(new Set([...existing, ...newItems]));
}

export function removePreferredFlavor(existing: string[], target: string): string[] {
  return existing.filter((item) => item !== target);
}
