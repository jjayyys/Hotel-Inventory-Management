import { AuthSession } from "@/types/auth";
import { getStoredSession } from "./auth-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildHeaders(session: AuthSession | null, init?: HeadersInit) {
  const headers = new Headers(init);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const session = auth ? getStoredSession() : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(session, headers),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorBody = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(", ");
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
