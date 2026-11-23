"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton } from "@/components/Account";
import { Logo } from "@/components/Icons";

/** Shown when Google sign-in is cancelled or fails. */
export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(new URLSearchParams(location.search).get("error")), []);
  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
      </header>
      <main className="center-page">
        <div className="empty">
          <h2>Sign in to LittleChrono</h2>
          <p>
            {error === "AccessDenied"
              ? "Google sign-in was cancelled. Try again when you're ready."
              : error
                ? "Google sign-in didn't go through. Try again, and if it keeps happening, check that sign-in is set up for this site."
                : "Use your Google account to keep all your timelines in one place."}
          </p>
          <SignInButton className="btn btn-primary" callbackUrl="/" label="Continue with Google" />
        </div>
      </main>
    </>
  );
}
