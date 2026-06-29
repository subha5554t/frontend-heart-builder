import type { PublicUser, User } from "@/lib/types";

// Mirrors the spec's ApiError so the UI can branch on status codes.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Never let the password hash leave the mock layer.
export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}
