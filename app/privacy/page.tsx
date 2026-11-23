import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="November 23, 2026">
      <p>
        LittleChrono is a small family website for keeping a baby&apos;s moments and photos on a timeline. This page explains
        what it stores and who can see it.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>
          <b>If you sign in with Google:</b> your Google account ID, name, email address and profile picture. We use them only to
          sign you in and show which timelines are yours. We never post to your Google account or read anything else from it.
        </li>
        <li>
          <b>Timelines:</b> the baby&apos;s name, birth details you choose to add (such as time, weight, doctor and place of
          birth), moments, notes and photos.
        </li>
        <li>
          <b>Photos from friends:</b> the photos, caption, date and the name they type in.
        </li>
      </ul>
      <h2>Who can see it</h2>
      <p>
        A timeline can be viewed by anyone who has its share link. Links are long and random, and timeline pages are hidden
        from search engines, but anyone you send the link to can pass it on. Only parents (the account that created the
        timeline, people with its co-parent link, and co-parents who joined) can edit or delete.
      </p>
      <h2>Where it&apos;s kept</h2>
      <p>
        Data and photos are stored with Vercel (Vercel Blob), which hosts this site. Photos are kept in private storage and are
        only shown through this website. Sign-in is handled by Google.
      </p>
      <h2>Deleting your data</h2>
      <p>
        Parents can delete any moment or photo, or a whole timeline from Settings. Deleting removes the moments and photos from
        storage. To have your account record removed, contact us using the support email shown on the Google sign-in screen.
      </p>
      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell data, show ads, or share your information with anyone other than the services above.</p>
    </LegalPage>
  );
}
