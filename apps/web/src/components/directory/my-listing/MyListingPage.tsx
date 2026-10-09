// /directory/my-listing — staff sign in with Google, fill in their directory
// listing, save it as a draft or submit it for review, and come back to edit
// it at any time. Admins decide when it is shown and whether it is verified.
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Circle,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  ImageUp,
  LogOut,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { ApiError, api } from "#/lib/api-client";
import { IMAGE_ACCEPT, uploadToLibrary } from "#/lib/upload";
import {
  ABOUT_MIN_LENGTH,
  HONORIFICS,
  LISTING_REQUIREMENTS,
  displayName,
  emptyListingForm,
  missingRequirements,
} from "#/lib/staff-listing";
import type { ListingForm, ListingView, UnitOption } from "#/lib/staff-listing";
import type { ProfileDetails } from "#/lib/directory";
import { cn } from "#/lib/utils";
import { Field, Switch } from "#/components/admin/ui";
import { ItemList } from "#/components/admin/block-editor";
import {
  BackgroundFields,
  ExpertiseFields,
  ProfileLinksField,
  RecognitionFields,
  ResearchFields,
} from "#/components/directory-form/profile-details-fields";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { RichTextEditor } from "#/components/admin/rich-text-editor";
import { htmlToText } from "#/lib/rich-text-format";

interface Me {
  account: {
    email: string;
    name: string | null;
    pictureUrl: string | null;
  } | null;
  listing: ListingView | null;
  units: Array<UnitOption>;
}

interface AuthConfig {
  google: boolean;
  devLogin: boolean;
  domains: Array<string>;
}

const SIGN_IN_ERRORS: Record<string, string> = {
  not_configured: "Google sign-in hasn't been set up for this website yet.",
  cancelled: "Sign-in was cancelled.",
  invalid_state: "Your sign-in session expired. Please try again.",
  google_failed: "We couldn't confirm your Google account. Please try again.",
  domain: "Please sign in with your college email account.",
};

const SECTIONS = [
  { id: "personal", label: "Personal details" },
  { id: "work", label: "Where you work" },
  { id: "contact", label: "Contact details" },
  { id: "about", label: "About you" },
  { id: "expertise", label: "Expertise" },
  { id: "background", label: "Education & career" },
  { id: "research", label: "Research" },
  { id: "recognition", label: "Recognition" },
] as const;

export function MyListingPage({
  error,
  initialMe,
  config,
}: {
  error?: string;
  initialMe: Me;
  config: AuthConfig;
}) {
  // Rendered on the server from the loader; kept in the query cache so saving
  // can update it.
  const { data: me } = useQuery({
    queryKey: ["staff-portal", "me"],
    queryFn: () => api.get<Me>("/staff-portal/me"),
    initialData: initialMe,
    staleTime: Infinity,
  });

  return (
    <div className="min-h-screen bg-[#f3f6fa] pb-24">
      <header className="bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <nav className="mb-4 text-sm text-white/70" aria-label="Breadcrumb">
            <Link to="/directory" className="hover:text-white">
              Staff Directory
            </Link>{" "}
            <span aria-hidden="true">›</span> <span className="text-white">My listing</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Your staff directory listing
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Create and update your own profile in the Enchi College of Education staff directory.
            Save your progress and come back at any time — the college reviews each listing before
            it appears.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        {error && SIGN_IN_ERRORS[error] && (
          <p className="mt-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {SIGN_IN_ERRORS[error]}
          </p>
        )}
        {me.account ? (
          <ListingEditor me={me as Me & { account: NonNullable<Me["account"]> }} />
        ) : (
          <SignIn config={config} />
        )}
      </div>
    </div>
  );
}

// ---- Signed out ---------------------------------------------------------------------

function SignIn({ config }: { config: AuthConfig }) {
  const [devEmail, setDevEmail] = useState("");
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-primary">Sign in to get started</h2>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {[
          "Sign in with your Google account — no new password to remember.",
          "Fill in your details, expertise, qualifications and publications.",
          "Save a draft and finish later, then submit it for review.",
          "Once approved, your profile appears in the directory. Edit it whenever you like.",
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-crest" aria-hidden="true" /> {t}
          </li>
        ))}
      </ul>
      {config.domains.length ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Use your college account ({config.domains.map((d) => `@${d}`).join(", ")}).
        </p>
      ) : null}
      <div className="mt-6">
        {!config.google ? (
          <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
            Google sign-in hasn&apos;t been set up for this website yet. Please check back soon.
          </p>
        ) : (
          <a
            href="/api/staff-auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <GoogleLogo /> Continue with Google
          </a>
        )}
      </div>
      {config.devLogin && (
        <form
          className="mt-6 border-t border-dashed border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/api/staff-auth/dev?email=${encodeURIComponent(devEmail)}`;
          }}
        >
          <p className="mb-2 text-xs font-semibold text-amber-700 uppercase">
            Development sign-in (STAFF_DEV_LOGIN)
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Sign in
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

// ---- Signed in ----------------------------------------------------------------------

function initialForm(me: Me & { account: NonNullable<Me["account"]> }): ListingForm {
  if (me.listing) return me.listing.form;
  return {
    ...emptyListingForm(),
    fullName: me.account.name ?? "",
    email: me.account.email,
  };
}

function ListingEditor({ me }: { me: Me & { account: NonNullable<Me["account"]> } }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ListingForm>(() => initialForm(me));
  const [dirty, setDirty] = useState(false);
  const listing = me.listing;
  const submitted = listing?.status === "submitted";
  const missing = missingRequirements(form);
  const aboutLength = htmlToText(form.about).length;
  // Shown beside the submit button, so it's clear why it's disabled.
  const stillNeeded = missing.map((label) =>
    label === "A short bio (About)"
      ? `${label}, ${ABOUT_MIN_LENGTH - aboutLength} more characters`
      : label,
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (patch: Partial<ListingForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setDetails = (patch: Partial<ProfileDetails>) => {
    setForm((f) => ({ ...f, details: { ...f.details, ...patch } }));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: (submit: boolean) =>
      api.put<{ listing: ListingView }>("/staff-portal/listing", {
        // Rows where no department has been chosen yet aren't saved.
        form: {
          ...form,
          affiliations: form.affiliations.filter((a) => a.departmentId > 0),
        },
        submit,
      }),
    onSuccess: ({ listing: saved }, submit) => {
      queryClient.setQueryData<Me>(["staff-portal", "me"], (old) =>
        old ? { ...old, listing: saved } : old,
      );
      setForm(saved.form);
      setDirty(false);
      toast.success(
        submit && !submitted
          ? "Submitted for review. We'll let the college know."
          : saved.status === "submitted"
            ? saved.isVisible
              ? "Saved. Your directory profile has been updated."
              : "Saved."
            : "Draft saved. You can come back and finish it any time.",
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your listing."),
  });

  const signOut = async () => {
    await api.post("/staff-auth/logout");
    window.location.href = "/directory/my-listing";
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-3">
            {me.account.pictureUrl ? (
              <img
                src={me.account.pictureUrl}
                alt=""
                className="size-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                {me.account.email[0]?.toUpperCase()}
              </span>
            )}
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{me.account.name ?? "Signed in"}</p>
              <p className="truncate text-xs text-muted-foreground">{me.account.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <LogOut className="size-3.5" aria-hidden="true" /> Sign out
          </button>
        </div>

        <StatusCard listing={listing} />

        <div className="rounded-xl border border-border bg-white p-4">
          <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Needed to submit
          </p>
          <ul className="space-y-1.5 text-sm">
            {LISTING_REQUIREMENTS.map((r) => {
              const met = r.met(form);
              return (
                <li
                  key={r.label}
                  className={cn(
                    "flex items-center gap-2",
                    met ? "text-slate-700" : "text-muted-foreground",
                  )}
                >
                  {met ? (
                    <Check className="size-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="size-4" aria-hidden="true" />
                  )}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <nav
          className="hidden rounded-xl border border-border bg-white p-2 lg:block"
          aria-label="Form sections"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-secondary hover:text-primary"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <form
        className="flex min-w-0 flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(true);
        }}
      >
        <Section
          id="personal"
          title="Personal details"
          intro="How your name and role appear in the directory."
        >
          <div className="grid gap-6 sm:grid-cols-[170px_1fr]">
            <PhotoField
              value={form.photoUrl}
              googlePhoto={me.account.pictureUrl}
              onChange={(photoUrl) => set({ photoUrl })}
            />
            <div className="grid content-start gap-4">
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <Field label="Title">
                  <select
                    value={form.honorific}
                    onChange={(e) =>
                      set({
                        honorific: e.target.value as ListingForm["honorific"],
                      })
                    }
                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    {HONORIFICS.map((h) => (
                      <option key={h} value={h}>
                        {h || "None"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Full name *">
                  <Input
                    value={form.fullName}
                    maxLength={150}
                    onChange={(e) => set({ fullName: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Position *" hint="e.g. Tutor, Senior Tutor, Accountant">
                  <Input
                    value={form.position}
                    maxLength={150}
                    onChange={(e) => set({ position: e.target.value })}
                  />
                </Field>
                <Field label="Staff type *">
                  <select
                    value={form.staffType ?? ""}
                    onChange={(e) =>
                      set({
                        staffType: (e.target.value || null) as ListingForm["staffType"],
                      })
                    }
                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="">Choose…</option>
                    <option value="teaching">Teaching staff</option>
                    <option value="non-teaching">Non-teaching staff</option>
                  </select>
                </Field>
              </div>
              <Field label="Date you joined the college" className="sm:max-w-60">
                <Input
                  type="date"
                  value={form.joinedOn}
                  onChange={(e) => set({ joinedOn: e.target.value })}
                />
              </Field>
              {form.fullName && (
                <p className="text-xs text-muted-foreground">
                  Shown as <strong className="text-slate-800">{displayName(form)}</strong>
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section
          id="work"
          title="Where you work *"
          intro="Your department or unit. Add a leadership role there if you hold one."
        >
          <ItemList
            items={form.affiliations}
            onChange={(affiliations) => set({ affiliations })}
            newItem={() => ({ departmentId: 0, role: "" })}
            addLabel="Add department or unit"
            render={(item, setItem) => (
              <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                <select
                  value={item.departmentId || ""}
                  onChange={(e) => setItem({ departmentId: Number(e.target.value) })}
                  className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                  aria-label="Department or unit"
                >
                  <option value="">Choose a department or unit…</option>
                  {(["department", "unit"] as const).map((kind) => {
                    const options = me.units.filter((u) => u.kind === kind);
                    if (!options.length) return null;
                    return (
                      <optgroup
                        key={kind}
                        label={kind === "department" ? "Academic departments" : "Units & offices"}
                      >
                        {options.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <Input
                  placeholder="Role, e.g. Head of Department"
                  value={item.role}
                  maxLength={120}
                  onChange={(e) => setItem({ role: e.target.value })}
                />
              </div>
            )}
          />
        </Section>

        <Section
          id="contact"
          title="Contact details"
          intro="Choose what visitors to the directory can see."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email *" hint="Your work email is best.">
              <Input
                type="email"
                value={form.email}
                maxLength={150}
                onChange={(e) => set({ email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={form.phone}
                maxLength={30}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </Field>
            <Switch
              label="Show my email"
              description="Visible on your profile."
              checked={form.showEmail}
              onChange={(showEmail) => set({ showEmail })}
            />
            <Switch
              label="Show my phone number"
              description="Visible on your profile."
              checked={form.showPhone}
              onChange={(showPhone) => set({ showPhone })}
            />
          </div>
        </Section>

        <Section
          id="about"
          title="About you *"
          intro="A short professional bio, written in the third person works best."
        >
          <Field
            label="About"
            hint={`${aboutLength} characters · at least ${ABOUT_MIN_LENGTH}.`}
          >
            <RichTextEditor
              basic
              minHeight="min-h-40"
              placeholder="Your role, teaching and research focus, and experience…"
              value={form.about}
              onChange={(about) => set({ about })}
            />
          </Field>
          <ProfileLinksField details={form.details} setDetails={setDetails} />
        </Section>

        <Section id="expertise" title="Expertise">
          <ExpertiseFields details={form.details} setDetails={setDetails} />
        </Section>
        <Section id="background" title="Education & career">
          <BackgroundFields details={form.details} setDetails={setDetails} />
        </Section>
        <Section
          id="research"
          title="Research"
          intro="Optional — publications, projects and your ORCID iD."
        >
          <ResearchFields details={form.details} setDetails={setDetails} />
        </Section>
        <Section
          id="recognition"
          title="Recognition"
          intro="Optional — conferences, honours and memberships."
        >
          <RecognitionFields details={form.details} setDetails={setDetails} />
        </Section>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="min-w-0 text-sm text-muted-foreground">
            <p>
              {dirty ? (
                <span className="font-medium text-amber-700">You have unsaved changes.</span>
              ) : listing?.contentUpdatedAt ? (
                `Last saved ${new Date(listing.contentUpdatedAt).toLocaleString()}`
              ) : (
                "Not saved yet."
              )}
            </p>
            {stillNeeded.length > 0 && (
              <p className="mt-1 flex items-start gap-1.5 text-amber-800" aria-live="polite">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">
                    Still needed to {submitted ? "save" : "submit"}:
                  </strong>{" "}
                  {stillNeeded.join("; ")}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!submitted && (
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => save.mutate(false)}
              >
                <Save /> Save draft
              </Button>
            )}
            <Button
              type="submit"
              disabled={save.isPending || missing.length > 0}
              title={missing.length ? `Still needed: ${missing.join(", ")}` : undefined}
            >
              {submitted ? (
                <>
                  <Save /> Save changes
                </>
              ) : (
                <>
                  <Send /> Submit for review
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function StatusCard({ listing }: { listing: ListingView | null }) {
  const state = !listing
    ? {
        label: "Not started",
        tone: "bg-slate-100 text-slate-600",
        icon: Circle,
        text: "Fill in the form and save a draft whenever you like.",
      }
    : listing.status === "draft"
      ? {
          label: "Draft",
          tone: "bg-slate-100 text-slate-700",
          icon: Save,
          text: "Only you can see this. Submit it when it's ready for review.",
        }
      : listing.isVisible
        ? {
            label: "Live in the directory",
            tone: "bg-emerald-50 text-emerald-700",
            icon: Eye,
            text: "Changes you save appear in the directory straight away.",
          }
        : {
            label: "Awaiting review",
            tone: "bg-amber-50 text-amber-800",
            icon: Clock,
            text: "The college will review your listing before it appears.",
          };
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        Status
      </p>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
          state.tone,
        )}
      >
        <state.icon className="size-3.5" aria-hidden="true" /> {state.label}
      </span>
      {listing?.isVerified && (
        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#e2ebf5] px-2.5 py-1 text-xs font-bold text-primary">
          <BadgeCheck className="size-3.5 text-brand-crest" aria-hidden="true" /> Verified
        </span>
      )}
      {listing?.status === "submitted" && !listing.isVisible && listing.reviewedAt && (
        <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden="true" /> Not currently shown in the directory.
        </span>
      )}
      <p className="mt-2 text-sm text-slate-600">{state.text}</p>
      {listing?.adminNote && (
        <p className="mt-3 rounded-lg bg-secondary p-3 text-sm text-slate-700">
          <span className="block text-xs font-bold text-primary">Note from the college</span>
          {listing.adminNote}
        </p>
      )}
      {listing?.isVisible && listing.profileSlug && (
        <a
          href={`/directory/p/${listing.profileSlug}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-crest hover:underline"
        >
          View my profile <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-white p-5 sm:p-7">
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

function PhotoField({
  value,
  googlePhoto,
  onChange,
}: {
  value: string;
  googlePhoto: string | null;
  onChange: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const upload = async (file: File) => {
    setProgress(0);
    try {
      const asset = await uploadToLibrary(file, "people", setProgress, "/staff-portal/media");
      onChange(asset.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Photo</span>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-dashed border-slate-300 bg-secondary/50">
        {value ? (
          <img
            src={value}
            alt=""
            className="size-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <ImageUp className="size-6" aria-hidden="true" /> No photo
          </span>
        )}
        {progress !== null && (
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-slate-200">
            <span
              className="block h-full bg-brand-crest"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT.split(",")
          .filter((t) => ["image/jpeg", "image/png", "image/webp"].includes(t))
          .join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={progress !== null}
        onClick={() => input.current?.click()}
      >
        <ImageUp /> {value ? "Change photo" : "Upload photo"}
      </Button>
      {googlePhoto && !value.startsWith(googlePhoto.replace(/=s\d+(-c)?$/, "")) && (
        <button
          type="button"
          onClick={() => onChange(googlePhoto.replace(/=s\d+(-c)?$/, "=s512-c"))}
          className="text-xs font-semibold text-brand-crest hover:underline"
        >
          Use my Google photo
        </button>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" aria-hidden="true" /> Remove
        </button>
      )}
      <p className="text-[11px] text-muted-foreground">
        A clear, recent head-and-shoulders photo. JPEG, PNG or WebP, up to 5 MB.
      </p>
    </div>
  );
}
