"use client";

const TOKEN_COOKIE = "auth_token";
const USER_COOKIE = "auth_user";

export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function getSessionUser(): { email: string; fullName: string; role: string } | null {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function setSession(token: string, email: string, fullName: string, role: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify({ email, fullName, role }))}; path=/; SameSite=Lax`;
}

export function clearSession() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; Max-Age=0`;
  document.cookie = `${USER_COOKIE}=; path=/; Max-Age=0`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
