import { AuthSession } from "@/types/auth";
import { apiRequest } from "./api-client";

export type LoginPayload = {
  email: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}
