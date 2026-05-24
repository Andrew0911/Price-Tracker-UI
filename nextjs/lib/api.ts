const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const AUTH_COOKIE = "auth_token"
const COOKIE_MAX_AGE = 60 * 60 // 1 hour in seconds

// --- Token helpers (cookie-based so middleware can read server-side) ---

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function setAuthToken(token: string): void {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
}

export function clearAuthToken(): void {
  document.cookie = `${AUTH_COOKIE}=; max-age=0; path=/; SameSite=Lax`
}

// --- Core fetch wrapper ---

export type ApiResponse<T = unknown> = {
  message: string
  data?: T
  errors?: Record<string, string[]>
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    const hadToken = !!getAuthToken()
    clearAuthToken()
    if (hadToken && typeof window !== "undefined") {
      window.location.href = "/login"
    }
    const json: ApiResponse = await response.json()
    throw json
  }

  const json: ApiResponse<T> = await response.json()

  if (!response.ok) {
    throw json
  }

  return json
}

// --- Convenience methods ---

export const api = {
  get<T = unknown>(endpoint: string, options?: RequestOptions) {
    return apiFetch<T>(endpoint, { ...options, method: "GET" })
  },

  post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ) {
    return apiFetch<T>(endpoint, { ...options, method: "POST", body })
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return apiFetch<T>(endpoint, { ...options, method: "PUT", body })
  },

  patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ) {
    return apiFetch<T>(endpoint, { ...options, method: "PATCH", body })
  },

  delete<T = unknown>(endpoint: string, options?: RequestOptions) {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE" })
  },
}
