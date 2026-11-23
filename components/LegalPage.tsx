import Link from "next/link";
import { Logo } from "./Icons";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
      </header>
      <main className="legal">
        <h1>{title}</h1>
        <p className="muted">Last updated {updated}</p>
        {children}
      </main>
    </>
  );
}
