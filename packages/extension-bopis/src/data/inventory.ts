import type { StoreInventory } from "../types.js";

const MOCK_INVENTORY: StoreInventory[] = [
  // Classic Sneaker (prod-100)
  { storeId: "store-001", productId: "prod-100", productName: "Classic Sneaker", quantity: 12, available: true },
  { storeId: "store-002", productId: "prod-100", productName: "Classic Sneaker", quantity: 0, available: false },
  { storeId: "store-003", productId: "prod-100", productName: "Classic Sneaker", quantity: 3, available: true },
  { storeId: "store-004", productId: "prod-100", productName: "Classic Sneaker", quantity: 7, available: true },
  { storeId: "store-005", productId: "prod-100", productName: "Classic Sneaker", quantity: 0, available: false },

  // Denim Jacket (prod-200)
  { storeId: "store-001", productId: "prod-200", productName: "Denim Jacket", quantity: 5, available: true },
  { storeId: "store-002", productId: "prod-200", productName: "Denim Jacket", quantity: 2, available: true },
  { storeId: "store-003", productId: "prod-200", productName: "Denim Jacket", quantity: 0, available: false },
  { storeId: "store-004", productId: "prod-200", productName: "Denim Jacket", quantity: 0, available: false },
  { storeId: "store-005", productId: "prod-200", productName: "Denim Jacket", quantity: 9, available: true },

  // Running Shoes (prod-300)
  { storeId: "store-001", productId: "prod-300", productName: "Running Shoes", quantity: 0, available: false },
  { storeId: "store-002", productId: "prod-300", productName: "Running Shoes", quantity: 15, available: true },
  { storeId: "store-003", productId: "prod-300", productName: "Running Shoes", quantity: 4, available: true },
  { storeId: "store-004", productId: "prod-300", productName: "Running Shoes", quantity: 1, available: true },
  { storeId: "store-005", productId: "prod-300", productName: "Running Shoes", quantity: 0, available: false },
];

export function getInventoryForStore(
  storeId: string,
  productId?: string
): StoreInventory[] {
  let results = MOCK_INVENTORY.filter((i) => i.storeId === storeId);
  if (productId) {
    results = results.filter((i) => i.productId === productId);
  }
  return results;
}
