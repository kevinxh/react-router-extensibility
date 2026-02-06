export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  hours: string;
  coordinates: { lat: number; lng: number };
}

export interface StoreInventory {
  storeId: string;
  productId: string;
  productName: string;
  quantity: number;
  available: boolean;
}

export type DeliveryOption = "ship-to-home" | "pickup-in-store";

/**
 * Context value provided by extension-bopis.
 * Read with `getExtensionContext<BopisContextValue>(context, "extension-bopis")`.
 */
export interface BopisContextValue {
  preferredStore: Store | null;
  stores: Store[];
  deliveryOption: DeliveryOption;
}

/**
 * Server-side actions provided by extension-bopis.
 * Read with `getExtensionActions<BopisActions>(context, "extension-bopis")`.
 */
export interface BopisActions {
  findStores: (query?: {
    zip?: string;
    limit?: number;
  }) => Promise<{ stores: Store[] }>;
  setPreferredStore: (
    storeId: string
  ) => Promise<{ success: boolean; store: Store | null; setCookieHeader: string }>;
  checkInventory: (
    storeId: string,
    productId?: string
  ) => Promise<{ inventory: StoreInventory[] }>;
}
