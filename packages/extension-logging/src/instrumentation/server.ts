/**
 * Server-side instrumentation for the logging extension.
 * Instruments request handling and per-route loader/action/middleware execution.
 */

async function log(
  label: string,
  callHandler: () => Promise<{ status: string; error?: Error }>
) {
  const start = Date.now();
  console.log(`[instrumentation] → ${label}`);
  const { status, error } = await callHandler();
  const duration = Date.now() - start;
  if (status === "error") {
    console.log(
      `[instrumentation] ✗ ${label} (${duration}ms) ERROR: ${error?.message}`
    );
  } else {
    console.log(`[instrumentation] ← ${label} (${duration}ms)`);
  }
}

export default {
  handler(handler: any) {
    handler.instrument({
      request(
        handleRequest: () => Promise<any>,
        { request }: { request: { method: string; url: string } }
      ) {
        const url = new URL(request.url);
        return log(
          `${request.method} ${url.pathname}`,
          handleRequest
        );
      },
    });
  },

  route(route: any) {
    route.instrument({
      loader(
        callLoader: () => Promise<any>,
        { unstable_pattern }: { unstable_pattern: string }
      ) {
        return log(`loader (${route.id} ${unstable_pattern})`, callLoader);
      },
      action(
        callAction: () => Promise<any>,
        { unstable_pattern }: { unstable_pattern: string }
      ) {
        return log(`action (${route.id} ${unstable_pattern})`, callAction);
      },
      middleware(
        callMiddleware: () => Promise<any>,
        { unstable_pattern }: { unstable_pattern: string }
      ) {
        return log(
          `middleware (${route.id} ${unstable_pattern})`,
          callMiddleware
        );
      },
    });
  },
};
