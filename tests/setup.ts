import { vi } from "vitest";

// Route handlers read session cookies through next/headers, which only exists inside a Next request.
// Tests call the handlers directly, so provide an empty cookie jar.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: () => undefined,
    set: () => undefined,
  }),
}));
