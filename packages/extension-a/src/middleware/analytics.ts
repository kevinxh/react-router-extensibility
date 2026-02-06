/**
 * Route-specific middleware from extension-a.
 * Tracks page views — demonstrates per-route middleware injection.
 * Only runs on routes that this extension enhances (e.g. routes/home).
 */
export default async function analyticsMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  const url = new URL(args.request.url);
  console.log(
    `[extension-a:analytics] ${url.pathname} — ${duration}ms`
  );
  return response;
}
