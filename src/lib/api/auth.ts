import { commit, delay, getDb, sessionStore, uid } from "@/lib/mock/store";
import type { PublicUser } from "@/lib/types";
import type {
  LoginInput,
  PasswordInput,
  ProfileInput,
  RegisterInput,
} from "@/lib/validators";
import { ApiError, toPublicUser } from "@/lib/api/shared";

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const db = getDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (!user || user.password !== input.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = uid("token");
  sessionStore.save(token, user.id);
  return delay({ token, user: toPublicUser(user) });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const exists = getDb().users.some(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (exists) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const id = uid("u");
  commit((db) => {
    db.users.push({
      id,
      name: input.name,
      email: input.email,
      password: input.password,
    });
  });

  const token = uid("token");
  sessionStore.save(token, id);
  const user = getDb().users.find((u) => u.id === id)!;
  return delay({ token, user: toPublicUser(user) });
}

export function logout(): void {
  sessionStore.clear();
}

// Resolves the current session from the persisted token, or null if signed out.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = sessionStore.getToken();
  const userId = sessionStore.getUserId();
  if (!token || !userId) return null;

  const user = getDb().users.find((u) => u.id === userId);
  return user ? toPublicUser(user) : null;
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
): Promise<PublicUser> {
  const clash = getDb().users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.id !== userId,
  );
  if (clash) throw new ApiError(409, "That email is already in use");

  commit((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new ApiError(404, "User not found");
    user.name = input.name;
    user.email = input.email;
  });

  return delay(toPublicUser(getDb().users.find((u) => u.id === userId)!));
}

export async function changePassword(
  userId: string,
  input: PasswordInput,
): Promise<{ success: true }> {
  commit((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.password !== input.currentPassword) {
      throw new ApiError(400, "Current password is incorrect");
    }
    user.password = input.newPassword;
  });

  return delay({ success: true } as const);
}
