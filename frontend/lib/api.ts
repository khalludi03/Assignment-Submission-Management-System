import { clearSession, getToken } from "./auth";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = typeof options.body === "object" && !(options.body instanceof FormData)
    ? JSON.stringify(options.body)
    : (options.body as BodyInit | undefined);

  const res = await fetch(path, { ...options, headers, body });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // keep default message
    }

    if (res.status === 401 && !path.startsWith("/api/auth/login")) {
      clearSession();
      // Full reload so the proxy re-runs and redirects by role; router.push
      // would skip the middleware on client-side navigation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }

    throw new ApiError(res.status, message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
