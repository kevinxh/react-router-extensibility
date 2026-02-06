import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "extension-devtools",
  dir: import.meta.url,
  version: "0.0.1",
  description: "Developer tools for inspecting installed extensions.",
  author: { name: "@salesforce", url: "https://npmjs.com/package/@salesforce" },

  routes: ({ route }) => [route("__sfnext-devtools", "./src/routes/devtools.tsx")],
});
