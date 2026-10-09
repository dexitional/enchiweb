// Staff self-service directory listings (/directory/my-listing): the form's
// shape, shared by the page, the staff API and the admin review screen.
// Client-safe: no server imports.
import { z } from "zod";
import { profileDetailsSchema } from "./directory";
import { htmlToText } from "./rich-text-format";

export const HONORIFICS = [
  "",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Miss",
  "Dr.",
  "Prof.",
  "Rev.",
  "Very Rev.",
] as const;

const text = (max: number) => z.string().trim().max(max);
const date = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"), z.literal("")]);

export const listingAffiliationSchema = z.object({
  departmentId: z.number().int().positive(),
  role: text(120), // leadership role there, e.g. "Head of Department"; optional
});

// What staff edit. Every field may be empty while the listing is a draft;
// LISTING_REQUIREMENTS lists what must be filled in to submit.
export const listingFormSchema = z.object({
  honorific: z.enum(HONORIFICS),
  fullName: text(150),
  position: text(150),
  staffType: z.enum(["teaching", "non-teaching"]).nullable(),
  affiliations: z.array(listingAffiliationSchema).max(5),
  email: z.union([
    z.string().trim().toLowerCase().email("Enter a valid email").max(150),
    z.literal(""),
  ]),
  phone: text(30),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  photoUrl: z.union([z.string().trim().url().max(700), z.literal("")]),
  about: text(20000), // HTML from the rich-text editor
  joinedOn: date,
  details: profileDetailsSchema,
});

export type ListingForm = z.infer<typeof listingFormSchema>;

export const emptyListingForm = (): ListingForm => ({
  honorific: "",
  fullName: "",
  position: "",
  staffType: null,
  affiliations: [],
  email: "",
  phone: "",
  showEmail: true,
  showPhone: false,
  photoUrl: "",
  about: "",
  joinedOn: "",
  details: profileDetailsSchema.parse({}),
});

export const ABOUT_MIN_LENGTH = 40;

// Checked before a listing can be submitted for review.
export const LISTING_REQUIREMENTS: Array<{
  label: string;
  met: (f: ListingForm) => boolean;
}> = [
  { label: "Full name", met: (f) => f.fullName.trim().length >= 3 },
  { label: "Position", met: (f) => f.position.trim().length > 0 },
  { label: "Staff type", met: (f) => f.staffType !== null },
  {
    label: "At least one department or unit",
    met: (f) => f.affiliations.some((a) => a.departmentId > 0),
  },
  { label: "Contact email", met: (f) => f.email.length > 0 },
  {
    label: "A short bio (About)",
    met: (f) => htmlToText(f.about).length >= ABOUT_MIN_LENGTH,
  },
];

export const missingRequirements = (f: ListingForm) =>
  LISTING_REQUIREMENTS.filter((r) => !r.met(f)).map((r) => r.label);

/** "Dr." + "Emmanuel Adom Ahun" → "Dr. Emmanuel Adom Ahun" */
export const displayName = (f: Pick<ListingForm, "honorific" | "fullName">) =>
  [f.honorific, f.fullName.trim()].filter(Boolean).join(" ");

// What the staff portal and the admin screen get back.
export interface ListingView {
  id: number;
  status: "draft" | "submitted";
  isVisible: boolean;
  isVerified: boolean;
  profileSlug: string | null;
  adminNote: string | null;
  submittedAt: string | null;
  contentUpdatedAt: string | null;
  reviewedAt: string | null;
  // Edited by the staff member since an admin last reviewed it.
  changedSinceReview: boolean;
  form: ListingForm;
}

export interface UnitOption {
  id: number;
  name: string;
  kind: "department" | "unit";
}
