import type { Route } from "./+types/product.$productId";
import { Link } from "react-router";
import {
  getExtensionContext,
  getExtensionActions,
} from "extensibility-sdk/context";
import type { AuthContextValue } from "extension-auth/types";
import type {
  BopisContextValue,
  BopisActions,
  StoreInventory,
} from "extension-bopis/types";
import { getProduct, getAllProducts } from "../data/products";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.product?.name ?? "Product";
  return [{ title: `${name} — Extensibility Demo` }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const product = getProduct(params.productId);
  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  // Cross-extension data sharing: read from multiple extensions
  // Each returns undefined if the extension is not installed
  const auth = getExtensionContext<AuthContextValue>(
    context,
    "extension-auth"
  );
  const bopis = getExtensionContext<BopisContextValue>(
    context,
    "extension-bopis"
  );
  const bopisActions = getExtensionActions<BopisActions>(
    context,
    "extension-bopis"
  );

  // If BOPIS is installed and has a preferred store, check inventory for this product
  let storeInventory: StoreInventory | null = null;
  if (bopis?.preferredStore && bopisActions?.checkInventory) {
    const result = await bopisActions.checkInventory(
      bopis.preferredStore.id,
      product.id
    );
    storeInventory = result.inventory[0] ?? null;
  }

  return {
    product,
    currentUser: auth?.currentUser ?? null,
    bopis: bopis
      ? {
          preferredStore: bopis.preferredStore,
          deliveryOption: bopis.deliveryOption,
        }
      : null,
    storeInventory,
  };
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  const { product, currentUser, bopis, storeInventory } = loaderData;

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <Link
        to="/"
        style={{
          color: "#0284c7",
          fontSize: 13,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: 20,
        }}
      >
        &larr; Back to Home
      </Link>

      {/* Product Info — always renders */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
          marginBottom: 20,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {product.category === "Footwear" ? "\uD83D\uDC5F" : "\uD83E\udde5"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {product.category}
        </div>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        {product.name}
      </h1>
      <div
        style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}
      >
        ${product.price.toFixed(2)}
      </div>
      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        {product.description}
      </p>

      {/* Auth-aware greeting — only if extension-auth is installed */}
      {currentUser && (
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            fontFamily: "monospace",
            marginBottom: 4,
            paddingLeft: 2,
          }}
        >
          Context from{" "}
          <span style={{ color: "#0284c7" }}>extension-auth</span>
        </div>
      )}
      {currentUser && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: "#0c4a6e",
          }}
        >
          Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
        </div>
      )}

      {/* BOPIS section — only renders if extension-bopis is installed */}
      <div
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontFamily: "monospace",
          marginBottom: 4,
          paddingLeft: 2,
        }}
      >
        {bopis ? (
          <>
            Context from{" "}
            <span style={{ color: "#16a34a" }}>extension-bopis</span>
          </>
        ) : (
          <>
            <span style={{ color: "#16a34a" }}>extension-bopis</span> not
            installed
          </>
        )}
      </div>

      {bopis ? (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
              color: "#334155",
            }}
          >
            Delivery Options
          </div>

          {/* Ship to Home option */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 6,
              marginBottom: 6,
              background:
                bopis.deliveryOption === "ship-to-home" ? "#f0f9ff" : "transparent",
              border:
                bopis.deliveryOption === "ship-to-home"
                  ? "1px solid #bae6fd"
                  : "1px solid transparent",
              cursor: "default",
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid",
                borderColor:
                  bopis.deliveryOption === "ship-to-home" ? "#0284c7" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {bopis.deliveryOption === "ship-to-home" && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#0284c7",
                  }}
                />
              )}
            </span>
            <span>Ship to Home</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Free shipping
            </span>
          </label>

          {/* Pickup in Store option */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 6,
              background:
                bopis.deliveryOption === "pickup-in-store"
                  ? "#f0fdf4"
                  : "transparent",
              border:
                bopis.deliveryOption === "pickup-in-store"
                  ? "1px solid #bbf7d0"
                  : "1px solid transparent",
              cursor: "default",
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid",
                borderColor:
                  bopis.deliveryOption === "pickup-in-store"
                    ? "#16a34a"
                    : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {bopis.deliveryOption === "pickup-in-store" && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#16a34a",
                  }}
                />
              )}
            </span>
            <div style={{ flex: 1 }}>
              <div>Pick Up In Store</div>
              {bopis.preferredStore ? (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  <span style={{ fontWeight: 500 }}>
                    {bopis.preferredStore.name}
                  </span>
                  {" — "}
                  {bopis.preferredStore.address}, {bopis.preferredStore.city}
                  {storeInventory && (
                    <div style={{ marginTop: 4 }}>
                      {storeInventory.available ? (
                        <span style={{ color: "#16a34a", fontWeight: 500 }}>
                          {storeInventory.quantity} in stock
                        </span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: 500 }}>
                          Out of stock at this store
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <Link
                      to="/stores"
                      style={{ color: "#0284c7", textDecoration: "none" }}
                    >
                      Change store
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  <Link
                    to="/stores"
                    style={{ color: "#0284c7", textDecoration: "none" }}
                  >
                    Select a store for pickup
                  </Link>
                </div>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: "#64748b",
          }}
        >
          Free shipping on all orders
        </div>
      )}

      {/* Add to Cart — always renders */}
      <button
        style={{
          width: "100%",
          padding: "12px 0",
          background: "#0f172a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        Add to Cart
      </button>

      {/* Other products */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          Other Products
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {getAllProducts()
            .filter((p) => p.slug !== product.slug)
            .map((p) => (
              <Link
                key={p.slug}
                to={`/product/${p.slug}`}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "#334155",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 500 }}>{p.name}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  ${p.price.toFixed(2)}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </main>
  );
}
