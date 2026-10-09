import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Eye, FileSearch, Trash2 } from "lucide-react";
import { api } from "#/lib/api-client";
import { canManage } from "#/lib/permissions";
import { initials } from "#/lib/format";
import { cn } from "#/lib/utils";
import { displayName } from "#/lib/staff-listing";
import type { ListingView } from "#/lib/staff-listing";
import {
  AdminPageHeader,
  ConfirmDialog,
  Field,
  SearchInput,
  Segmented,
  Switch,
  TableMessage,
  errorToast,
} from "#/components/admin/ui";
import { Button } from "#/components/ui/button.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { RichContent } from "#/components/site/rich-content";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";

export const Route = createFileRoute("/admin/_admin/directory-listings")({
  component: DirectoryListingsPage,
});

interface AdminListing extends ListingView {
  accountEmail: string;
  accountName: string | null;
  accountPicture: string | null;
  createdAt: string;
  unitNames: Array<string>;
}

interface ProfileOption {
  slug: string;
  name: string | null;
  units: string | null;
}

type Filter = "review" | "live" | "changed" | "drafts" | "all";

const FILTERS: Record<Filter, { label: string; match: (l: AdminListing) => boolean }> = {
  review: {
    label: "Awaiting review",
    match: (l) => l.status === "submitted" && !l.isVisible && !l.reviewedAt,
  },
  live: { label: "In the directory", match: (l) => l.isVisible },
  changed: {
    label: "Edited since review",
    match: (l) => l.changedSinceReview && !!l.reviewedAt,
  },
  drafts: { label: "Drafts", match: (l) => l.status === "draft" },
  all: { label: "All", match: () => true },
};

const nameOf = (l: AdminListing) =>
  l.form.fullName ? displayName(l.form) : (l.accountName ?? l.accountEmail);

function DirectoryListingsPage() {
  const { admin } = Route.useRouteContext();
  const canEdit = canManage(admin.role, "directory");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("review");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-listings"],
    queryFn: () =>
      api.get<{ listings: Array<AdminListing> }>("/staff-listings").then((r) => r.listings),
  });
  const listings = data ?? [];

  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: number; isVisible?: boolean; isVerified?: boolean }) =>
      api.patch<{ listing: AdminListing }>(`/staff-listings/${id}`, patch),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["staff-listings"] }),
    onError: errorToast("Couldn't update the listing."),
  });

  const query = q.trim().toLowerCase();
  const visible = listings.filter(
    (l) =>
      FILTERS[filter].match(l) &&
      (!query ||
        [nameOf(l), l.accountEmail, l.form.position, l.unitNames.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Directory listings"
        description="Profiles staff create themselves at /directory/my-listing, signed in with Google. Choose which appear in the staff directory and mark the ones you've checked as verified."
        actions={
          <Button variant="outline" asChild>
            <a href="/directory/my-listing" target="_blank" rel="noreferrer">
              <ExternalLink /> Staff listing page
            </a>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={(Object.keys(FILTERS) as Array<Filter>).map((value) => ({
            value,
            label: FILTERS[value].label,
            count: listings.filter(FILTERS[value].match).length,
          }))}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search listings…" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {isLoading ? (
          <TableMessage>Loading…</TableMessage>
        ) : visible.length === 0 ? (
          <TableMessage>No listings here.</TableMessage>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Staff member</th>
                <th className="hidden px-4 py-3 md:table-cell">Units</th>
                <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                <th className="px-4 py-3 text-center">Visible</th>
                <th className="px-4 py-3 text-center">Verified</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((l) => (
                <tr key={l.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {l.form.photoUrl ? (
                        <img
                          src={l.form.photoUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="size-10 shrink-0 rounded-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                          {initials(nameOf(l))}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{nameOf(l)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[l.form.position, l.accountEmail].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden max-w-56 truncate px-4 py-2.5 text-muted-foreground md:table-cell">
                    {l.unitNames.join(", ") || "—"}
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">
                    <ListingStatus listing={l} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <MiniSwitch
                      checked={l.isVisible}
                      disabled={!canEdit || l.status !== "submitted" || update.isPending}
                      label={`Show ${nameOf(l)} in the directory`}
                      onChange={(isVisible) => update.mutate({ id: l.id, isVisible })}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <MiniSwitch
                      checked={l.isVerified}
                      disabled={!canEdit || l.status !== "submitted" || update.isPending}
                      label={`Mark ${nameOf(l)} as verified`}
                      onChange={(isVerified) => update.mutate({ id: l.id, isVerified })}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {l.isVisible && l.profileSlug && (
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a
                          href={`/directory/p/${l.profileSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open public profile"
                        >
                          <ExternalLink />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setOpen(l.id)}>
                      <FileSearch /> Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ReviewDialog
        listing={listings.find((l) => l.id === open) ?? null}
        canEdit={canEdit}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

function ListingStatus({ listing: l }: { listing: AdminListing }) {
  const [label, tone] =
    l.status === "draft"
      ? ["Draft", "bg-slate-100 text-slate-600"]
      : l.isVisible
        ? ["In the directory", "bg-emerald-50 text-emerald-700"]
        : l.reviewedAt
          ? ["Hidden", "bg-slate-100 text-slate-700"]
          : ["Awaiting review", "bg-amber-50 text-amber-800"];
  return (
    <span className="flex flex-col items-start gap-1">
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>
        {label}
      </span>
      {l.changedSinceReview && l.reviewedAt && (
        <span className="text-[11px] font-medium text-amber-700">Edited since review</span>
      )}
    </span>
  );
}

function MiniSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={disabled ? "Available once the listing is submitted" : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-primary" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function ReviewDialog({
  listing,
  canEdit,
  onClose,
}: {
  listing: AdminListing | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [visible, setVisible] = useState(false);
  const [verified, setVerified] = useState(false);
  const [slug, setSlug] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listingId = listing?.id ?? null;

  useEffect(() => {
    if (!listing) return;
    setNote(listing.adminNote ?? "");
    setVisible(listing.isVisible);
    setVerified(listing.isVerified);
    setSlug(listing.profileSlug ?? "");
    // Reset only when a different listing is opened.
  }, [listingId]);

  const { data: profiles } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: () =>
      api.get<{ profiles: Array<ProfileOption> }>("/staff-profiles").then((r) => r.profiles),
    enabled: listing !== null,
  });

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/staff-listings/${listing!.id}`, {
        isVisible: visible,
        isVerified: verified,
        adminNote: note,
        profileSlug: slug === (listing!.profileSlug ?? "") ? undefined : slug,
      }),
    onSuccess: () => {
      toast.success("Listing updated.");
      void queryClient.invalidateQueries({ queryKey: ["staff-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      onClose();
    },
    onError: errorToast("Couldn't update the listing."),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/staff-listings/${listing!.id}`),
    onSuccess: () => {
      toast.success("Listing deleted.");
      void queryClient.invalidateQueries({ queryKey: ["staff-listings"] });
      setConfirmDelete(false);
      onClose();
    },
    onError: errorToast("Couldn't delete the listing."),
  });

  const f = listing?.form;
  const d = f?.details;
  const submitted = listing?.status === "submitted";

  return (
    <>
      <Dialog open={listing !== null} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{listing ? nameOf(listing) : "Listing"}</DialogTitle>
          </DialogHeader>
          {listing && f && d && (
            <div className="grid gap-5 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ListingStatus listing={listing} />
                <span>Signed in as {listing.accountEmail}</span>
                {listing.submittedAt && (
                  <span>· submitted {new Date(listing.submittedAt).toLocaleDateString()}</span>
                )}
                {listing.contentUpdatedAt && (
                  <span>· last edited {new Date(listing.contentUpdatedAt).toLocaleString()}</span>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                {f.photoUrl ? (
                  <img
                    src={f.photoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="aspect-[4/5] w-full rounded-lg object-cover object-top"
                  />
                ) : (
                  <span className="flex aspect-[4/5] items-center justify-center rounded-lg bg-secondary text-2xl font-bold text-primary">
                    {initials(nameOf(listing))}
                  </span>
                )}
                <dl className="grid content-start gap-x-6 gap-y-2 sm:grid-cols-2">
                  <Item label="Name">{displayName(f) || "—"}</Item>
                  <Item label="Position">{f.position || "—"}</Item>
                  <Item label="Staff type">
                    {f.staffType ? (f.staffType === "teaching" ? "Teaching" : "Non-teaching") : "—"}
                  </Item>
                  <Item label="Joined">{f.joinedOn || "—"}</Item>
                  <Item label="Email">
                    {f.email || "—"}{" "}
                    {f.email && (
                      <span className="text-xs text-muted-foreground">
                        ({f.showEmail ? "shown" : "hidden"})
                      </span>
                    )}
                  </Item>
                  <Item label="Phone">
                    {f.phone || "—"}{" "}
                    {f.phone && (
                      <span className="text-xs text-muted-foreground">
                        ({f.showPhone ? "shown" : "hidden"})
                      </span>
                    )}
                  </Item>
                  <Item label="Works in" wide>
                    {listing.unitNames.length
                      ? f.affiliations.map((a, i) => (
                          <span key={a.departmentId} className="block">
                            {listing.unitNames[i]}
                            {a.role && <span className="text-muted-foreground"> · {a.role}</span>}
                          </span>
                        ))
                      : "—"}
                  </Item>
                </dl>
              </div>

              {f.about && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    About
                  </p>
                  {/* Sanitised by the server (server/staff-listings.ts). */}
                  <RichContent html={f.about} className="prose-sm text-slate-700" />
                </div>
              )}

              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Chips label="Specialisations" items={d.specializations} />
                <Chips label="Academic interests" items={d.academicInterests} />
                <ListBlock
                  label="Education"
                  items={d.education.map((e) =>
                    [e.degree, e.field, e.institution, e.year].filter(Boolean).join(", "),
                  )}
                />
                <ListBlock
                  label="Career"
                  items={d.careerPositions.map(
                    (c) =>
                      `${c.position}${c.organization ? `, ${c.organization}` : ""} (${c.startYear || "?"}–${c.endYear || "present"})`,
                  )}
                />
                <ListBlock
                  label="Publications"
                  items={d.publications.map((p) => `${p.title}${p.year ? ` (${p.year})` : ""}`)}
                />
                <ListBlock label="Projects" items={d.projects.map((p) => p.title)} />
                <ListBlock
                  label="Conferences"
                  items={d.conferences.map((c) => `${c.name}${c.year ? ` (${c.year})` : ""}`)}
                />
                <ListBlock
                  label="Honours"
                  items={d.honors.map((h) => [h.title, h.description].filter(Boolean).join(" — "))}
                />
                <ListBlock
                  label="Profile links"
                  items={d.externalLinks.map((l) => `${l.label}: ${l.url}`)}
                />
              </div>

              <fieldset
                disabled={!canEdit}
                className="grid gap-4 rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Switch
                    label="Show in the directory"
                    description={
                      submitted
                        ? "Publishes this profile at /directory."
                        : "Available once the staff member submits it."
                    }
                    checked={visible}
                    disabled={!submitted}
                    onChange={setVisible}
                  />
                  <Switch
                    label="Verified"
                    description="Shows a “Verified” badge on the profile."
                    checked={verified}
                    disabled={!submitted}
                    onChange={setVerified}
                  />
                </div>
                <Field
                  label="Directory profile"
                  hint="If this person is already in the directory (e.g. from People), link the listing to that profile instead of creating a second one."
                >
                  <select
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="">Its own profile (created automatically)</option>
                    {listing.profileSlug && (
                      <option value={listing.profileSlug}>
                        Current: /directory/p/{listing.profileSlug}
                      </option>
                    )}
                    {(profiles ?? [])
                      .filter((p) => p.slug !== listing.profileSlug && p.name)
                      .map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} {p.units ? `— ${p.units}` : ""}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field
                  label="Note to the staff member"
                  hint="Shown on their listing page, e.g. what to add before it can be published."
                >
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
              </fieldset>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            {canEdit ? (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> Delete listing
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {canEdit ? "Cancel" : "Close"}
              </Button>
              {canEdit && (
                <Button disabled={save.isPending} onClick={() => save.mutate()}>
                  {verified ? <BadgeCheck /> : <Eye />} {save.isPending ? "Saving…" : "Save review"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this listing?"
        description="It is removed from the directory and the staff member's saved form is deleted. They can sign in and start a new one."
        confirmLabel="Delete listing"
        onConfirm={() => remove.mutate()}
        pending={remove.isPending}
      />
    </>
  );
}

function Item({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="text-xs font-semibold text-muted-foreground uppercase">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: Array<string> }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((t) => (
          <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: Array<string> }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
        {label} <span className="font-normal">({items.length})</span>
      </p>
      <ul className="list-disc space-y-0.5 pl-4 text-slate-700">
        {items.slice(0, 6).map((t, i) => (
          <li key={i} className="break-words">
            {t}
          </li>
        ))}
        {items.length > 6 && (
          <li className="list-none text-xs text-muted-foreground">and {items.length - 6} more</li>
        )}
      </ul>
    </div>
  );
}
