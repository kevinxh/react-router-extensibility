import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-bopis",
  version: "0.0.1",
  description:
    "Buy Online Pick Up In Store — store finder, inventory checking, and delivery options.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  context: true,
  middleware: ["./src/middleware/bopis.ts"],

  routes: ({ route }) => [route("stores", "./src/routes/stores.tsx")],

  actions: {
    findStores: {
      description: "Search or list available BOPIS stores",
      handler: "./src/actions/findStores.ts",
    },
    setPreferredStore: {
      description: "Set the user's preferred pickup store (cookie-based)",
      handler: "./src/actions/setPreferredStore.ts",
    },
    checkInventory: {
      description: "Check product availability at a specific store",
      handler: "./src/actions/checkInventory.ts",
    },
  },
});
