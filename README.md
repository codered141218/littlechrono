# LittleChrono

A baby timeline for parents. Add moments and photos as they happen, and LittleChrono strings them onto one animated, chronological timeline. Share a link so friends and family can watch, and add their own photos of the baby.

## What it does

- **Animated timeline home page.** Moments hang from a thread that draws itself as you scroll, grouped into age chapters (Bump, Newborn, 1 month old…). A floating badge shows which age you're scrolling through.
- **Play the story.** A full-screen, story-style playback of every moment in order, with slow zooms on photos (tap or arrow keys to skip, space to pause).
- **Live age counter.** The baby's exact age ticks by the second, or counts down to the due date.
- **Friends add photos with a link.** Anyone with the share link can add photos with their name. Parents can edit or delete them, and can turn sharing off.
- **Smart uploads.** Photos are resized in the browser, uploaded the moment they're picked, and the date is read from the photo's EXIF data automatically.
- **Personal.** Five color themes, cover photo, "big moment" stickers, filters by kind of moment, and new photos from friends show up live without a refresh.

There are no accounts. Creating a timeline gives you two links:

| Link | Who it's for | What it can do |
| --- | --- | --- |
| Share link `/b/<id>` | Friends & family | View, play the story, add photos (if allowed) |
| Parent link `/b/<id>?key=…` | Parents only | Everything: add, edit, delete, settings |

Opening the parent link once on a device remembers parent access there.

## Deploy to Vercel

1. Import this repository in Vercel (**Add New → Project**). The Next.js defaults work as-is.
2. In the project, open **Storage → Create → Blob**, create a store (Private is recommended for baby photos) and connect it to the project for all environments. This adds the storage credentials automatically.
3. Redeploy. That's it.

The app works with both private and public Blob stores; photos are always served through the app at `/api/media/…`. Set `BLOB_ACCESS=public` or `BLOB_ACCESS=private` only if you want to skip auto-detection.

## Run locally

```bash
npm install
npm run dev
```

Without Blob credentials, data and photos are stored in `./.data` so you can try everything locally. To use your Vercel Blob store locally, run `vercel env pull .env.local` first.

## How data is stored

```
books/<id>/book.json              name, birth date, theme, hashed parent key
books/<id>/moments/<momentId>.json one file per moment
books/<id>/photos/<random>.jpg     resized photos
```

Parent keys are stored only as SHA-256 hashes. Timeline IDs are random and unguessable, and timeline pages are excluded from search engines.

## Tech

Next.js (App Router) · React · Motion · Vercel Blob · exifr
