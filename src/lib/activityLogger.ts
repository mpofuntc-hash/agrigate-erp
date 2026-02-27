import { convex, api } from "./convex/client";

export interface ActivityData {
  category: "crop" | "livestock" | "fuel" | "security" | "weather";
  type:      string;
  value?:    number;
  unit?:     string;
  lat?:      number;
  lng?:      number;
  accuracy?: number;
  notes?:    string;
  timestamp?: number;
}

const QUEUE_KEY = "agrigate-offline-queue";

/**
 * Log an activity.
 * When offline: queues in localStorage and registers Background Sync.
 * When online:  sends directly to Convex.
 */
export async function logActivity(data: ActivityData): Promise<void> {
  if (typeof navigator === "undefined") return;

  if (navigator.onLine) {
    await convex.mutation(api.activities.logActivity, data);
  } else {
    const stored = localStorage.getItem(QUEUE_KEY);
    const queue: ActivityData[] = stored ? JSON.parse(stored) : [];
    queue.push({ ...data, timestamp: data.timestamp ?? Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register("sync-activities");
    }
  }
}

/**
 * Called by the service worker message handler (FLUSH_ACTIVITY_QUEUE).
 * Drains the offline queue and sends to Convex.
 */
export async function flushOfflineQueue(): Promise<void> {
  const stored = localStorage.getItem(QUEUE_KEY);
  if (!stored) return;

  const queue: ActivityData[] = JSON.parse(stored);
  const remaining: ActivityData[] = [];

  for (const item of queue) {
    try {
      await convex.mutation(api.activities.logActivity, item);
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

// Listen for service worker flush requests
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "FLUSH_ACTIVITY_QUEUE") {
      flushOfflineQueue().catch(console.error);
    }
  });
}
