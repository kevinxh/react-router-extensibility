import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-auth",
  version: "0.0.1",
  description: "Provides authentication context and actions to all routes.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  context: true,
  middleware: ["./src/middleware/auth.ts"],

  actions: {
    login: {
      description: "Authenticate a user with credentials",
      handler: "./src/actions/login.ts",
    },
    logout: {
      description: "End the current session",
      handler: "./src/actions/logout.ts",
    },
    getSession: {
      description: "Retrieve the current session data",
      handler: "./src/actions/getSession.ts",
    },
  },
});
