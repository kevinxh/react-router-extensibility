import { type RouteConfig, index } from "@react-router/dev/routes";
import { withExtensions } from "extensibility-sdk/routes";
import extensionAboutPage from "extension-about-page";
import extensionAuth from "extension-auth";
import extensionDevtools from "extension-devtools";
import extensionLogging from "extension-logging";

export default withExtensions(
  [index("routes/home.tsx")],
  [extensionAboutPage, extensionAuth, extensionDevtools, extensionLogging]
) satisfies RouteConfig;
