import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookView } from "@/components/BookView";
import { SetupNeeded } from "@/components/SetupNeeded";
import { currentUser, isOwner } from "@/lib/auth";
import { getBook, getMoments, toPublic } from "@/lib/books";
import { nameOf } from "@/lib/names";
import { storageInfo } from "@/lib/storage";
import { ThemeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!storageInfo()) return {};
  const book = await getBook(id).catch(() => null);
  if (!book) return { title: "Timeline not found" };
  return {
    title: `${nameOf(book)}'s timeline`,
    description: book.allowFriends
      ? `Watch ${nameOf(book)} grow, moment by moment. Have a photo of ${nameOf(book)}? Add it to the timeline.`
      : `Watch ${nameOf(book)} grow, moment by moment.`,
    robots: { index: false, follow: false },
  };
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const storage = storageInfo();
  if (!storage) return <SetupNeeded />;
  const book = await getBook(id);
  if (!book) notFound();
  const [moments, user] = await Promise.all([getMoments(id), currentUser()]);
  return (
    <>
      <ThemeStyle accent={book.accent} />
      <BookView initial={{ book: toPublic(book), moments }} storage={storage} initialCanEdit={isOwner(book, user)} />
    </>
  );
}
