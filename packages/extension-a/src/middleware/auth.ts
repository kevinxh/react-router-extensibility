/**
 * Global middleware from extension-a.
 * Logs every incoming request — demonstrates global middleware injection.
 */
export default async function authMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const url = new URL(args.request.url);
  console.log(`[extension-a:auth] ${args.request.method} ${url.pathname}`);
  return next();
}
