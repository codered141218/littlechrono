import "server-only";
import { StorageNotConfiguredError } from "./storage";

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "cache-control": "no-store" } });

export const fail = (message: string, status = 400) => json({ error: message }, status);

export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof StorageNotConfiguredError) return fail(err.message, 503);
      console.error(err);
      return fail("Something went wrong on our side. Try again in a moment.", 500);
    }
  };
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}
