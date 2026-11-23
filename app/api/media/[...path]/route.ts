import { readMedia, storageInfo } from "@/lib/storage";

/** Serves photos for both private and public Blob stores (and local dev). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const p = path.join("/");
  if (!/^books\/[0-9a-z]{12}\/photos\/[A-Za-z0-9._-]+$/.test(p) || !storageInfo())
    return new Response("Not found", { status: 404 });
  const media = await readMedia(p).catch(() => null);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(media.body, {
    headers: {
      "content-type": media.contentType,
      // Photo paths are random and never rewritten, so browsers can keep them forever.
      // "private" keeps copies off the shared CDN, so a deleted photo stops loading right away.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
