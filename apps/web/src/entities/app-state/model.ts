import { useQuery } from "@tanstack/react-query";
import { AppStateSchema } from "@coocoo/contracts";
import { api } from "@/shared/api/client";

export const stateQueryKey = ["app-state"] as const;
export function useAppState(enabled = true) {
  return useQuery({
    queryKey: stateQueryKey,
    queryFn: () => api("/state", undefined, AppStateSchema),
    enabled,
  });
}
