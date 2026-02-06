import {
  getExtensionContext,
  getExtensionActions,
} from "extensibility-sdk/context";
import type {
  BopisContextValue,
  BopisActions,
  Store,
  StoreInventory,
} from "../types.js";

export function meta() {
  return [
    { title: "Store Finder — BOPIS" },
    { name: "description", content: "Find a store for in-store pickup" },
  ];
}

export async function loader({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const bopis = getExtensionContext<BopisContextValue>(
    context,
    "extension-bopis"
  );
  const actions = getExtensionActions<BopisActions>(
    context,
    "extension-bopis"
  );

  const stores = bopis?.stores ?? [];
  const preferredStore = bopis?.preferredStore ?? null;

  let preferredStoreInventory: StoreInventory[] = [];
  if (preferredStore && actions?.checkInventory) {
    const result = await actions.checkInventory(preferredStore.id);
    preferredStoreInventory = result.inventory;
  }

  return {
    stores,
    preferredStore,
    preferredStoreInventory,
    deliveryOption: bopis?.deliveryOption ?? "ship-to-home",
  };
}

export async function action({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const formData = await request.formData();
  const storeId = formData.get("storeId") as string;
  const intent = formData.get("intent") as string;

  const actions = getExtensionActions<BopisActions>(
    context,
    "extension-bopis"
  );

  if (intent === "select-store" && storeId && actions?.setPreferredStore) {
    const result = await actions.setPreferredStore(storeId);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/stores",
        "Set-Cookie": result.setCookieHeader,
      },
    });
  }

  if (intent === "clear-store" && actions?.setPreferredStore) {
    const result = await actions.setPreferredStore("");
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/stores",
        "Set-Cookie": result.setCookieHeader,
      },
    });
  }

  return new Response(null, { status: 400 });
}

export default function StoresPage({
  loaderData,
}: {
  loaderData: {
    stores: Store[];
    preferredStore: Store | null;
    preferredStoreInventory: StoreInventory[];
    deliveryOption: string;
  };
}) {
  const { stores, preferredStore, preferredStoreInventory } = loaderData;

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Store Finder
      </h1>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        Pick a store for in-store pickup. This page is provided by{" "}
        <code
          style={{
            background: "#f1f5f9",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          extension-bopis
        </code>
        .
      </p>

      {preferredStore ? (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#166534" }}>
              Pickup store: {preferredStore.name}
            </div>
            <div style={{ fontSize: 12, color: "#4ade80" }}>
              {preferredStore.address}, {preferredStore.city},{" "}
              {preferredStore.state} {preferredStore.zip}
            </div>
          </div>
          <form method="post">
            <input type="hidden" name="intent" value="clear-store" />
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Clear
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
            color: "#92400e",
          }}
        >
          No preferred store selected. Choose a store below for in-store pickup.
        </div>
      )}

      {preferredStore && preferredStoreInventory.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Inventory at {preferredStore.name}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {preferredStoreInventory.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <span>{item.productName}</span>
                <span
                  style={{
                    color: item.available ? "#16a34a" : "#dc2626",
                    fontWeight: 500,
                    fontSize: 12,
                  }}
                >
                  {item.available
                    ? `${item.quantity} in stock`
                    : "Out of stock"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        All Stores
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stores.map((store) => {
          const isSelected = preferredStore?.id === store.id;
          return (
            <div
              key={store.id}
              style={{
                border: isSelected
                  ? "2px solid #22c55e"
                  : "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px 16px",
                background: isSelected ? "#f0fdf4" : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {store.name}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                  >
                    {store.address}, {store.city}, {store.state} {store.zip}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}
                  >
                    {store.phone} &middot; {store.hours}
                  </div>
                </div>
                {!isSelected && (
                  <form method="post">
                    <input type="hidden" name="intent" value="select-store" />
                    <input type="hidden" name="storeId" value={store.id} />
                    <button
                      type="submit"
                      style={{
                        background: "#0284c7",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Select
                    </button>
                  </form>
                )}
                {isSelected && (
                  <span
                    style={{
                      background: "#22c55e",
                      color: "#fff",
                      borderRadius: 12,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <a
          href="/"
          style={{ color: "#0284c7", fontSize: 14, textDecoration: "none" }}
        >
          &larr; Back to Home
        </a>
      </div>
    </main>
  );
}
