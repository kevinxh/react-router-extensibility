import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { extensibilityPlugin } from "extensibility-sdk/vite";
import extensionA from "extension-a";

export default defineConfig({
  plugins: [
    tailwindcss(),
    extensibilityPlugin({ extensions: [extensionA] }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
