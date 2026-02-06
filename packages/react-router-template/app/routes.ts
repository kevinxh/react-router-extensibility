import { type RouteConfig, index } from "@react-router/dev/routes";
import { withExtensions } from "extensibility-sdk/routes";
import extensionA from "extension-a";

export default withExtensions(
  [index("routes/home.tsx")],
  [extensionA]
) satisfies RouteConfig;
