import { setExtensionContext } from "extensibility-sdk/context";
import { createLogger } from "extensibility-sdk/logger";
import type { AuthContextValue } from "../types.js";

const log = createLogger("extension-auth");

export default async function authMiddleware(
  args: { request: Request; context: { get: Function; set: Function } },
  next: () => Promise<Response>
) {
  // In a real extension, this would validate a session cookie or JWT.
  // For demo purposes, we simulate a logged-in user.
  const user: AuthContextValue = {
    currentUser: {
      id: "u_42",
      name: "Alice Johnson",
      role: "admin",
    },
  };

  setExtensionContext(args, "extension-auth", user);

  log.info(`${user.currentUser?.name} (${user.currentUser?.role})`);

  return next();
}
