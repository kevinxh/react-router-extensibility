import { getInventoryForStore } from "../data/inventory.js";

export default async function checkInventory(
  storeId: string,
  productId?: string
) {
  console.log(
    `[bopis:checkInventory] storeId=${storeId}, productId=${productId}`
  );
  const inventory = getInventoryForStore(storeId, productId);
  return { inventory };
}
