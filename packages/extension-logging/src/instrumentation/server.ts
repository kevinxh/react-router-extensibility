import { createLogger } from "extensibility-sdk/logger";

const log = createLogger("extension-logging");

/**
 * Clean up route IDs for display.
 * File-system routes: "routes/home" → "routes/home"
 * Extension routes (absolute paths): "/Users/.../src/routes/devtools" → "devtools"
 */
function cleanRouteId(id: string): string {
  if (id.startsWith("/")) {
    const parts = id.split("/");
    return parts[parts.length - 1];
  }
  return id;
}

export default {
  handler(handler: any) {
    handler.instrument({
      request(
        handleRequest: () => Promise<any>,
        { request }: { request: { method: string; url: string } }
      ) {
        const url = new URL(request.url);
        const path = url.pathname;

        log.requestStart(request.method, path);

        const start = Date.now();
        return handleRequest().then((result: any) => {
          log.requestEnd(request.method, path, Date.now() - start);
          return result;
        });
      },
    });
  },

  route(route: any) {
    const id = cleanRouteId(route.id);

    route.instrument({
      loader(callLoader: () => Promise<any>) {
        const start = Date.now();
        return callLoader().then((result: any) => {
          log.loader(id, Date.now() - start);
          return result;
        });
      },

      action(callAction: () => Promise<any>) {
        const start = Date.now();
        return callAction().then((result: any) => {
          log.action(id, Date.now() - start);
          return result;
        });
      },
    });
  },
};
