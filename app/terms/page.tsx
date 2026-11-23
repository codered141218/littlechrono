import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="November 23, 2026">
      <p>LittleChrono is a free family website provided as is. By using it you agree to these simple rules:</p>
      <ul>
        <li>Only upload photos you took or have permission to share.</li>
        <li>Don&apos;t upload anything illegal, hurtful, or that you wouldn&apos;t want the baby&apos;s family to see.</li>
        <li>Parents can remove any photo or moment on their timeline at any time.</li>
        <li>Keep your co-parent link private. Anyone who has it can edit and delete the timeline.</li>
        <li>Keep your own copies of photos that matter to you. We do our best, but we can&apos;t guarantee the service will always be available.</li>
      </ul>
      <p>
        See the <a href="/privacy">privacy policy</a> for what we store and how to delete it.
      </p>
    </LegalPage>
  );
}
