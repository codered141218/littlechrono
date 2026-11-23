import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { del, get, list, put } from "@vercel/blob";
import type { StorageInfo } from "./types";

/**
 * Two backends behind one tiny interface:
 *  - Vercel Blob when a Blob store is connected (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID)
 *  - the local disk (./.data) for development without any setup
 */

const blobConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

let access: "public" | "private" =
  process.env.BLOB_ACCESS === "public" ? "public" : "private";
let accessDetected = Boolean(process.env.BLOB_ACCESS);

export function storageInfo(): StorageInfo | null {
  if (blobConfigured()) return { mode: "blob", access };
  if (process.env.VERCEL) return null; // read-only filesystem: needs a Blob store
  return { mode: "local" };
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage is not set up. Connect a Vercel Blob store to this project, then redeploy.",
    );
  }
}

function requireInfo(): StorageInfo {
  const info = storageInfo();
  if (!info) throw new StorageNotConfiguredError();
  return info;
}

const localRoot = () =>
  path.resolve(/*turbopackIgnore: true*/ process.env.LOCAL_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data"));

function localPath(p: string) {
  const root = localRoot();
  const full = path.resolve(/*turbopackIgnore: true*/ root, p);
  if (!full.startsWith(root + path.sep)) throw new Error("Bad path");
  return full;
}

/** Retry once with the other access level if the store was created the other way. */
async function withAccess<T>(fn: (a: "public" | "private") => Promise<T>): Promise<T> {
  try {
    const r = await fn(access);
    accessDetected = true;
    return r;
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    if (!accessDetected && /access|private|public/i.test(msg)) {
      const other = access === "private" ? "public" : "private";
      const r = await fn(other);
      access = other;
      accessDetected = true;
      return r;
    }
    throw err;
  }
}

export async function writeJSON(p: string, data: unknown): Promise<void> {
  const info = requireInfo();
  const body = JSON.stringify(data);
  if (info.mode === "local") {
    const full = localPath(p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    return;
  }
  await withAccess((a) =>
    put(p, body, {
      access: a,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    }),
  );
}

export async function readJSON<T>(p: string): Promise<T | null> {
  const info = requireInfo();
  if (info.mode === "local") {
    try {
      return JSON.parse(await fs.readFile(localPath(p), "utf8")) as T;
    } catch {
      return null;
    }
  }
  const res = await withAccess((a) => get(p, { access: a, useCache: false }));
  if (!res || res.statusCode !== 200) return null;
  return (await new Response(res.stream).json()) as T;
}

export async function listPaths(prefix: string): Promise<string[]> {
  const info = requireInfo();
  if (info.mode === "local") {
    try {
      const dir = localPath(prefix.replace(/\/$/, ""));
      const names = await fs.readdir(dir);
      return names.map((n) => `${prefix.replace(/\/$/, "")}/${n}`);
    } catch {
      return [];
    }
  }
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function deletePaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const info = requireInfo();
  if (info.mode === "local") {
    await Promise.all(paths.map((p) => fs.rm(localPath(p), { force: true })));
    return;
  }
  await del(paths);
}

export async function writeLocalFile(p: string, data: Uint8Array): Promise<void> {
  const full = localPath(p);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}

const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function readMedia(
  p: string,
): Promise<{ body: BodyInit; contentType: string } | null> {
  const info = requireInfo();
  if (info.mode === "local") {
    try {
      const buf = await fs.readFile(localPath(p));
      const ext = p.split(".").pop()?.toLowerCase() ?? "";
      return { body: new Uint8Array(buf), contentType: types[ext] ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }
  const res = await withAccess((a) => get(p, { access: a }));
  if (!res || res.statusCode !== 200) return null;
  return { body: res.stream, contentType: res.blob.contentType };
}
