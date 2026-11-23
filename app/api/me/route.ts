import { json, route } from "@/lib/api";
import { authEnabled, currentUser } from "@/lib/auth";
import { getBook, toPublic } from "@/lib/books";
import { listPaths, storageInfo } from "@/lib/storage";
import type { Me } from "@/lib/types";
import { getUserIndex } from "@/lib/users";

export const GET = route(async (req: Request) => {
  const lite = new URL(req.url).searchParams.has("lite");
  const user = await currentUser();
  const me: Me = { authEnabled: authEnabled(), user, books: [] };
  if (user && storageInfo() && !lite) {
    const idx = await getUserIndex(user);
    const books = await Promise.all(
      idx.books.map(async (id) => {
        const b = await getBook(id);
        if (!b || !b.ownerIds?.includes(user.id)) return null;
        const count = (await listPaths(`books/${id}/moments/`)).filter((p) => p.endsWith(".json")).length;
        return { ...toPublic(b), momentCount: count };
      }),
    );
    me.books = books.filter((b): b is NonNullable<typeof b> => Boolean(b));
  }
  return json(me);
});
