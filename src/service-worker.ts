/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from "$service-worker";

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `agrigate-${version}`;
const QUEUE_KEY  = "agrigate-offline-queue";

// Assets to pre-cache (SvelteKit build output + static files)
const ASSETS = [...build, ...files];

// ── Install: pre-cache static assets ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Background Sync: flush offline activity queue ────────────────────────────
self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-activities") {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue(): Promise<void> {
  const clients = await self.clients.matchAll();
  // Ask the active page client to flush via the Convex client (has auth tokens)
  for (const client of clients) {
    client.postMessage({ type: "FLUSH_ACTIVITY_QUEUE" });
  }
}

// ── Fetch: network-first for API, cache-first for assets ─────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/") || url.hostname.includes("convex.cloud")) {
    // Network-first for all API/Convex calls
    event.respondWith(networkFirst(event.request));
  } else {
    // Cache-first for static assets
    event.respondWith(cacheFirst(event.request));
  }
});

async function networkFirst(request: Request): Promise<Response> {
  try {
    const res = await fetch(request);
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}
