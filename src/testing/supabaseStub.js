// Erstatter jsr:@supabase/supabase-js i handlertests (se vitest.config.js og edgeHarness.js).
export function createClient(url, key, opts) {
  return globalThis.__edgeTest.createClient(url, key, opts);
}
