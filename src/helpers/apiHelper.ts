import { DELCOM_BASEURL } from "@/lib/config";

const ACCESS_TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function putAccessToken(token: string | null): void {
  if (globalThis.window === undefined) return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

type FetchOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  auth?: boolean;
  params?: Record<string, string | number | undefined | null>;
};

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body = null,
    headers = {},
    auth = true,
    params,
  } = options;

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  let url = `${DELCOM_BASEURL}${normalizedEndpoint}`;

  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.append(key, String(value));
      }
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  if (body && !(body instanceof FormData)) {
    if (!finalHeaders["Content-Type"]) {
      finalHeaders["Content-Type"] = "application/json";
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body,
  });

  const data = await response.json().catch(() => ({
    status: "fail",
    message: "Gagal memproses respons server",
  }));

  if (!response.ok || data.status === "fail") {
    const message =
      data?.message ||
      (data?.data?.field ? data.data.field.join(", ") : null) ||
      `Request gagal (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}