import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-logging",
  description: "Adds request logging to all routes via global middleware.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  middleware: ["./src/middleware/logging.ts"],
});
