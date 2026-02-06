/**
 * End the current user session.
 * In a real extension this would invalidate the session/token.
 */
export default async function logout() {
  console.log(`[auth:logout] Session ended`);
  return { success: true };
}
