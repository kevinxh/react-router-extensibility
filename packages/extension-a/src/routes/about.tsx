export function meta() {
  return [
    { title: "About — Extension A" },
    { name: "description", content: "This page is provided by Extension A." },
  ];
}

export default function About() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>About</h1>
      <p>This route was injected by Extension A via the extensibility SDK.</p>
    </main>
  );
}
