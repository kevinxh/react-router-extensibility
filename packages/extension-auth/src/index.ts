import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-auth",
  version: "0.0.1",
  description: "Provides authentication context to all routes.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  context: true,
  middleware: ["./src/middleware/auth.ts"],
});
