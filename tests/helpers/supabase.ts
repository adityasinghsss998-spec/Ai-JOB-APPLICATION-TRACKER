import { vi } from "vitest";

/**
 * Creates a chainable, "thenable" query-builder mock that mimics the
 * Supabase JS query builder API (e.g. `.eq().eq()`, `.select().single()`).
 * Every chain method returns the same object so calls can be composed in
 * any order, and the object resolves to `result` when awaited directly.
 */
export function createChainable<T>(result: T) {
  const chainable: any = {
    eq: vi.fn(() => chainable),
    order: vi.fn(() => chainable),
    select: vi.fn(() => chainable),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => void, reject?: (reason?: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chainable;
}

interface SupabaseMockOptions {
  user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;
}

/**
 * Builds a minimal Supabase client mock. Table-specific query behaviour
 * should be configured via `supabase.from.mockImplementation(...)` in each
 * test, this helper only wires up `auth.getUser()` and reasonable defaults.
 */
export function createSupabaseMock({ user = { id: "user-1" } }: SupabaseMockOptions = {}) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  };
  return supabase;
}