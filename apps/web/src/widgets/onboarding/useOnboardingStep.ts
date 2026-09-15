import { useEffect } from "react";

export function resolveOnboardingStep(initialStep?: number, savedStep = 1) {
  const urlStep = Number(new URLSearchParams(window.location.search).get("step"));
  const fromQuery = Number.isInteger(urlStep) && urlStep >= 1 && urlStep <= 3 ? urlStep : undefined;
  return Math.min(3, Math.max(1, fromQuery ?? initialStep ?? savedStep));
}

export function useOnboardingStep(step: number) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.pathname = "/onboarding";
    url.searchParams.set("step", String(step));
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [step]);
}
