import { fail, json, route } from "@/lib/api";
import { canEdit, keyFrom } from "@/lib/auth";
import { getBook } from "@/lib/books";

export const POST = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return fail("This timeline doesn't exist.", 404);
  return json({ parent: await canEdit(book, keyFrom(req)) });
});
