"use client";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { byChronologyClient } from "@/lib/sort";
import { api, fetchMe, parentKeyFor, saveBookLocally } from "@/lib/client";
import { birthSentence, nameOf } from "@/lib/names";
import { accentOf, KINDS } from "@/lib/kinds";
import type { Accent, BookPayload, Me, Moment, MomentKind, PublicBook, StorageInfo } from "@/lib/types";
import { AccountMenu } from "./Account";
import { FriendSheet } from "./FriendSheet";
import { Bracelet, Hero } from "./Hero";
import { CameraIcon, GearIcon, Logo, PlayIcon, PlusIcon, ShareIcon } from "./Icons";
import { MomentSheet, type MomentPreset } from "./MomentSheet";
import { MomentViewer } from "./MomentViewer";
import { SettingsSheet, ShareSheet } from "./SettingsSheet";
import { StoryPlayer } from "./StoryPlayer";
import { Timeline } from "./Timeline";
import { useToast } from "./Toast";

type SheetState =
  | { type: "add"; preset?: MomentPreset }
  | { type: "edit"; moment: Moment }
  | { type: "view"; moment: Moment }
  | { type: "friend" }
  | { type: "settings" }
  | { type: "share" }
  | null;

export function applyAccent(accent: Accent) {
  const a = accentOf(accent);
  const root = document.documentElement.style;
  root.setProperty("--accent", a.hex);
  root.setProperty("--accent-deep", a.deep);
  root.setProperty("--accent-soft", a.soft);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", a.hex);
}

export function BookView({
  initial,
  storage,
  initialCanEdit = false,
  topbarExtra,
}: {
  initial: BookPayload;
  storage: StorageInfo;
  initialCanEdit?: boolean;
  topbarExtra?: React.ReactNode;
}) {
  const toast = useToast();
  const [book, setBook] = useState<PublicBook>(initial.book);
  const [moments, setMoments] = useState<Moment[]>(initial.moments);
  const [parentKey, setParentKey] = useState<string | undefined>();
  const [canEdit, setCanEdit] = useState(initialCanEdit);
  const [me, setMe] = useState<Me | null>(null);
  const [filter, setFilter] = useState<MomentKind | "all">("all");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [story, setStory] = useState(false);
  const [preview, setPreview] = useState<Accent | null>(null);
  const known = useRef(new Set(initial.moments.map((m) => m.id)));
  const isParent = canEdit;
  const short = nameOf(book);

  // Theme the whole page with the baby's color.
  useEffect(() => applyAccent(preview ?? book.accent), [preview, book.accent]);

  // Parent access: from ?key= in the link, or remembered on this device.
  useEffect(() => {
    const url = new URL(location.href);
    const fromUrl = url.searchParams.get("key");
    const candidate = fromUrl || parentKeyFor(book.id);
    if (fromUrl) {
      url.searchParams.delete("key");
      history.replaceState(null, "", url.pathname + url.search);
    }
    saveBookLocally({ id: book.id, name: short, accent: book.accent });
    (async () => {
      const account = await fetchMe();
      setMe(account);
      if (!candidate) return;
      const { parent } = await api<{ parent: boolean }>(`/api/books/${book.id}/verify`, { method: "POST", key: candidate });
      if (!parent) {
        if (fromUrl) toast("That parent link isn't valid anymore");
        return;
      }
      setParentKey(candidate);
      setCanEdit(true);
      saveBookLocally({ id: book.id, name: short, accent: book.accent, key: candidate });
      if (account.user) {
        // Signed in: keep this timeline in the account (this is how co-parents join).
        await api(`/api/books/${book.id}/claim`, { method: "POST", key: candidate }).catch(() => null);
        if (fromUrl) toast(`${short}'s timeline is now in your account`);
      } else if (fromUrl) {
        toast(account.authEnabled ? "You can edit here. Sign in to keep it in your account." : "You can edit this timeline on this device now");
      }
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  // Live updates: pick up photos friends add while the page is open.
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await api<BookPayload>(`/api/books/${book.id}`, { key: parentKey });
        const fresh = data.moments.filter((m) => !known.current.has(m.id));
        data.moments.forEach((m) => known.current.add(m.id));
        setMoments(data.moments);
        setBook(data.book);
        const fromFriend = fresh.find((m) => m.author.role === "friend");
        if (fromFriend) toast(`New photo from ${fromFriend.author.name}`);
        else if (fresh.length) toast(`${fresh.length} new moment${fresh.length > 1 ? "s" : ""} added`);
      } catch {}
    };
    const t = setInterval(refresh, 20_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [book.id, toast, parentKey]);

  const upsert = useCallback((m: Moment) => {
    known.current.add(m.id);
    setMoments((xs) => [...xs.filter((x) => x.id !== m.id), m].sort(byChronologyClient));
  }, []);
  const removeMoment = useCallback((id: string) => setMoments((xs) => xs.filter((x) => x.id !== id)), []);

  const counts = useMemo(() => {
    const c: Partial<Record<MomentKind, number>> = {};
    moments.forEach((m) => (c[m.kind] = (c[m.kind] ?? 0) + 1));
    return c;
  }, [moments]);
  const shown = filter === "all" ? moments : moments.filter((m) => m.kind === filter);
  const onOpen = useCallback((m: Moment) => setSheet({ type: "view", moment: m }), []);
  const close = useCallback(() => setSheet(null), []);
  const photoCount = moments.reduce((n, m) => n + m.photos.length, 0);

  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <Link href="/" className="logo" aria-label="LittleChrono home">
          <Logo />
          <span>LittleChrono</span>
        </Link>
        <div className="topbar-actions">
          {topbarExtra}
          {me?.user && (
            <Link href="/" className="btn btn-sm btn-ghost hide-sm">
              All timelines
            </Link>
          )}
          <button className="btn btn-sm" onClick={() => setSheet({ type: "share" })}>
            <ShareIcon size={18} /> Share
          </button>
          {isParent && (
            <button className="icon-btn" onClick={() => setSheet({ type: "settings" })} aria-label="Settings">
              <GearIcon size={20} />
            </button>
          )}
          <AccountMenu me={me} />
        </div>
      </header>

      <Hero book={book}>
        <button className="btn btn-ink" onClick={() => setStory(true)} disabled={!moments.length}>
          <PlayIcon size={18} /> Play {short}&apos;s story
        </button>
        {isParent ? (
          <button className="btn btn-primary" onClick={() => setSheet({ type: "add" })}>
            <PlusIcon size={20} /> Add a moment
          </button>
        ) : (
          book.allowFriends && (
            <button className="btn btn-primary" onClick={() => setSheet({ type: "friend" })}>
              <CameraIcon size={20} /> Add a photo
            </button>
          )
        )}
      </Hero>
      <Bracelet book={book} canEdit={isParent} onAdd={() => setSheet({ type: "settings" })} />

      {moments.length > 0 && (
        <nav className="filters" aria-label="Filter moments">
          <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            Everything <span className="count">{moments.length}</span>
          </button>
          {KINDS.filter((k) => counts[k.id]).map((k) => (
            <button key={k.id} className="chip" aria-pressed={filter === k.id} onClick={() => setFilter(k.id)}>
              {k.plural} <span className="count">{counts[k.id]}</span>
            </button>
          ))}
          <span className="chip" style={{ border: 0, background: "transparent", cursor: "default" }}>
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </span>
        </nav>
      )}

      {shown.length > 0 ? (
        <Timeline key={filter} book={book} moments={shown} onOpen={onOpen} />
      ) : (
        <motion.div className="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isParent ? (
            <>
              <h2>Start with the day {short} arrived</h2>
              <p>Add your first moment and it lands on the timeline in the right place. You can add older moments any time.</p>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setSheet({
                    type: "add",
                    preset: { title: `Hello, ${short}!`, date: book.birthDate, kind: "milestone", star: true, note: birthSentence(book) },
                  })
                }
              >
                <PlusIcon size={20} /> Add the first moment
              </button>
            </>
          ) : (
            <>
              <h2>{short}&apos;s timeline is just getting started</h2>
              <p>
                {book.allowFriends
                  ? `Have a photo of ${short}? Add it and it will appear here in the right spot.`
                  : "Check back soon for the first moments."}
              </p>
              {book.allowFriends && (
                <button className="btn btn-primary" onClick={() => setSheet({ type: "friend" })}>
                  <CameraIcon size={20} /> Add a photo
                </button>
              )}
            </>
          )}
        </motion.div>
      )}

      {!isParent && book.allowFriends && moments.length > 0 && (
        <section className="friend-band">
          <div className="friend-band-inner">
            <h2>Got a photo of {short} on your phone?</h2>
            <button className="btn btn-ink" onClick={() => setSheet({ type: "friend" })}>
              <CameraIcon size={20} /> Add it to the timeline
            </button>
          </div>
        </section>
      )}

      {isParent && (
        <button className="btn btn-primary fab" onClick={() => setSheet({ type: "add" })} aria-label="Add a moment">
          <PlusIcon size={28} />
        </button>
      )}

      <AnimatePresence>
        {sheet?.type === "add" && isParent && (
          <MomentSheet key="add" book={book} storage={storage} parentKey={parentKey} preset={sheet.preset} onClose={close} onSaved={upsert} />
        )}
        {sheet?.type === "edit" && isParent && (
          <MomentSheet
            key="edit"
            book={book}
            storage={storage}
            parentKey={parentKey}
            moment={sheet.moment}
            onClose={close}
            onSaved={upsert}
            onDeleted={removeMoment}
          />
        )}
        {sheet?.type === "view" && (
          <MomentViewer
            key="view"
            book={book}
            moment={sheet.moment}
            isParent={isParent}
            onClose={close}
            onEdit={() => setSheet({ type: "edit", moment: sheet.moment })}
          />
        )}
        {sheet?.type === "friend" && <FriendSheet key="friend" book={book} storage={storage} onClose={close} onSaved={upsert} />}
        {sheet?.type === "share" && <ShareSheet key="share" book={book} isParent={isParent} onClose={close} />}
        {sheet?.type === "settings" && isParent && (
          <SettingsSheet
            key="settings"
            book={book}
            storage={storage}
            parentKey={parentKey}
            onClose={close}
            onSaved={setBook}
            onAccentPreview={setPreview}
            signedIn={Boolean(me?.user)}
            onKeyChange={setParentKey}
          />
        )}
        {story && <StoryPlayer key="story" book={book} moments={moments} onClose={() => setStory(false)} />}
      </AnimatePresence>
    </MotionConfig>
  );
}
