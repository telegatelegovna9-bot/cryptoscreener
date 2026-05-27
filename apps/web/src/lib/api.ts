// ============================================
// API Client
// Fetch wrapper with automatic response unwrapping
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
}

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  };

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('Failed to parse response', res.status, null);
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      `API error: ${res.status} ${res.statusText}`,
      res.status,
      json,
    );
  }

  return json.data;
}

export const api = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>('GET', path, undefined, init);
  },

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>('POST', path, body, init);
  },

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>('PUT', path, body, init);
  },

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>('PATCH', path, body, init);
  },

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>('DELETE', path, undefined, init);
  },
};

export { ApiError };
