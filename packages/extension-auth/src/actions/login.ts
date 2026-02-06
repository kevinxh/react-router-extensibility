/**
 * Authenticate a user with credentials.
 * In a real extension this would validate against a database or auth provider.
 */
export default async function login(username: string, password: string) {
  console.log(`[auth:login] Authenticating ${username}`);

  // Simulate auth — in production this would hit a real auth service
  if (username && password) {
    return {
      success: true,
      user: { id: "u_42", name: username, role: "admin" },
    };
  }

  return { success: false, user: null };
}
