import { type RouteConfig, index } from "@react-router/dev/routes";
import { withExtensions } from "extensibility-sdk/routes";
import extensionA from "extension-a";
import extensionDevtools from "extension-devtools";

export default withExtensions(
  [index("routes/home.tsx")],
  [extensionA, extensionDevtools]
) satisfies RouteConfig;
