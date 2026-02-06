import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "extension-about-page",
  dir: import.meta.url,
  version: "0.0.1",
  description: "This is a DEMO extension that showcase a simple new page.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  routes: ({ route }) => [
    route("about", "./src/routes/about.tsx"),
    route("privacy", "./src/routes/privacy.tsx"),
  ],
});
