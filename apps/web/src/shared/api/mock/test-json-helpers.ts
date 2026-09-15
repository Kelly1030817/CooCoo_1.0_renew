export async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

export function envelopeData(body: unknown): unknown {
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new Error("Expected API success envelope with data");
  }
  return body.data;
}

export function envelopeError(body: unknown): unknown {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    throw new Error("Expected API error envelope");
  }
  return body.error;
}
