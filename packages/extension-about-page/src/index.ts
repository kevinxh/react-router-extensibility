import { defineExtension } from "extensibility-sdk";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

export default defineExtension(packageRoot, {
  name: "extension-about-page",
  version: "0.0.1",
  description: "This is a DEMO extension that showcase a simple new page.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  routes: ({ route }) => [
    route("about", "./src/routes/about.tsx"),
    route("privacy", "./src/routes/privacy.tsx"),
  ],
});
