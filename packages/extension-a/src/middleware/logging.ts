/**
 * Global middleware from extension-a.
 * Logs every incoming request — demonstrates global middleware injection.
 */
export default async function loggingMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const url = new URL(args.request.url);
  console.log(`[extension-a:logging] ${args.request.method} ${url.pathname}`);
  return next();
}
