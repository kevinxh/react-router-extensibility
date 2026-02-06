import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { extensibilityPlugin } from "extensibility-sdk/vite";
import extensionA from "extension-a";
import extensionDevtools from "extension-devtools";

export default defineConfig({
  plugins: [
    tailwindcss(),
    extensibilityPlugin({ extensions: [extensionA, extensionDevtools] }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
