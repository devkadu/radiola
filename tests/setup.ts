import { afterEach, beforeEach, vi } from "vitest";

// Unit tests mock integrations and never use production credentials.
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-publishable-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret-key";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Unmocked network request in unit test"))));
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (typeof document !== "undefined") document.body.innerHTML = "";
});
