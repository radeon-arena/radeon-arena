"use client";

// Client-side auth: a token kept in localStorage (no external provider).
// Users paste the ADMIN_TOKEN (or SUBMIT_TOKEN) on the admin/submit screens;
// it's attached as a Bearer token to the API. An optional display name is sent
// via X-Author so submissions/comments are attributed without a user database.

const TOKEN_KEY = "ra_token";
const AUTHOR_KEY = "ra_author";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

export function getAuthor(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTHOR_KEY);
}

export function setAuthor(name: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(AUTHOR_KEY, name);
}

/** Headers for an authenticated API call (Bearer token + optional X-Author). */
export function authHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  const a = getAuthor();
  if (a) h["X-Author"] = a;
  return h;
}

export function isSignedIn(): boolean {
  return !!getToken();
}
