import type { ApiErrorBody, ApiSuccess } from "@coocoo/contracts";

export function parseJsonText(text: string): unknown {
  return JSON.parse(text);
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const errorValue = value.error;
  return typeof errorValue === "object" && errorValue !== null && "message" in errorValue;
}

export function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return typeof value === "object" && value !== null && "data" in value && !isApiErrorBody(value);
}
