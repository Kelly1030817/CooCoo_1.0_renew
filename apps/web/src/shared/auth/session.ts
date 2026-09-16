import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../app/query-client";
import { isSupabaseConfigured, readAuthCallbackIssue, supabase } from "./supabase";

export const authSessionQueryKey = ["auth", "session"] as const;
export const authCallbackIssueQueryKey = ["auth", "callback-issue"] as const;
export const authSubscriptionFlagKey = ["auth", "subscription-count"] as const;

export type AuthStatus = "loading" | "signed-in" | "signed-out";

export function startAuthSessionSync(
  toast: (message: string, type?: "success" | "warning" | "error") => void,
) {
  const issue = readAuthCallbackIssue(window.location.hash);
  if (issue) {
    queryClient.setQueryData(authCallbackIssueQueryKey, issue.message);
    toast(issue.message, "error");
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  if (!supabase) {
    queryClient.setQueryData(authSessionQueryKey, null);
    return () => undefined;
  }

  const current = queryClient.getQueryData<number>(authSubscriptionFlagKey) ?? 0;
  queryClient.setQueryData(authSubscriptionFlagKey, current + 1);

  let active = true;
  void supabase.auth.getSession().then(({ data }) => {
    if (active) queryClient.setQueryData(authSessionQueryKey, data.session);
  });
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    queryClient.setQueryData(authSessionQueryKey, session);
  });
  return () => {
    active = false;
    subscription.unsubscribe();
  };
}

export function useAuthSession() {
  const sessionQuery = useQuery({
    queryKey: authSessionQueryKey,
    queryFn: async () => (await supabase?.auth.getSession())?.data.session ?? null,
    staleTime: Infinity,
    enabled: Boolean(supabase),
  });
  const callbackQuery = useQuery({
    queryKey: authCallbackIssueQueryKey,
    queryFn: () => null as string | null,
    staleTime: Infinity,
    initialData: null,
  });

  const session = sessionQuery.data ?? null;
  const status: AuthStatus = !isSupabaseConfigured
    ? "signed-in"
    : sessionQuery.isPending && sessionQuery.data === undefined
      ? "loading"
      : session
        ? "signed-in"
        : "signed-out";

  return {
    session,
    status,
    callbackIssue: callbackQuery.data ?? null,
  };
}
