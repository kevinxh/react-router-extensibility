/**
 * Retrieve the current session data.
 * In a real extension this would read from a session store or cookie.
 */
export default async function getSession() {
  console.log(`[auth:getSession] Reading session`);

  // Simulate session lookup
  return {
    currentUser: { id: "u_42", name: "Alice Johnson", role: "admin" },
  };
}
