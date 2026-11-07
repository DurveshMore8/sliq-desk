const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface FieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errors: FieldError[];

  constructor(message: string, status: number, errors: FieldError[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RawEnvelope {
  success: boolean;
  message: string;
  data: { errors?: FieldError[] } & Record<string, unknown>;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers:
        options.body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  }

  let payload: RawEnvelope | null;
  try {
    payload = (await res.json()) as RawEnvelope;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? `Request failed (${res.status})`,
      res.status,
      payload?.data?.errors ?? [],
    );
  }
  return payload.data as T;
}

export function fieldError(
  error: ApiError | null,
  path: string,
): string | undefined {
  return error?.errors.find((e) => e.path === path)?.message;
}
