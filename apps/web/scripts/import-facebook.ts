// Imports posts, hero slides and the notice banner taken from the college's
// Facebook page (see scripts/facebook/content.ts). Cover banners and flyers
// are uploaded to R2 and registered in the media library.
//
// Idempotent: media are keyed by content hash and reused, posts are matched
// by type+slug and spotlights by title, and the notice is only set when it
// has never been saved — so re-running never overwrites CMS edits.
//
//   npm run import:facebook -w apps/web
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { sanitizeRichText } from "../src/server/api/lib/rich-text";
import { NOTICE, POSTS, SPOTLIGHTS } from "./facebook/content";

const MEDIA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "facebook", "media");

const url = process.env.DATABASE_URL?.replace(/"/g, "");
if (!url) throw new Error("DATABASE_URL is not set.");
const { R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_DOMAIN) {
  throw new Error("R2_* environment variables must be set to upload media.");
}

const db = mysql.createPool({ uri: url });
const s3 = new S3Client({
  region: process.env.R2_REGION ?? "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
const publicDomain = R2_PUBLIC_DOMAIN.replace(/\/$/, "");

// WebP width/height from the file header.
function webpSize(b: Buffer): { width: number; height: number } | null {
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8 ")
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

let uploaded = 0;
let reused = 0;

// Same key shape as CMS uploads (media/service.ts), with the content hash as
// the random part so a re-run finds the file it uploaded before.
async function upload(name: string, alt: string): Promise<string> {
  const body = await readFile(path.join(MEDIA_DIR, `${name}.webp`));
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 8);
  const key = `enchiweb/cms/posts/2026/10/${hash}-${name}.webp`;
  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT url FROM media_assets WHERE file_key = ?",
    [key],
  );
  if (existing[0]) {
    reused++;
    return existing[0].url as string;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: "image/webp",
    }),
  );
  const fileUrl = `${publicDomain}/${key}`;
  const size = webpSize(body);
  await db.execute(
    `INSERT INTO media_assets (file_key, url, filename, mime_type, size_bytes, width, height, alt_text, folder)
     VALUES (?, ?, ?, 'image/webp', ?, ?, ?, ?, 'posts')`,
    [key, fileUrl, `${name}.webp`, body.length, size?.width ?? null, size?.height ?? null, alt],
  );
  uploaded++;
  return fileUrl;
}

async function main() {
  let posts = 0;
  for (const post of POSTS) {
    const cover = await upload(post.image, post.imageAlt);
    const flyer = await upload(`${post.image}-flyer`, post.imageAlt);
    const body = sanitizeRichText(
      post.body.replace("{{flyer}}", `<p><img src="${flyer}" alt="${post.imageAlt}"></p>`).trim(),
    );
    const [r] = await db.execute<mysql.ResultSetHeader>(
      `INSERT IGNORE INTO posts (type, slug, title, excerpt, body, cover_image_url, category, is_featured, is_pinned, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
      [
        post.type,
        post.slug,
        post.title,
        post.excerpt,
        body,
        cover,
        post.category,
        post.featured ? 1 : 0,
        post.pinned ? 1 : 0,
        post.publishedAt,
      ],
    );
    posts += r.affectedRows;
  }

  // New slides go ahead of the existing ones.
  let spotlights = 0;
  const [[first]] = await db.query<RowDataPacket[]>(
    "SELECT COALESCE(MIN(sort_order), 0) AS n FROM spotlights",
  );
  let order = Number(first?.n ?? 0) - SPOTLIGHTS.length;
  for (const s of SPOTLIGHTS) {
    const [found] = await db.query<RowDataPacket[]>("SELECT id FROM spotlights WHERE title = ?", [
      s.title,
    ]);
    if (found.length) continue;
    await db.execute(
      "INSERT INTO spotlights (eyebrow, title, caption, image_url, cta_label, cta_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [s.eyebrow, s.title, s.caption, s.image, s.ctaLabel, s.ctaUrl, order++],
    );
    spotlights++;
  }

  const [notice] = await db.execute<mysql.ResultSetHeader>(
    "INSERT IGNORE INTO site_settings (setting_key, value) VALUES ('notice', ?)",
    [JSON.stringify(NOTICE)],
  );

  console.log(
    `Facebook import: ${posts} new posts, ${spotlights} new hero slides, notice ${notice.affectedRows ? "set" : "left as is"}; media ${uploaded} uploaded, ${reused} reused.`,
  );
  await db.end();
}

main().catch(async (err: unknown) => {
  console.error(err);
  await db.end();
  process.exit(1);
});
