import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "extension-logging",
  dir: import.meta.url,
  version: "0.0.1",
  description: "Adds request logging to all routes via global middleware.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  middleware: ["./src/middleware/logging.ts"],

  instrumentations: {
    server: "./src/instrumentation/server.ts",
  },
});
