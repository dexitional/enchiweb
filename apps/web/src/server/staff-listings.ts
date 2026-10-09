// Staff self-service directory listings. Server-only.
//
// A listing is the staff member's own copy of their directory entry. While it
// is submitted AND an admin has made it visible, publish() copies it into the
// directory: one `people` row per affiliation (tagged listing_id, replaced on
// every change) plus the `staff_profiles` row for its slug. Hiding it removes
// those people rows, which takes a listing-only profile out of the directory.
// The directory itself (server/directory.ts) needs no knowledge of listings.
import { getPool } from "@enchi/db";
import type { StaffAccountRow, StaffListingRow } from "@enchi/db";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { parseProfileDetails, personSlug } from "#/lib/directory";
import {
  HONORIFICS,
  displayName,
  emptyListingForm,
  missingRequirements,
} from "#/lib/staff-listing";
import type { ListingForm, ListingView, UnitOption } from "#/lib/staff-listing";
import { toHtml } from "#/lib/rich-text-format";
import { AppError } from "./api/middleware/error-handler.js";
import { cleanRichText } from "./api/lib/rich-text.js";

// About and Teaching philosophy are rich text: sanitised on save and on read.
const cleanHtml = (value: string | null | undefined) => cleanRichText(toHtml(value)) ?? "";

const pool = () => getPool();

// ---- Reading ---------------------------------------------------------------------

function toForm(row: StaffListingRow): ListingForm {
  const empty = emptyListingForm();
  const honorific = (HONORIFICS as ReadonlyArray<string>).includes(row.honorific ?? "")
    ? (row.honorific as ListingForm["honorific"])
    : "";
  return {
    honorific,
    fullName: row.full_name ?? "",
    position: row.position ?? "",
    staffType: row.staff_type,
    affiliations: Array.isArray(row.affiliations)
      ? row.affiliations.map((a) => ({
          departmentId: Number(a.departmentId),
          role: a.role,
        }))
      : [],
    email: row.email ?? "",
    phone: row.phone ?? "",
    showEmail: row.show_email === 1,
    showPhone: row.show_phone === 1,
    photoUrl: row.photo_url ?? "",
    about: cleanHtml(row.about),
    joinedOn: row.joined_on ? String(row.joined_on).slice(0, 10) : empty.joinedOn,
    details: (({ teachingPhilosophy, ...rest }) => ({
      ...rest,
      teachingPhilosophy: cleanHtml(teachingPhilosophy),
    }))(parseProfileDetails(row.details)),
  };
}

const iso = (v: string | Date | null) => (v ? new Date(v).toISOString() : null);

export function toView(row: StaffListingRow): ListingView {
  const changedSinceReview =
    row.status === "submitted" &&
    !!row.content_updated_at &&
    (!row.reviewed_at || new Date(row.content_updated_at) > new Date(row.reviewed_at));
  return {
    id: row.id,
    status: row.status,
    isVisible: row.is_visible === 1,
    isVerified: row.is_verified === 1,
    profileSlug: row.profile_slug,
    adminNote: row.admin_note,
    submittedAt: iso(row.submitted_at),
    contentUpdatedAt: iso(row.content_updated_at),
    reviewedAt: iso(row.reviewed_at),
    changedSinceReview,
    form: toForm(row),
  };
}

async function findListing(where: "id" | "account_id", value: number) {
  const [rows] = await pool().execute<RowDataPacket[]>(
    `SELECT * FROM staff_listings WHERE ${where} = ?`,
    [value],
  );
  return (rows[0] as StaffListingRow | undefined) ?? null;
}

export async function getListingForAccount(accountId: number) {
  const row = await findListing("account_id", accountId);
  return row ? toView(row) : null;
}

// Everything /directory/my-listing needs; signed out is a normal state there.
export async function portalState(account: StaffAccountRow | null) {
  if (!account) return { account: null, listing: null, units: [] };
  return {
    account: { email: account.email, name: account.name, pictureUrl: account.picture_url },
    listing: await getListingForAccount(account.id),
    units: await unitOptions(),
  };
}

export async function unitOptions(): Promise<Array<UnitOption>> {
  const [rows] = await pool().query<RowDataPacket[]>(
    "SELECT id, name, kind FROM departments WHERE is_published = 1 ORDER BY kind, sort_order, name",
  );
  return rows.map((r) => ({ id: r.id, name: r.name, kind: r.kind }));
}

// ---- Saving (staff) --------------------------------------------------------------

export async function saveListing(accountId: number, input: ListingForm, submit: boolean) {
  const form: ListingForm = {
    ...input,
    about: cleanHtml(input.about),
    details: { ...input.details, teachingPhilosophy: cleanHtml(input.details.teachingPhilosophy) },
  };
  const existing = await findListing("account_id", accountId);
  const ids = [...new Set(form.affiliations.map((a) => a.departmentId))];
  if (ids.length !== form.affiliations.length) {
    throw new AppError("Each department or unit can only be added once.", 400);
  }
  if (ids.length) {
    const [found] = await pool().query<RowDataPacket[]>(
      "SELECT id FROM departments WHERE is_published = 1 AND id IN (?)",
      [ids],
    );
    if (found.length !== ids.length)
      throw new AppError("Choose departments and units from the list.", 400);
  }
  // A submitted listing has to stay complete: it may already be in the directory.
  const willBeSubmitted = submit || existing?.status === "submitted";
  if (willBeSubmitted) {
    const missing = missingRequirements(form);
    if (missing.length) throw new AppError(`Please complete: ${missing.join(", ")}.`, 400);
  }

  const values = [
    form.honorific || null,
    form.fullName || null,
    form.position || null,
    form.staffType,
    JSON.stringify(form.affiliations),
    form.email || null,
    form.phone || null,
    form.showEmail ? 1 : 0,
    form.showPhone ? 1 : 0,
    form.photoUrl || null,
    form.about || null,
    JSON.stringify(form.details),
    form.joinedOn || null,
  ];
  const columns =
    "honorific = ?, full_name = ?, position = ?, staff_type = ?, affiliations = ?, email = ?, phone = ?, " +
    "show_email = ?, show_phone = ?, photo_url = ?, about = ?, details = ?, joined_on = ?";

  let id: number;
  if (existing) {
    id = existing.id;
    await pool().execute(
      `UPDATE staff_listings SET ${columns}, content_updated_at = NOW(),
         status = IF(?, 'submitted', status),
         submitted_at = IF(? AND submitted_at IS NULL, NOW(), submitted_at)
       WHERE id = ?`,
      [...values, submit ? 1 : 0, submit ? 1 : 0, id],
    );
  } else {
    const [r] = await pool().execute<ResultSetHeader>(
      `INSERT INTO staff_listings SET account_id = ?, ${columns}, content_updated_at = NOW(),
         status = ?, submitted_at = ?`,
      [accountId, ...values, submit ? "submitted" : "draft", submit ? new Date() : null],
    );
    id = r.insertId;
  }
  await publish(id);
  return toView((await findListing("id", id))!);
}

// ---- Admin -----------------------------------------------------------------------

export interface AdminListingRow extends ListingView {
  accountEmail: string;
  accountName: string | null;
  accountPicture: string | null;
  createdAt: string;
  unitNames: Array<string>;
}

export async function listForAdmin(): Promise<Array<AdminListingRow>> {
  const [rows] = await pool().query<RowDataPacket[]>(
    `SELECT l.*, a.email AS account_email, a.name AS account_name, a.picture_url AS account_picture
     FROM staff_listings l JOIN staff_accounts a ON a.id = l.account_id
     ORDER BY l.status = 'submitted' DESC, COALESCE(l.content_updated_at, l.created_at) DESC`,
  );
  const units = new Map((await unitOptions()).map((u) => [u.id, u.name]));
  return rows.map((r) => {
    const view = toView(r as StaffListingRow);
    return {
      ...view,
      accountEmail: r.account_email,
      accountName: r.account_name,
      accountPicture: r.account_picture,
      createdAt: new Date(r.created_at).toISOString(),
      unitNames: view.form.affiliations.map((a) => units.get(a.departmentId) ?? "Unknown unit"),
    };
  });
}

export async function getForAdmin(id: number) {
  const row = (await listForAdmin()).find((l) => l.id === id);
  if (!row) throw new AppError("Listing not found.", 404);
  return row;
}

export interface AdminListingUpdate {
  isVisible?: boolean;
  isVerified?: boolean;
  adminNote?: string | null;
  // Link to an existing directory profile, or null to give it its own.
  profileSlug?: string | null;
}

export async function updateByAdmin(id: number, adminId: number, input: AdminListingUpdate) {
  const row = await findListing("id", id);
  if (!row) throw new AppError("Listing not found.", 404);
  if (input.isVisible && row.status !== "submitted") {
    throw new AppError("Only submitted listings can be shown in the directory.", 400);
  }
  if (input.profileSlug) {
    const [found] = await pool().execute<RowDataPacket[]>(
      `SELECT 1 FROM people WHERE profile_slug = ? AND (listing_id IS NULL OR listing_id <> ?)
       UNION SELECT 1 FROM staff_profiles WHERE slug = ? AND (listing_id IS NULL OR listing_id = ?) LIMIT 1`,
      [input.profileSlug, id, input.profileSlug, id],
    );
    if (!found.length) throw new AppError("That directory profile doesn't exist.", 400);
    const [taken] = await pool().execute<RowDataPacket[]>(
      "SELECT id FROM staff_listings WHERE profile_slug = ? AND id <> ?",
      [input.profileSlug, id],
    );
    if (taken.length) throw new AppError("Another listing already publishes to that profile.", 400);
  }

  const sets: Array<string> = ["reviewed_at = NOW()", "reviewed_by = ?"];
  const params: Array<string | number | null> = [adminId];
  if (input.isVisible !== undefined)
    (sets.push("is_visible = ?"), params.push(input.isVisible ? 1 : 0));
  if (input.isVerified !== undefined)
    (sets.push("is_verified = ?"), params.push(input.isVerified ? 1 : 0));
  if (input.adminNote !== undefined)
    (sets.push("admin_note = ?"), params.push(input.adminNote || null));
  if (input.profileSlug !== undefined)
    (sets.push("profile_slug = ?"), params.push(input.profileSlug || null));
  await pool().execute(`UPDATE staff_listings SET ${sets.join(", ")} WHERE id = ?`, [
    ...params,
    id,
  ]);
  await publish(id);
  return getForAdmin(id);
}

export async function deleteListing(id: number) {
  const row = await findListing("id", id);
  if (!row) throw new AppError("Listing not found.", 404);
  // people rows go with it (FK cascade); the profile keeps its data but loses
  // its verified badge and owner.
  await pool().execute("UPDATE staff_profiles SET is_verified = 0 WHERE listing_id = ?", [id]);
  await pool().execute("DELETE FROM staff_listings WHERE id = ?", [id]);
  return row;
}

// ---- Publishing into the directory -----------------------------------------------

async function slugIsFree(conn: PoolConnection, slug: string, listingId: number) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT 1 FROM people WHERE profile_slug = ? AND (listing_id IS NULL OR listing_id <> ?)
     UNION SELECT 1 FROM staff_profiles WHERE slug = ? AND (listing_id IS NULL OR listing_id <> ?)
     UNION SELECT 1 FROM staff_listings WHERE profile_slug = ? AND id <> ? LIMIT 1`,
    [slug, listingId, slug, listingId, slug, listingId],
  );
  return rows.length === 0;
}

async function uniqueSlug(conn: PoolConnection, name: string, listingId: number) {
  const base = personSlug(name);
  for (let n = 1; n < 100; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (await slugIsFree(conn, slug, listingId)) return slug;
  }
  return `${base}-${listingId}`;
}

export async function publish(listingId: number) {
  const conn = await pool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT * FROM staff_listings WHERE id = ? FOR UPDATE",
      [listingId],
    );
    const row = rows[0] as StaffListingRow | undefined;
    if (!row) {
      await conn.rollback();
      return;
    }
    await conn.execute("DELETE FROM people WHERE listing_id = ?", [listingId]);
    const live = row.status === "submitted" && row.is_visible === 1;
    if (!live) {
      await conn.execute("UPDATE staff_profiles SET is_verified = 0 WHERE listing_id = ?", [
        listingId,
      ]);
      await conn.commit();
      return;
    }

    const form = toForm(row);
    const name = displayName(form);
    let slug = row.profile_slug;
    if (!slug) {
      slug = await uniqueSlug(conn, name, listingId);
      await conn.execute("UPDATE staff_listings SET profile_slug = ? WHERE id = ?", [
        slug,
        listingId,
      ]);
    }
    // A profile it published to before (the admin re-linked it) is released.
    await conn.execute(
      "UPDATE staff_profiles SET listing_id = NULL, is_verified = 0 WHERE listing_id = ? AND slug <> ?",
      [listingId, slug],
    );
    await conn.execute(
      `INSERT INTO staff_profiles (slug, staff_type, is_verified, listing_id, photo_url, about, details, joined_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE staff_type = VALUES(staff_type), is_verified = VALUES(is_verified),
         listing_id = VALUES(listing_id), photo_url = VALUES(photo_url), about = VALUES(about),
         details = VALUES(details), joined_on = VALUES(joined_on)`,
      [
        slug,
        form.staffType,
        row.is_verified,
        listingId,
        form.photoUrl || null,
        form.about || null,
        JSON.stringify(form.details),
        form.joinedOn || null,
      ],
    );
    for (const [i, a] of form.affiliations.entries()) {
      await conn.execute(
        `INSERT INTO people (group_key, name, title, profile_slug, listing_id, unit_role, department_id, email, phone, sort_order, is_active)
         VALUES ('staff', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          name,
          form.position,
          slug,
          listingId,
          a.role || null,
          a.departmentId,
          form.showEmail ? form.email || null : null,
          form.showPhone ? form.phone || null : null,
          1000 + i,
        ],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
