import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-google-analytics",
  version: "0.0.1",
  description: "Initializes Google Analytics around client hydration.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  clientHooks: {
    beforeHydration: "./src/client/beforeHydration.ts",
    afterHydration: "./src/client/afterHydration.ts",
  },
});
