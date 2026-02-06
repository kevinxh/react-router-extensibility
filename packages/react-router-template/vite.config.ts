import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { extensibilityPlugin } from "extensibility-sdk/vite";
import extensionAboutPage from "extension-about-page";
import extensionAuth from "extension-auth";
import extensionBopis from "extension-bopis";
import extensionDevtools from "extension-devtools";
import extensionLogging from "extension-logging";
import extensionGoogleAnalytics from "extension-google-analytics";

export default defineConfig({
  plugins: [
    tailwindcss(),
    extensibilityPlugin({ extensions: [
      extensionAboutPage,
      extensionAuth,
      extensionBopis,
      extensionDevtools,
      extensionLogging,
      extensionGoogleAnalytics
    ]}),
    reactRouter(),
    tsconfigPaths(),
  ],
});
