import { api, json } from "@/shared/api/client";

const promptKey = "coocoo:push-prompted:v2";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function requestFirstCookingPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || localStorage.getItem(promptKey)) return "unavailable" as const;
  localStorage.setItem(promptKey, new Date().toISOString());
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) return "granted_without_subscription" as const;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
  const value = subscription.toJSON();
  if (!value.endpoint || !value.keys?.p256dh || !value.keys.auth) return "granted_without_subscription" as const;
  await api("/push-subscriptions", json("POST", { endpoint: value.endpoint, p256dh: value.keys.p256dh, auth: value.keys.auth }));
  return "subscribed" as const;
}
