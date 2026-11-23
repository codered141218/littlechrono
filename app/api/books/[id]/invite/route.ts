import { fail, json, route } from "@/lib/api";
import { canEdit, hashKey, keyFrom } from "@/lib/auth";
import { getBook, saveBook } from "@/lib/books";
import { newKey } from "@/lib/ids";

/** Makes a fresh parent link. The previous parent link stops working. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist.", 404);
  if (!(await canEdit(book, keyFrom(req)))) return fail("Only parents can invite co-parents.", 403);
  const key = newKey();
  book.keyHash = hashKey(key);
  book.updatedAt = new Date().toISOString();
  await saveBook(book);
  return json({ key });
});
