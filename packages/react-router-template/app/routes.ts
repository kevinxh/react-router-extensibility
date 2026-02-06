import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { withExtensions } from "extensibility-sdk/routes";
import extensionAboutPage from "extension-about-page";
import extensionAuth from "extension-auth";
import extensionBopis from "extension-bopis";
import extensionDevtools from "extension-devtools";
import extensionLogging from "extension-logging";
import extensionGoogleAnalytics from "extension-google-analytics";

export default withExtensions(
  [
    index("routes/home.tsx"),
    route("product/:productId", "routes/product.$productId.tsx"),
  ],
  [extensionAboutPage, extensionAuth, extensionBopis, extensionDevtools, extensionLogging, extensionGoogleAnalytics]
) satisfies RouteConfig;
