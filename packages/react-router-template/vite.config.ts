import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { extensibilityPlugin } from "extensibility-sdk/vite";
import extensionAboutPage from "extension-about-page";
import extensionAuth from "extension-auth";
import extensionDevtools from "extension-devtools";
import extensionLogging from "extension-logging";

export default defineConfig({
  plugins: [
    tailwindcss(),
    extensibilityPlugin({ extensions: [extensionAboutPage, extensionAuth, extensionDevtools, extensionLogging] }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
