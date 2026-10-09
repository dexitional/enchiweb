// Site-wide settings managed in Admin → Settings. Each group is stored as one
// JSON row in `site_settings` and merged over these defaults on read, so a new
// field never needs a migration and an empty database still renders a site.
// Client-safe: the CMS forms validate with these same schemas.
import { z } from "zod";
import type { PageSection } from "@enchi/db";

// A link is a site path ("/about/history"), an absolute URL, or mailto:/tel:.
const link = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(v),
    "Use a path like /about or a full URL",
  );
const text = (max: number) => z.string().trim().max(max);

export const QUICK_LINK_ICONS = [
  "apply",
  "portal",
  "elearning",
  "library",
  "calendar",
  "download",
  "fees",
  "news",
  "contact",
  "mobile",
] as const;

export const SOCIAL_PLATFORMS = [
  "facebook",
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "tiktok",
] as const;

export const settingsSchemas = {
  identity: z.object({
    name: text(150).min(2),
    shortName: text(40),
    motto: text(120),
    tagline: text(200),
    footerText: text(600),
  }),
  contact: z.object({
    address: text(300),
    postalAddress: text(200),
    phone: text(60),
    altPhone: text(60),
    email: text(150),
    officeHours: text(120),
    mapQuery: text(200),
  }),
  socials: z.object(
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, link])) as Record<
      (typeof SOCIAL_PLATFORMS)[number],
      typeof link
    >,
  ),
  notice: z.object({
    enabled: z.boolean(),
    label: text(30),
    title: text(200),
    text: text(400),
    linkLabel: text(40),
    linkUrl: link,
    expiresOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]),
  }),
  welcome: z.object({
    eyebrow: text(60),
    title: text(160),
    message: text(3000),
    name: text(120),
    role: text(120),
    photoUrl: link,
    linkLabel: text(40),
    linkUrl: link,
  }),
  stats: z.object({
    title: text(120),
    intro: text(300),
    items: z
      .array(
        z.object({
          value: z.number().int().min(0).max(10_000_000),
          suffix: text(6),
          label: text(60),
          note: text(100),
        }),
      )
      .max(8),
  }),
  quickLinks: z.object({
    items: z
      .array(
        z.object({
          label: text(40).min(1),
          url: link,
          icon: z.enum(QUICK_LINK_ICONS),
          highlight: z.boolean(),
        }),
      )
      .max(10),
  }),
  cta: z.object({
    title: text(120),
    highlight: text(120),
    text: text(400),
    primaryLabel: text(40),
    primaryUrl: link,
    secondaryLabel: text(40),
    secondaryUrl: link,
  }),
  // Staff directory (/directory).
  directory: z.object({
    expertiseTags: z.array(text(80).min(1)).max(30),
    listingEmail: text(150),
    listingRecipients: text(200),
  }),
  sections: z.object(
    Object.fromEntries(
      (["about", "academics", "admissions", "student-life", "alumni"] as const).map((s) => [
        s,
        z.object({ intro: text(500), imageUrl: link }),
      ]),
    ) as Record<PageSection, z.ZodObject<{ intro: z.ZodString; imageUrl: typeof link }>>,
  ),
};

export type SettingsKey = keyof typeof settingsSchemas;
export const SETTINGS_KEYS = Object.keys(settingsSchemas) as Array<SettingsKey>;
export type SiteSettings = { [TKey in SettingsKey]: z.infer<(typeof settingsSchemas)[TKey]> };

export const DEFAULT_SETTINGS: SiteSettings = {
  identity: {
    name: "Enchi College of Education",
    shortName: "ENCHICOE",
    motto: "Light Expels Darkness",
    tagline: "Training quality, lifelong specialist teachers since 1965",
    footerText:
      "A public College of Education in Enchi, Western North Region of Ghana, affiliated to the University of Ghana and preparing teachers for basic schools across the nation.",
  },
  contact: {
    address: "Enchi College of Education\nP.O. Box 44, Enchi\nWestern North Region, Ghana",
    postalAddress: "P.O. Box 44, Enchi, Western North Region",
    phone: "+233 (0) 55 351 2424",
    altPhone: "+233 (0) 53 377 4500",
    email: "info@enchicoe.edu.gh",
    officeHours: "Monday – Friday, 8:00am – 5:00pm",
    mapQuery: "Enchi College of Education, Enchi, Ghana",
  },
  socials: {
    facebook: "https://www.facebook.com/ENCEOFFICIALPAGE/",
    x: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    tiktok: "",
  },
  notice: {
    enabled: false,
    label: "Important",
    title: "",
    text: "",
    linkLabel: "Read more",
    linkUrl: "",
    expiresOn: "",
  },
  welcome: {
    eyebrow: "Welcome from the Principal",
    title: "Light expels darkness",
    message:
      "We are thrilled to invite you to become a valued member of our college community. A heartfelt welcome awaits you as you embark on this journey with us to explore and unlock your fullest potential.\n\nSince 1965, Enchi College of Education has prepared dedicated teachers for Ghana's basic schools. Today we offer the Bachelor of Education in Early Grade, Upper Primary and Junior High School Education, in a congenial learning environment that produces quality and lifelong specialist teachers.",
    name: "Prof. Francis Kwaw Andoh",
    role: "Principal, Enchi College of Education",
    photoUrl: "/seed/principal.webp",
    linkLabel: "Office of the Principal",
    linkUrl: "/about/office-of-the-principal",
  },
  stats: {
    title: "Enchi at a Glance",
    intro: "Six decades of preparing teachers for Ghana's basic schools",
    items: [
      { value: 1965, suffix: "", label: "Founded", note: "Over 60 years of teacher education" },
      { value: 1200, suffix: "+", label: "Student-teachers", note: "Across three B.Ed programmes" },
      { value: 3, suffix: "", label: "B.Ed programmes", note: "Early Grade, Upper Primary and JHS" },
      { value: 8814, suffix: "+", label: "Teachers trained", note: "As of the 2022/2023 academic year" },
    ],
  },
  quickLinks: {
    items: [
      { label: "Apply Now", url: "/admissions/how-to-apply", icon: "apply", highlight: true },
      {
        label: "UG Affiliate Portal",
        url: "https://academic.ug.edu.gh/uglink/wfLogin.aspx",
        icon: "portal",
        highlight: false,
      },
      {
        label: "Student Registration (ESRP)",
        url: "https://esrp.enchicoe.edu.gh/",
        icon: "portal",
        highlight: false,
      },
      { label: "ClassPro", url: "https://classpro.tiiny.site/", icon: "elearning", highlight: false },
      { label: "Library", url: "https://library.enchicoe.edu.gh/", icon: "library", highlight: false },
      {
        label: "Academic Calendar",
        url: "/academics/academic-calendar",
        icon: "calendar",
        highlight: false,
      },
      { label: "Enchicoe TV", url: "https://enchicoetv.com/", icon: "news", highlight: false },
      { label: "Downloads", url: "/downloads", icon: "download", highlight: false },
    ],
  },
  cta: {
    title: "Ready to become a",
    highlight: "professional teacher?",
    text: "Applications for the Bachelor of Education programmes open each year through the Colleges of Education admission portal. Find out how to apply and what to expect.",
    primaryLabel: "How to Apply",
    primaryUrl: "/admissions/how-to-apply",
    secondaryLabel: "Contact Admissions",
    secondaryUrl: "/about/contact-us",
  },
  directory: {
    expertiseTags: [],
    listingEmail: "",
    listingRecipients: "the Registry, with the College I.T Unit (CITU) copied",
  },
  sections: {
    about: { intro: "", imageUrl: "/seed/campus-aerial-2.webp" },
    academics: { intro: "", imageUrl: "/seed/students-studying.webp" },
    admissions: { intro: "", imageUrl: "/seed/matriculation-freshers.webp" },
    "student-life": { intro: "", imageUrl: "/seed/students-group.webp" },
    alumni: { intro: "", imageUrl: "/seed/matriculation-dais.webp" },
  },
};

// Merges a stored (possibly partial or stale) value over the defaults; any
// stored value that no longer validates falls back to the default.
export function mergeSetting<TKey extends SettingsKey>(
  key: TKey,
  stored: unknown,
): SiteSettings[TKey] {
  const defaults = DEFAULT_SETTINGS[key];
  if (!stored || typeof stored !== "object") return defaults;
  const merged = { ...defaults, ...stored };
  const parsed = settingsSchemas[key].safeParse(merged);
  return parsed.success ? (parsed.data as SiteSettings[TKey]) : defaults;
}
