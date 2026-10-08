// Erstatter https://deno.land/std/.../server.ts (serve) i handlertests: videregiver til den stubbede Deno.serve.
export const serve = (handler) => globalThis.Deno.serve(handler);
