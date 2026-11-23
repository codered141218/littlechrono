import { fail, json, route } from "@/lib/api";
import { currentUser, keyFrom, keyMatches } from "@/lib/auth";
import { getBook, saveBook } from "@/lib/books";
import { addBookToUser } from "@/lib/users";

/** Adds a timeline to the signed-in account, proven by its parent link key. */
export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return fail("Sign in first.", 401);
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist.", 404);
  if (!keyMatches(book, keyFrom(req)) && !book.ownerIds?.includes(user.id))
    return fail("That parent link isn't valid anymore.", 403);
  if (!book.ownerIds?.includes(user.id)) {
    book.ownerIds = [...(book.ownerIds ?? []), user.id];
    await saveBook(book);
  }
  await addBookToUser(user, id);
  return json({ ok: true });
});
