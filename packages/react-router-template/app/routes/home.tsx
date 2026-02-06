import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getExtensionContext } from "extensibility-sdk/context";
import type { AuthContextValue } from "extension-auth/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const auth = getExtensionContext<AuthContextValue>(context, "extension-auth");
  return { currentUser: auth?.currentUser ?? null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { currentUser } = loaderData;

  return (
    <>
      {currentUser && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 8,
            padding: "10px 16px",
            margin: "16px auto",
            maxWidth: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "system-ui, sans-serif",
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
      )}
      <main className="flex items-center justify-center pt-16 pb-4">
        <div className="flex-1 flex flex-col items-center gap-12 min-h-0">
          <h1 className="text-5xl font-bold text-gray-900 text-center">
            Extensibility Demo
          </h1>
          <div className="flex flex-col gap-4 w-full max-w-md px-4">
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
