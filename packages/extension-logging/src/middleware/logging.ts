import { createLogger } from "extensibility-sdk/logger";

const log = createLogger("extension-logging");

export default async function loggingMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const url = new URL(args.request.url);
  const label = `${args.request.method} ${url.pathname}`;
  const start = Date.now();

  log.info(`→ ${label}`);

  const response = await next();
  const duration = Date.now() - start;

  log.info(`← ${response.status} ${label} (${duration}ms)`);
  return response;
}
