export function meta() {
  return [
    { title: "Privacy Policy" },
    { name: "description", content: "Privacy policy provided by the about-page extension." },
  ];
}

export default function Privacy() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Privacy Policy</h1>
      <p>This route was injected by the about-page extension via the extensibility SDK.</p>
      <p style={{ color: "#666", marginTop: "1rem" }}>
        This is a demo page showing that a single extension can register multiple routes.
      </p>
    </main>
  );
}
