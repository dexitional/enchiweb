import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, ExternalLink, Pencil, Share2 } from "lucide-react";
import type { StaffProfileRow, StaffStatus, StaffType } from "@enchi/db";
import { api } from "#/lib/api-client";
import { STAFF_STATUSES } from "#/lib/directory";
import type { ProfileDetails } from "#/lib/directory";
import { canManage } from "#/lib/permissions";
import { initials } from "#/lib/format";
import { cn } from "#/lib/utils";
import {
  AdminPageHeader,
  Field,
  SearchInput,
  Segmented,
  Switch,
  TableMessage,
  errorToast,
} from "#/components/admin/ui";
import { ImageField } from "#/components/admin/media-fields";
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
import { toHtml } from "#/lib/rich-text-format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";

export const Route = createFileRoute("/admin/_admin/directory")({
  component: DirectoryAdminPage,
});

interface ProfileListRow {
  id: number;
  slug: string;
  name: string | null;
  title: string | null;
  units: string | null;
  photo_url: string | null;
  staff_type: StaffType | null;
  staff_status: StaffStatus;
  is_new_face: 0 | 1;
  is_appointed_head: 0 | 1;
  has_profile: 0 | 1;
  profile_views: number;
  shares: number;
}

interface Affiliation {
  id: number;
  name: string;
  title: string;
  group_key: string;
  unit_role: string | null;
  department_name: string | null;
}

type ProfileDetail = Omit<StaffProfileRow, "details"> & {
  details: ProfileDetails;
  affiliations: Array<Affiliation>;
};

type Filter = "all" | "teaching" | "non-teaching" | "untyped" | "inactive";

const STATUS_LABELS = Object.fromEntries(STAFF_STATUSES.map((s) => [s.value, s.label])) as Record<
  StaffStatus,
  string
>;

function DirectoryAdminPage() {
  const { admin } = Route.useRouteContext();
  const canEdit = canManage(admin.role, "directory");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: () =>
      api.get<{ profiles: Array<ProfileListRow> }>("/staff-profiles").then((r) => r.profiles),
  });
  const profiles = data ?? [];
  const query = q.trim().toLowerCase();
  const matches: Record<Filter, (p: ProfileListRow) => boolean> = {
    all: () => true,
    teaching: (p) => p.staff_type === "teaching",
    "non-teaching": (p) => p.staff_type === "non-teaching",
    untyped: (p) => p.staff_type === null,
    inactive: (p) => p.staff_status !== "active",
  };
  const visible = profiles.filter(
    (p) =>
      matches[filter](p) &&
      (!query || [p.name, p.title, p.units, p.slug].join(" ").toLowerCase().includes(query)),
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Staff Directory"
        description="Directory profiles for every member of staff. Names, positions and units come from People; here you set staff type, status and the academic profile."
        actions={
          <Button variant="outline" asChild>
            <a href="/directory" target="_blank" rel="noreferrer">
              <ExternalLink /> View directory
            </a>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={(["all", "teaching", "non-teaching", "untyped", "inactive"] as const).map(
            (value) => ({
              value,
              label: {
                all: "All",
                teaching: "Teaching",
                "non-teaching": "Non-teaching",
                untyped: "Type not set",
                inactive: "Not active",
              }[value],
              count: profiles.filter(matches[value]).length,
            }),
          )}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search staff…" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {isLoading ? (
          <TableMessage>Loading…</TableMessage>
        ) : visible.length === 0 ? (
          <TableMessage>No profiles match.</TableMessage>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Staff member</th>
                <th className="hidden px-4 py-3 md:table-cell">Units</th>
                <th className="hidden px-4 py-3 lg:table-cell">Type</th>
                <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-right lg:table-cell">Views</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {p.photo_url ? (
                        <img
                          src={p.photo_url}
                          alt=""
                          className="size-10 shrink-0 rounded-full object-cover object-top"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                          {initials(p.name ?? p.slug)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name ?? p.slug}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.title}</p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {p.is_new_face === 1 && <Badge>New face</Badge>}
                          {p.is_appointed_head === 1 && <Badge>Appointed head</Badge>}
                          {p.has_profile === 1 && <Badge tone="green">Academic profile</Badge>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden max-w-60 truncate px-4 py-2.5 text-muted-foreground md:table-cell">
                    {p.units ?? "—"}
                  </td>
                  <td className="hidden px-4 py-2.5 capitalize lg:table-cell">
                    {p.staff_type ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        p.staff_status === "active" ? "text-emerald-700" : "text-amber-700",
                      )}
                    >
                      {STATUS_LABELS[p.staff_status]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-right text-muted-foreground tabular-nums lg:table-cell">
                    <span className="inline-flex items-center gap-1" title={`${p.shares} shares`}>
                      <Eye className="size-3.5" aria-hidden="true" /> {p.profile_views}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a
                        href={`/directory/p/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open public profile"
                      >
                        <ExternalLink />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditing(p.slug)}
                      aria-label={canEdit ? "Edit profile" : "View profile"}
                    >
                      <Pencil />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ProfileDialog
        slug={editing}
        canEdit={canEdit}
        onClose={() => setEditing(null)}
        onSaved={() => void queryClient.invalidateQueries({ queryKey: ["staff-profiles"] })}
      />
    </div>
  );
}

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        tone === "blue" ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-700",
      )}
    >
      {children}
    </span>
  );
}

interface FormState {
  staffType: StaffType | null;
  staffStatus: StaffStatus;
  photoUrl: string;
  about: string;
  isNewFace: boolean;
  joinedOn: string;
  isAppointedHead: boolean;
  appointedOn: string;
  details: ProfileDetails;
}

function toForm(p: ProfileDetail): FormState {
  return {
    staffType: p.staff_type,
    staffStatus: p.staff_status,
    photoUrl: p.photo_url ?? "",
    about: toHtml(p.about),
    isNewFace: p.is_new_face === 1,
    joinedOn: p.joined_on?.slice(0, 10) ?? "",
    isAppointedHead: p.is_appointed_head === 1,
    appointedOn: p.appointed_on?.slice(0, 10) ?? "",
    details: p.details,
  };
}

type Tab = "basics" | "expertise" | "background" | "research" | "recognition";

function ProfileDialog({
  slug,
  canEdit,
  onClose,
  onSaved,
}: {
  slug: string | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<Tab>("basics");
  const [form, setForm] = useState<FormState | null>(null);
  const { data: profile } = useQuery({
    queryKey: ["staff-profile", slug],
    queryFn: () =>
      api.get<{ profile: ProfileDetail }>(`/staff-profiles/${slug}`).then((r) => r.profile),
    enabled: slug !== null,
  });

  useEffect(() => {
    if (slug === null) {
      setForm(null);
      setTab("basics");
    } else if (profile && profile.slug === slug) {
      setForm(toForm(profile));
    }
  }, [slug, profile]);

  const save = useMutation({
    mutationFn: (f: FormState) => api.patch(`/staff-profiles/${slug}`, f),
    onSuccess: () => {
      toast.success("Profile saved.");
      onSaved();
      onClose();
    },
    onError: errorToast("Couldn't save the profile."),
  });

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setDetails = (patch: Partial<ProfileDetails>) =>
    setForm((f) => (f ? { ...f, details: { ...f.details, ...patch } } : f));
  const primary = profile?.affiliations[0];
  const d = form?.details;

  return (
    <Dialog open={slug !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{primary?.name ?? "Directory profile"}</DialogTitle>
        </DialogHeader>
        {!form || !d || !profile ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <fieldset disabled={!canEdit} className="grid min-w-0 gap-5">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "basics", label: "Basics" },
                { value: "expertise", label: "Expertise" },
                { value: "background", label: "Background" },
                { value: "research", label: "Research" },
                { value: "recognition", label: "Recognition" },
              ]}
            />

            {tab === "basics" && (
              <>
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">
                    Listed as
                  </p>
                  <ul className="grid gap-1">
                    {profile.affiliations.map((a) => (
                      <li key={a.id}>
                        <span className="font-medium">{a.title}</span>
                        {a.unit_role && (
                          <span className="text-muted-foreground"> · {a.unit_role}</span>
                        )}
                        {a.department_name && (
                          <span className="text-muted-foreground"> · {a.department_name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Change names, positions and units in{" "}
                    <Link to="/admin/people" className="font-medium text-primary hover:underline">
                      People
                    </Link>
                    . <Share2 className="inline size-3" aria-hidden="true" /> {profile.shares}{" "}
                    shares · <Eye className="inline size-3" aria-hidden="true" />{" "}
                    {profile.profile_views} views
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                  <ImageField
                    label="Directory photo"
                    aspect="portrait"
                    folder="people"
                    value={form.photoUrl}
                    onChange={(url) => set({ photoUrl: url ?? "" })}
                  />
                  <div className="grid content-start gap-4">
                    <p className="text-xs text-muted-foreground">
                      Leave the photo empty to use the one from People.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Staff type">
                        <select
                          value={form.staffType ?? ""}
                          onChange={(e) =>
                            set({ staffType: (e.target.value || null) as StaffType | null })
                          }
                          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                        >
                          <option value="">Not set</option>
                          <option value="teaching">Teaching</option>
                          <option value="non-teaching">Non-teaching</option>
                        </select>
                      </Field>
                      <Field
                        label="Status"
                        hint={
                          form.staffStatus === "exited"
                            ? "Exited staff are hidden from the directory."
                            : undefined
                        }
                      >
                        <select
                          value={form.staffStatus}
                          onChange={(e) => set({ staffStatus: e.target.value as StaffStatus })}
                          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                        >
                          {STAFF_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Switch
                          label="New face"
                          description="Featured under “New faces”."
                          checked={form.isNewFace}
                          onChange={(isNewFace) => set({ isNewFace })}
                        />
                        {form.isNewFace && (
                          <Input
                            type="date"
                            value={form.joinedOn}
                            onChange={(e) => set({ joinedOn: e.target.value })}
                            aria-label="Joined on"
                          />
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Switch
                          label="Appointed head"
                          description="Listed under “Recently appointed”."
                          checked={form.isAppointedHead}
                          onChange={(isAppointedHead) => set({ isAppointedHead })}
                        />
                        {form.isAppointedHead && (
                          <Input
                            type="date"
                            value={form.appointedOn}
                            onChange={(e) => set({ appointedOn: e.target.value })}
                            aria-label="Appointed on"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Field label="About" hint="Leave empty to use the profile text from People.">
                  <RichTextEditor
                    basic
                    minHeight="min-h-36"
                    value={form.about}
                    onChange={(about) => set({ about })}
                  />
                </Field>
                <ProfileLinksField details={d} setDetails={setDetails} />
              </>
            )}

            {tab === "expertise" && (
              <>
                <ExpertiseFields details={d} setDetails={setDetails} />
              </>
            )}

            {tab === "background" && (
              <>
                <BackgroundFields details={d} setDetails={setDetails} />
              </>
            )}

            {tab === "research" && (
              <>
                <ResearchFields details={d} setDetails={setDetails} />
              </>
            )}

            {tab === "recognition" && (
              <>
                <RecognitionFields details={d} setDetails={setDetails} />
              </>
            )}
          </fieldset>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit && (
            <Button disabled={!form || save.isPending} onClick={() => form && save.mutate(form)}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
