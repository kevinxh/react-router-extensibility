import { setExtensionContext } from "extensibility-sdk/context";
import type { AuthContextValue } from "../types.js";

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

  console.log(`    \x1b[2m[auth]\x1b[22m     ${user.currentUser?.name} \x1b[2m(${user.currentUser?.role})\x1b[22m`);

  return next();
}
