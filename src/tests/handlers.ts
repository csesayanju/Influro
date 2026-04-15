import { http, HttpResponse } from "msw";

/**
 * Default happy-path handlers.
 * Individual tests can override these with server.use() for error cases.
 */
export const handlers = [
  http.post("/api/account/delete", () => {
    return HttpResponse.json({}, { status: 200 });
  }),
];
