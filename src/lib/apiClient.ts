// src/lib/apiClient.ts
// Bu dosya: backend'e istek atmanın tek standardı.
// - Base URL (.env.local -> NEXT_PUBLIC_API_BASE_URL)
// - JSON request/response
// - Hata durumunda HttpError fırlatır (status + body ile)

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5131";

// Backend middleware'in döndürdüğü hata formatı (bizim projede):
// { error, type, details, traceId }
export type ApiErrorBody = {
  error?: string;
  type?: string;
  details?: string | null;
  traceId?: string;
  // Model validation (ASP.NET) bazen farklı döner:
  // { title, status, errors: { Field: ["msg"] } }
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
  raw?: string;
};

export class HttpError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any; // JSON objesi
  token?: string | null; // access token
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // Bazı durumlarda backend boş cevap dönebilir; güvenli parse
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    // Hata mesajını mümkün olduğunca anlamlı üretelim
    const message =
      (data && (data.error || data.title)) ||
      `HTTP ${res.status} ${res.statusText}`;

    throw new HttpError(message, res.status, data ?? undefined);
  }

  return data as T;
}

function safeJsonParse(text: string): ApiErrorBody | any {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}