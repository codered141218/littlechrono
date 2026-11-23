"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { Me } from "@/lib/types";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function SignInButton({ label = "Sign in with Google", callbackUrl, className = "btn" }: { label?: string; callbackUrl?: string; className?: string }) {
  return (
    <button className={`${className} google-btn`} onClick={() => signIn("google", { callbackUrl: callbackUrl ?? location.href })}>
      <GoogleIcon /> {label}
    </button>
  );
}

/** Top-bar account control: sign-in button, or avatar with a menu. */
export function AccountMenu({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  if (!me?.authEnabled) return null;
  if (!me.user) return <SignInButton className="btn btn-sm" label="Sign in" />;
  const u = me.user;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="avatar-btn" aria-expanded={open} aria-label="Account" onClick={() => setOpen((o) => !o)}>
        {u.image ? <img src={u.image} alt="" referrerPolicy="no-referrer" /> : <span className="initial">{(u.name || u.email || "?")[0].toUpperCase()}</span>}
        <span className="hide-sm">{u.name?.split(" ")[0] ?? "Account"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="menu" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}>
            <div className="who">{u.email}</div>
            <Link href="/" onClick={() => setOpen(false)}>Your timelines</Link>
            <Link href="/start" onClick={() => setOpen(false)}>Start a new timeline</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
