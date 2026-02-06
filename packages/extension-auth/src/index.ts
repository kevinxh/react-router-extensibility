import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "extension-auth",
  dir: import.meta.url,
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
