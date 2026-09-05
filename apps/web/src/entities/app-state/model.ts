import { useQuery } from '@tanstack/react-query'
import type { AppState } from '@coocoo/contracts'
import { api } from '@/shared/api/client'

export const stateQueryKey = ['app-state'] as const
export function useAppState(enabled = true) { return useQuery({queryKey:stateQueryKey,queryFn:()=>api<AppState>('/state'),enabled}) }
