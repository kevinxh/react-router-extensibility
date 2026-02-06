import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getExtensionContext } from "extensibility-sdk/context";
import type { AuthContextValue } from "extension-auth/types";
import { getAllProducts } from "../data/products";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const auth = getExtensionContext<AuthContextValue>(context, "extension-auth");
  return { currentUser: auth?.currentUser ?? null, products: getAllProducts() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { currentUser, products } = loaderData;

  return (
    <>
      {currentUser && (
        <div
          style={{
            margin: "16px auto",
            maxWidth: 500,
            fontFamily: "system-ui, sans-serif",
          }}
        >
        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginBottom: 4, paddingLeft: 2 }}>
          Context from <span style={{ color: "#0284c7" }}>extension-auth</span>
        </div>
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 8,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              background: "#0284c7",
              color: "#fff",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {currentUser.name.charAt(0)}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Welcome, {currentUser.name}!
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Role: {currentUser.role} &middot; ID: {currentUser.id}
            </div>
          </div>
        </div>
        </div>
      )}
      <main className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-12 min-h-0">
          <h1 className="text-5xl font-bold text-gray-900 text-center">
            Extensibility Demo
          </h1>

          <div className="flex flex-col gap-4 w-full max-w-md px-4">
            <div className="text-sm font-medium text-gray-500 text-center">Products</div>
            {products.map((p) => (
              <Link
                key={p.slug}
                to={`/product/${p.slug}`}
                className="block text-center text-lg font-medium text-gray-800 hover:text-blue-700 border border-gray-200 rounded-2xl p-5 hover:bg-gray-50 transition-colors"
              >
                {p.name}
                <span className="block text-sm text-gray-400">${p.price.toFixed(2)}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4 w-full max-w-md px-4">
            <div className="text-sm font-medium text-gray-500 text-center">Extensions</div>
            <Link
              to="/stores"
              className="block text-center text-xl font-medium text-blue-700 hover:text-blue-900 border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-400">(extension-bopis)</span>
              <br />
              Store Finder
            </Link>
            <Link
              to="/about"
              className="block text-center text-xl font-medium text-blue-700 hover:text-blue-900 border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-400">(extension-about-page)</span>
              <br />
              About
            </Link>
            <Link
              to="/__sfnext-devtools"
              className="block text-center text-xl font-medium text-blue-700 hover:text-blue-900 border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-400">(extension-devtools)</span>
              <br />
              Devtools
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
