import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
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
      <Welcome />
    </>
  );
}
