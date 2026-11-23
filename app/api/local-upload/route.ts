import { fail, json } from "@/lib/api";
import { keyMatches } from "@/lib/auth";
import { getBook } from "@/lib/books";
import { newKey } from "@/lib/ids";
import { storageInfo, writeLocalFile } from "@/lib/storage";

/** Development-only upload endpoint used when no Blob store is connected. */
export async function POST(req: Request) {
  if (storageInfo()?.mode !== "local") return fail("Local uploads are disabled.", 404);
  const form = await req.formData();
  const file = form.get("file");
  const book = await getBook(String(form.get("bookId") ?? ""));
  if (!book) return fail("This timeline doesn't exist.", 404);
  if (!keyMatches(book, String(form.get("key") ?? "")) && !book.allowFriends)
    return fail("Photo sharing is paused for this timeline.", 403);
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp|gif)$/.test(file.type))
    return fail("Only JPEG, PNG, WebP or GIF photos can be added.");
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `books/${book.id}/photos/${newKey().slice(0, 16)}.${ext}`;
  await writeLocalFile(path, new Uint8Array(await file.arrayBuffer()));
  return json({ pathname: path });
}
