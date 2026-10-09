// Admin review of staff self-service directory listings.
import { Hono } from "hono";
import { z } from "zod";
import * as listings from "#/server/staff-listings";
import { requirePermission } from "../../middleware/require-auth.js";
import { idParam } from "../../lib/query.js";
import { optionalText, slugSchema } from "../../lib/fields.js";
import { logActivity } from "../../lib/activity.js";
import { validate } from "../../lib/validate.js";

const updateSchema = z.object({
  isVisible: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  adminNote: optionalText(500),
  profileSlug: z
    .union([slugSchema, z.literal("")])
    .nullable()
    .optional(),
});

const nameOf = (l: { form: { fullName: string }; accountEmail: string }) =>
  l.form.fullName || l.accountEmail;

export const staffListingsRoute = new Hono()
  .get("/", requirePermission("directory", "view"), async (c) =>
    c.json({ listings: await listings.listForAdmin() }),
  )
  .get("/:id", requirePermission("directory", "view"), async (c) =>
    c.json({ listing: await listings.getForAdmin(idParam(c.req.param("id"))) }),
  )
  .patch(
    "/:id",
    requirePermission("directory", "manage"),
    validate("json", updateSchema),
    async (c) => {
      const input = c.req.valid("json");
      const admin = c.get("admin");
      const listing = await listings.updateByAdmin(idParam(c.req.param("id")), admin.id, input);
      const changes = [
        input.isVisible !== undefined && (input.isVisible ? "shown in the directory" : "hidden"),
        input.isVerified !== undefined && (input.isVerified ? "verified" : "unverified"),
        input.profileSlug !== undefined && "re-linked",
        input.adminNote !== undefined && "noted",
      ].filter(Boolean);
      logActivity(
        admin.id,
        "updated",
        "staff_listing",
        listing.id,
        `Directory listing of ${nameOf(listing)}: ${changes.join(", ") || "reviewed"}`,
      );
      return c.json({ listing });
    },
  )
  .delete("/:id", requirePermission("directory", "manage"), async (c) => {
    const id = idParam(c.req.param("id"));
    const listing = await listings.getForAdmin(id);
    await listings.deleteListing(id);
    logActivity(
      c.get("admin").id,
      "deleted",
      "staff_listing",
      id,
      `Deleted the directory listing of ${nameOf(listing)}`,
    );
    return c.body(null, 204);
  });
