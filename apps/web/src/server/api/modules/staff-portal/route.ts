// The signed-in staff member's own directory listing (/directory/my-listing).
// Every route acts on the caller's own account; there are no ids to tamper with.
import { Hono } from "hono";
import { z } from "zod";
import { getStaffAccount, requireStaff } from "#/server/staff-session";
import { listingFormSchema } from "#/lib/staff-listing";
import * as listings from "#/server/staff-listings";
import { AppError } from "../../middleware/error-handler.js";
import { validate } from "../../lib/validate.js";
import * as media from "../media/service.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const saveSchema = z.object({ form: listingFormSchema, submit: z.boolean() });
const presignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(120),
  size: z.number().int().positive(),
});
const registerSchema = presignSchema.extend({
  key: z.string().min(1).max(500),
  width: z.number().int().positive().max(100_000).nullable().optional(),
  height: z.number().int().positive().max(100_000).nullable().optional(),
});

function checkPhoto(input: { contentType: string; size: number }) {
  if (!IMAGE_TYPES.includes(input.contentType))
    throw new AppError("Upload a JPEG, PNG or WebP photo.", 400);
  if (input.size > MAX_PHOTO_BYTES)
    throw new AppError("That photo is too large — the limit is 5 MB.", 400);
}

export const staffPortalRoute = new Hono()
  // Signed out is a normal state for this page, so it isn't an error.
  .get("/me", async (c) => c.json(await listings.portalState(await getStaffAccount(c))))
  .put("/listing", requireStaff, validate("json", saveSchema), async (c) => {
    const { form, submit } = c.req.valid("json");
    return c.json({
      listing: await listings.saveListing(c.get("staff").id, form, submit),
    });
  })
  .post("/media/presign", requireStaff, validate("json", presignSchema), async (c) => {
    const input = c.req.valid("json");
    checkPhoto(input);
    return c.json(await media.presign({ ...input, folder: "people" }));
  })
  .post("/media", requireStaff, validate("json", registerSchema), async (c) => {
    const input = c.req.valid("json");
    checkPhoto(input);
    if (!input.key.startsWith("enchiweb/cms/people/")) throw new AppError("Invalid upload.", 400);
    const asset = await media.registerAsset(null, {
      ...input,
      folder: "people",
      altText: `Directory photo uploaded by ${c.get("staff").email}`,
    });
    return c.json({ asset });
  });
