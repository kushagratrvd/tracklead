import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionCookie, clearSessionCookie, UserSessionPayload } from "./session";
import { AuthError } from "./permissions";

export async function loginUser(email: string, password: string): Promise<UserSessionPayload> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  if (!user) {
    throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const sessionPayload: UserSessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  await setSessionCookie(sessionPayload);
  return sessionPayload;
}

export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
}
