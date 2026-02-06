import { type RouteConfig, index } from "@react-router/dev/routes";
import { withExtensions } from "extensibility-sdk/routes";
import extensionAboutPage from "extension-about-page";
import extensionDevtools from "extension-devtools";

export default withExtensions(
  [index("routes/home.tsx")],
  [extensionAboutPage, extensionDevtools]
) satisfies RouteConfig;
