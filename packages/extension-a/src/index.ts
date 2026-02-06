import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-a",

  routes: ({ route }) => [route("about", "./src/routes/about.tsx")],

  middleware: ["./src/middleware/logging.ts"],

  routeEnhancements: {
    "routes/home": {
      middleware: ["./src/middleware/analytics.ts"],
    },
  },
});
