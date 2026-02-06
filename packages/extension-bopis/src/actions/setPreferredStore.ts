import { findStoreById } from "../data/stores.js";

const COOKIE_NAME = "bopis_preferred_store";

export default async function setPreferredStore(storeId: string) {
  console.log(`[bopis:setPreferredStore] storeId=${storeId}`);

  const store = findStoreById(storeId) ?? null;

  const setCookieHeader = store
    ? `${COOKIE_NAME}=${encodeURIComponent(storeId)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
    : `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;

  return { success: !!store, store, setCookieHeader };
}
