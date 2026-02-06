import { searchStores } from "../data/stores.js";

export default async function findStores(query?: {
  zip?: string;
  limit?: number;
}) {
  console.log(`[bopis:findStores] query=${JSON.stringify(query)}`);
  const stores = searchStores(query);
  return { stores };
}
