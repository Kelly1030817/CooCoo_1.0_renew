import type { ApiErrorBody, ApiSuccess } from '@coocoo/contracts'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody
  constructor(status: number, body: ApiErrorBody) { super(body.error.message);this.status=status;this.body=body }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers:{'content-type':'application/json',...(init?.headers||{})} })
  const body = await response.json() as ApiSuccess<T> | ApiErrorBody
  if (!response.ok || 'error' in body) throw new ApiError(response.status, body as ApiErrorBody)
  return body.data
}

export const json = (method:string, value:unknown):RequestInit => ({method,body:JSON.stringify(value)})
