"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "ra_visitor_id";
const SESSION_KEY = "ra_session_id";
const SESSION_TS_KEY = "ra_session_ts";
const SESSION_TTL_MS = 30 * 60 * 1000;

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function storedId(key: string, prefix: string) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = randomId(prefix);
    localStorage.setItem(key, next);
    return next;
  } catch {
    return randomId(prefix);
  }
}

function sessionId() {
  const now = Date.now();
  try {
    const last = Number(localStorage.getItem(SESSION_TS_KEY) || "0");
    let id = localStorage.getItem(SESSION_KEY);
    if (!id || now - last > SESSION_TTL_MS) {
      id = randomId("s");
      localStorage.setItem(SESSION_KEY, id);
    }
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return randomId("s");
  }
}

function safeUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value, location.origin);
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return "";
  }
}

function sendEvent(
  event: string,
  props: Record<string, string | number | boolean> = {},
  path = location.pathname,
) {
  const params = new URLSearchParams();
  params.set("e", event);
  params.set("p", path);
  params.set("v", storedId(VISITOR_KEY, "v"));
  params.set("s", sessionId());
  params.set("r", safeUrl(document.referrer));
  params.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "");
  params.set("l", navigator.language || "");
  params.set("w", String(window.innerWidth));
  params.set("h", String(window.innerHeight));
  params.set("wd", String(Boolean(navigator.webdriver)));
  for (const [key, value] of Object.entries(props)) {
    params.set(key, String(value).slice(0, 200));
  }
  const url = `/event?${params.toString()}`;
  if (navigator.sendBeacon && navigator.sendBeacon(url)) {
    return;
  }
  fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
}

export function FirstPartyAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname || location.pathname;
    const startedAt = Date.now();
    let maxScroll = 0;
    let clicks = 0;
    let engaged = false;
    let left = false;

    sendEvent("page_view", {}, path);

    const updateScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      maxScroll = Math.max(maxScroll, Math.round((window.scrollY / scrollable) * 100));
    };
    const onClick = (event: MouseEvent) => {
      clicks += 1;
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      const label = target?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || "";
      const href = target instanceof HTMLAnchorElement ? safeUrl(target.href) : "";
      sendEvent("click", { label, href }, path);
    };
    const engagementTimer = window.setTimeout(() => {
      engaged = true;
      updateScroll();
      sendEvent("engaged", { ms: Date.now() - startedAt, scroll: maxScroll }, path);
    }, 10_000);
    const sendLeave = () => {
      if (left) return;
      left = true;
      updateScroll();
      sendEvent("page_leave", {
        ms: Date.now() - startedAt,
        scroll: maxScroll,
        clicks,
        engaged,
      }, path);
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pagehide", sendLeave);
    document.addEventListener("click", onClick, { passive: true });

    return () => {
      sendLeave();
      window.clearTimeout(engagementTimer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pagehide", sendLeave);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  return null;
}