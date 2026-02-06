export function meta() {
  return [
    { title: "About" },
    { name: "description", content: "This page is provided by the about-page extension." },
  ];
}

export default function About() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>About</h1>
      <p>This route was injected by the about-page extension via the extensibility SDK.</p>
    </main>
  );
}
