import { defineExtension } from "extensibility-sdk";

export default defineExtension({
  name: "extension-google-analytics",
  dir: import.meta.url,
  version: "0.0.1",
  description: "Initializes Google Analytics around client hydration.",
  author: { name: "Kevin He", url: "https://github.com/kevinxh" },

  clientHooks: {
    beforeHydration: "./src/client/beforeHydration.ts",
    afterHydration: "./src/client/afterHydration.ts",
  },
});
