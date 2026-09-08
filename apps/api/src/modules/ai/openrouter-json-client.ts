import type { TSchema } from "@sinclair/typebox";

interface OpenRouterResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
  usage?: { cost?: number; prompt_tokens?: number; completion_tokens?: number };
}

export interface OpenRouterJsonResult<T> {
  value: T;
  model: string;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface OpenRouterJsonRequest {
  system: string;
  prompt: string;
  schema: TSchema;
  schemaName: string;
  image?: { bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" | "image/webp" };
  maxTokens?: number;
  requireZeroDataRetention?: boolean;
  allowFallbacks?: boolean;
}

export class OpenRouterHttpError extends Error {
  constructor(readonly status: number) {
    super(`OPENROUTER_${status}`);
    this.name = "OpenRouterHttpError";
  }
}

export class OpenRouterJsonClient {
  readonly model: string;

  constructor(
    private readonly apiKey = process.env.OPENROUTER_API_KEY,
    model = process.env.OPENROUTER_MODEL || "google/gemini-3.7-flash",
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.model = model;
  }

  async generate<T>(request: OpenRouterJsonRequest): Promise<OpenRouterJsonResult<T>> {
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY_REQUIRED");
    const userContent = request.image
      ? [
          { type: "image_url", image_url: { url: `data:${request.image.mimeType};base64,${Buffer.from(request.image.bytes).toString("base64")}` } },
          { type: "text", text: request.prompt },
        ]
      : request.prompt;
    const response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        ...(process.env.OPENROUTER_SITE_URL ? { "http-referer": process.env.OPENROUTER_SITE_URL } : {}),
        "x-title": process.env.OPENROUTER_APP_NAME || "CooCoo",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        max_tokens: request.maxTokens ?? 4096,
        usage: { include: true },
        provider: {
          allow_fallbacks: request.allowFallbacks ?? false,
          require_parameters: true,
          data_collection: "deny",
          ...(request.requireZeroDataRetention ? { zdr: true } : {}),
        },
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: request.schemaName, strict: true, schema: request.schema },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json()) as OpenRouterResponse;
    if (!response.ok) throw new OpenRouterHttpError(response.status);
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("OPENROUTER_EMPTY_RESPONSE");
    return {
      value: JSON.parse(content) as T,
      model: body.model || this.model,
      ...(typeof body.usage?.cost === "number" ? { costUsd: body.usage.cost } : {}),
      ...(typeof body.usage?.prompt_tokens === "number" ? { inputTokens: body.usage.prompt_tokens } : {}),
      ...(typeof body.usage?.completion_tokens === "number" ? { outputTokens: body.usage.completion_tokens } : {}),
    };
  }
}
