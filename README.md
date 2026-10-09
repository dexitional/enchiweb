# Enchi College of Education — website & CMS

The public website of Enchi College of Education (ENCHICOE), with its own content management system at `/admin`. It's a monorepo built the same way as `knh` and `akaweb`:

| Path | What it is |
| --- | --- |
| `apps/web` | TanStack Start app: the public site, the CMS, and a Hono API at `/api` |
| `packages/db` | MySQL migrations, row types and seed scripts (`@enchi/db`) |
| `packages/ui` | Brand tokens (crest navy `#0A4F94`, crest blue `#0178C8` and sky `#8DD0F7`, from the crest blue `#0187DE`) |
| `files/` | Source artwork (`logo.webp`, `principal.jpg`) |

## Getting started

```bash
npm install

# 1. Environment (DB name: enchiweb)
cp packages/db/.env.example packages/db/.env      # DATABASE_URL + first admin
cp apps/web/.env.example apps/web/.env            # DATABASE_URL, session secret, R2

# 2. Database
npm run db:migrate          # creates the tables
npm run db:seed             # creates/rotates the super admin from SEED_ADMIN_*
npm run db:seed-content     # starter pages, units, management, hero slides and a post
npm run directory:backfill -w apps/web   # links management to staff directory profiles

# 3. Run
npm run dev                 # http://localhost:3000, CMS at /admin
```

`db:seed-content` is idempotent and never overwrites CMS edits.

## Starter content from the old site

The seed content comes from the college's previous Hostinger website (enchicoe.edu.gh, October 2026): About (overview, history, mission & vision, accreditation), the College Management team, programmes, admissions, campus life, halls of residence, ESRP, transcript requests and the auditorium project, plus the 15 administrative units listed on its Staff page. Its photos are in `apps/web/public/seed/` (WebP, served through the image optimiser), and the Principal's photo is `files/principal.jpg`.

Still to do in the CMS:

- **Academic departments:** the old site lists none, so the *Academic Departments* page is seeded as a draft. Add departments in **Admin → Departments & Units**, then publish the page.
- **Placeholders:** SRC and alumni executives, and the heads of units not named on the old site, are `[placeholders]`.
- **Management photos:** only the Principal has a photo. The old site's other management photos couldn't be matched to names reliably.
- **Downloads:** the old site's calendar and timetable PDFs no longer exist, so the Downloads library starts empty.

### Posts from the Facebook page

`npm run import:facebook -w apps/web` imports the latest posts from the college's Facebook page (facebook.com/ENCEOFFICIALPAGE, October 2026): the 2026/2027 admission list, checking admission status, printing the admission letter, paying fees and ESRP's move to esrp.enchicoe.edu.gh. Each post keeps its Facebook date and gets a 16:9 cover banner built around its flyer, with the full flyer inside the article. Images are uploaded to R2 and registered in **Media**. It also adds two admissions hero slides and turns on the admissions notice banner. The content is in `apps/web/scripts/facebook/content.ts`. It's idempotent and never overwrites CMS edits.

**Old URLs:** the old site's addresses (`/overview`, `/college-management`, `/hall-of-residence`, `/staff`, …) redirect permanently to their new pages via `apps/web/src/lib/legacy-redirects.ts`.

## File storage (Cloudflare R2)

**For now this site shares akaweb's R2 bucket and credentials.** Its uploads are stored under the `enchiweb/cms/…` key prefix (`apps/web/src/server/api/modules/media/service.ts`), so they can be copied to a dedicated Enchi bucket later by changing the `R2_*` variables and moving that prefix.

Every image and document uploaded in the CMS goes straight from the browser to R2 using a short-lived presigned URL. The signed URL carries the exact file size, so size limits are enforced. Set the `R2_*` variables in `apps/web/.env`. `R2_PUBLIC_DOMAIN` must serve the bucket publicly (a custom domain or `r2.dev`). The bucket also needs a CORS rule allowing uploads from the site:

```json
[{ "AllowedOrigins": ["https://your-site", "http://localhost:3000"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type", "content-length"], "MaxAgeSeconds": 3600 }]
```

### Image optimisation

Images on the site go through `/img?src=…&w=…&q=…` (`src/server/image-optimizer.ts`, mounted as a Nitro handler in `vite.config.ts`). It reads the original straight from R2 (or `public/`), resizes it to one of a fixed set of widths, encodes it as AVIF or WebP (whichever the browser accepts, with JPEG/PNG as a fallback) and caches the result in memory and on disk. CMS uploads have unique keys, so their variants are served with `Cache-Control: immutable` for a year, and any CDN in front of the site can keep them. Files in `public/` are cached for a week. SVGs and GIFs pass through unchanged, and if anything fails the request redirects to the original file, so an image never breaks.

In components, use `<OptimizedImage src sizes="…">` (`src/components/site/optimized-image.tsx`) with a `sizes` value that matches how wide the image renders. Add `priority` for the hero/LCP image, which preloads it from `<head>`. Rich text gets a `srcset` automatically. On the home page, image weight drops from about 6.3 MB to about 0.6 MB on desktop (1.1 MB on a 3× phone). Settings are listed at the end of `apps/web/.env.example`. In production, keep `IMAGE_CACHE_DIR` on persistent storage so variants survive deploys.

## The CMS

| Area | What editors manage |
| --- | --- |
| **Spotlights** | Home page hero slides, with order, visibility and start/end dates |
| **Pages** | Every page under About Us, Academics, Admissions, Student Life and Alumni: rich text, a block-based page builder, banner image, menu visibility and order, SEO fields, drafts and preview |
| **News & Events** | News, events and announcements: scheduled publishing, featured/pinned, categories, tags, cover images, attachments, event dates/venue/registration, announcement expiry, view counts |
| **Departments & Units** | Each with its own page: head, programmes, contacts and linked staff |
| **People** | Management, Principal's office, Governing Council, SRC, alumni executives, staff |
| **Downloads** | Guides, forms, handbooks and calendars, with download counts |
| **Media** | The R2 media library: upload, search, alt text, folders, "where is this used?", delete |
| **Messages** | Contact-form inbox (honeypot and per-IP rate limiting) |
| **Site settings** | Identity, contact details, social links, notice banner, home page welcome/figures/quick links/CTA, section intros |
| **Directory listings** | Staff self-service profiles: show/hide, verify, link to an existing profile, notes |
| **Users / Activity log** | Accounts with roles, plus an audit trail of every change |

**Page builder blocks:** rich text, image & text, card grid, steps, FAQ, callout, figures, quote, gallery (with lightbox), video (YouTube/Vimeo), people, departments/units, downloads, call to action, and contact details (form and map). Each block's shape is defined once in `apps/web/src/lib/blocks.ts`. The editor builds blocks, the API validates them and sanitises their HTML, and the site renders them.

**Roles** (`apps/web/src/lib/permissions.ts`):

| Role | Can do |
| --- | --- |
| Super Admin | Everything, including user accounts |
| Administrator | All content, messages, settings, activity |
| Editor | All website content and media |
| Author | Writes posts as drafts for an editor to publish |

## Public site routes

| Route | Shows |
| --- | --- |
| `/` | Home |
| `/{section}` | Section landing page |
| `/{section}/{slug}` | CMS page (`?preview=1` shows drafts to signed-in staff) |
| `/academics/departments/{slug}`, `/academics/units/{slug}` | Department or unit page |
| `/news`, `/events`, `/announcements` (+ `/{slug}`) | Searchable, filterable listings and detail pages |
| `/downloads` | Guides & Downloads |
| `/search` | Site-wide search |
| `/directory` | Staff directory home (most viewed, new faces, browse by type/expertise) |
| `/directory/search?q=…` / `?initial=A` | Directory search and A–Z browse |
| `/directory/p/{slug}` | Staff profile (counts a view) |
| `/directory/d/{slug}`, `/directory/d/list/{category}` | Unit staff list; all units of a category |
| `/directory/contacts`, `/directory/most-visited-profiles` | Contacts; ranked profiles by period |
| `/directory/my-listing` | Staff sign in with Google to create and edit their own listing |

### Staff directory

Ported from the my-clone directory system. A directory **profile** is one person: every `people`
row (in the Management, Principal's Office, Governing Council or Staff groups) that shares a
`profile_slug` is an affiliation of that profile, so someone listed under two units appears once.
Type, status, photo override and the academic profile (expertise, education, career, publications,
projects, conferences, honours) live in `staff_profiles` and are edited in **Admin → Staff
Directory**; names and positions stay in **People**. Unit category, code, website, featured flag
and related units are set on each department/unit, and the expertise topics and listing-request
email in **Settings → Staff directory**. Views, co-views ("frequently viewed together") and shares
are recorded per day for the rankings. After importing new staff in bulk, run
`npm run directory:backfill -w apps/web` (idempotent) to link profiles and leadership roles.

### Staff self-service listings

Staff create and maintain their own directory profile at **`/directory/my-listing`**, signed in with Google. The form covers personal details, photo, where they work (unit and any leadership role), contact details with show/hide choices, bio and links, expertise, education and career, research and recognition. *About* and *Teaching philosophy* use a compact rich-text editor with bold, italic, underline, lists and links. It is also used in Admin → Staff Directory. The HTML is sanitised on save and on read, and older plain-text bios still display as paragraphs. They can **save a draft** and come back at any time, then **submit for review**. Once a listing is submitted, it has to stay complete.

In **Admin → Directory listings** (with a sidebar count of new submissions), admins review each listing and toggle:

- **Visible:** the listing is published into the directory. While it's visible, the staff member's later edits go live straight away, and the admin list flags them as *Edited since review*.
- **Verified:** the profile shows a *Verified* badge.

Admins can also leave a note that the staff member sees, delete a listing, or **link it to an existing profile**. Linking means someone already in the directory, for example from People, doesn't get a second profile.

How it fits the directory (`apps/web/src/server/staff-listings.ts`): a visible listing writes one `people` row per unit, tagged with `listing_id`, plus the `staff_profiles` row for its slug. Hiding it removes those rows. `server/directory.ts` reads them like any other profile. Rows owned by a listing are replaced whenever it is saved, so edit those people through the listing, not in Admin → People. If a listing is linked to an existing profile and then hidden, that profile's curated entries remain, along with the bio the listing wrote.

**Google sign-in setup:** create an OAuth client (type *Web application*) in Google Cloud Console and add the authorised redirect URI `{APP_URL}/api/staff-auth/google/callback`, for example `https://enchicoe.edu.gh/api/staff-auth/google/callback` and `http://localhost:3000/api/staff-auth/google/callback`. Then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/web/.env`. `STAFF_EMAIL_DOMAINS=enchicoe.edu.gh` restricts sign-in to college accounts. For local testing without Google, `STAFF_DEV_LOGIN=true` adds an email-only sign-in. It is ignored in production builds.

Staff sessions are separate from CMS logins: a 30-day cookie signed with a key derived from `ADMIN_SESSION_SECRET`.

## Conventions

These follow `knh`:

- **Server code stays out of the browser bundle.** Server code reaches routes only through dynamic imports inside `createServerFn` handlers or the `/api` catch-all.
- **Rich text is sanitised twice.** It goes through an allowlist both on save and on read.
- **Migrations hold one `CREATE TABLE` per file.**
