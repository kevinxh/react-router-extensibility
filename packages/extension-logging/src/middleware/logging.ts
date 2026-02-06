const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;

export default async function loggingMiddleware(
  args: { request: Request },
  next: () => Promise<Response>
) {
  const url = new URL(args.request.url);
  const label = `${args.request.method} ${url.pathname}`;
  const start = Date.now();

  console.log(`    ${dim("[logging]")}  → ${label}`);

  const response = await next();
  const duration = Date.now() - start;

  console.log(
    `    ${dim("[logging]")}  ← ${green(String(response.status))} ${label} ${dim("(")}${yellow(duration + "ms")}${dim(")")}`
  );
  return response;
}
