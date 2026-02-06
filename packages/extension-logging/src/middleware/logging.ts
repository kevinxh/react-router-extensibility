export default async function loggingMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const url = new URL(args.request.url);
  const start = Date.now();
  console.log(`[logging] → ${args.request.method} ${url.pathname}`);

  const response = await next();
  const duration = Date.now() - start;

  console.log(`[logging] ← ${args.request.method} ${url.pathname} ${response.status} (${duration}ms)`);
  return response;
}
