import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center-page">
      <div className="empty">
        <h2>We couldn&apos;t find that timeline</h2>
        <p>Check that the link was copied completely. Timeline links are long on purpose so they stay private.</p>
        <Link className="btn btn-primary" href="/">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
