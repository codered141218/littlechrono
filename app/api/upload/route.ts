import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { fail, json } from "@/lib/api";
import { keyMatches } from "@/lib/auth";
import { getBook } from "@/lib/books";

/** Issues short-lived tokens so browsers upload photos straight to Vercel Blob. */
export async function POST(req: Request) {
  const payload = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body: payload,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { bookId, key } = JSON.parse(clientPayload || "{}") as { bookId?: string; key?: string };
        const book = bookId ? await getBook(bookId) : null;
        if (!book) throw new Error("This timeline doesn't exist.");
        if (!keyMatches(book, key) && !book.allowFriends)
          throw new Error("Photo sharing is paused for this timeline.");
        if (!new RegExp(`^books/${book.id}/photos/[A-Za-z0-9._-]+$`).test(pathname))
          throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return json(result);
  } catch (err) {
    return fail((err as Error).message || "Upload failed.", 400);
  }
}
