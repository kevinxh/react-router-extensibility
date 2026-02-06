import { setExtensionContext } from "extensibility-sdk/context";
import type { BopisContextValue } from "../types.js";
import { findStoreById, MOCK_STORES } from "../data/stores.js";

const COOKIE_NAME = "bopis_preferred_store";

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export default async function bopisMiddleware(
  args: { request: Request; context: { get: Function; set: Function } },
  next: () => Promise<Response>
) {
  const cookieHeader = args.request.headers.get("cookie") ?? "";
  const preferredStoreId = parseCookie(cookieHeader, COOKIE_NAME);

  const preferredStore = preferredStoreId
    ? findStoreById(preferredStoreId) ?? null
    : null;

  const bopisContext: BopisContextValue = {
    preferredStore,
    stores: MOCK_STORES,
    deliveryOption: preferredStore ? "pickup-in-store" : "ship-to-home",
  };

  setExtensionContext(args, "extension-bopis", bopisContext);

  console.log(
    `[bopis] Preferred store: ${
      preferredStore ? preferredStore.name : "none"
    }, delivery: ${bopisContext.deliveryOption}`
  );

  return next();
}
