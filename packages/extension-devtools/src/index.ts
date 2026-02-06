import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-devtools",
  description: "Developer tools for inspecting installed extensions.",
  author: { name: "@salesforce", url: "https://npmjs.com/package/@salesforce" },

  routes: ({ route }) => [route("__sfnext-devtools", "./src/routes/devtools.tsx")],
});
