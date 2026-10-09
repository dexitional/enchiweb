// The academic-profile part of a staff directory entry (profileDetailsSchema),
// shared by the admin Staff Directory editor and the staff self-service
// listing form, so both edit exactly the same fields.
import { useState } from "react";
import { CONFERENCE_ROLES, PUBLICATION_TYPES } from "#/lib/directory";
import type { ProfileDetails } from "#/lib/directory";
import { Field } from "#/components/admin/ui";
import { ItemList } from "#/components/admin/block-editor";
import { Input } from "#/components/ui/input.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { RichTextEditor } from "#/components/admin/rich-text-editor";
import { toHtml } from "#/lib/rich-text-format";

export interface DetailsProps {
  details: ProfileDetails;
  setDetails: (patch: Partial<ProfileDetails>) => void;
}

export function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

// One label per line. Keeps the raw text while typing (so blank lines and
// trailing spaces survive) and reports the cleaned list.
export function LinesField({
  value,
  onChange,
  rows,
  max,
}: {
  value: Array<string>;
  onChange: (value: Array<string>) => void;
  rows: number;
  max: number;
}) {
  const [text, setText] = useState(() => value.join("\n"));
  return (
    <Textarea
      rows={rows}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean)
            .slice(0, max),
        );
      }}
    />
  );
}

export function ProfileLinksField({ details: d, setDetails }: DetailsProps) {
  return (
    <Field label="Profile links" hint="Google Scholar, ResearchGate, LinkedIn…">
      <ItemList
        items={d.externalLinks}
        onChange={(externalLinks) => setDetails({ externalLinks })}
        newItem={() => ({ label: "", url: "" })}
        addLabel="Add link"
        render={(item, setItem) => (
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
            <Input
              placeholder="Label"
              value={item.label}
              onChange={(e) => setItem({ label: e.target.value })}
            />
            <Input
              placeholder="https://…"
              value={item.url}
              onChange={(e) => setItem({ url: e.target.value })}
            />
          </div>
        )}
      />
    </Field>
  );
}

export function ExpertiseFields({ details: d, setDetails }: DetailsProps) {
  return (
    <>
      <Field
        label="Specialisations"
        hint="One per line. Shown as chips and used to find colleagues with the same skills."
      >
        <LinesField
          rows={4}
          max={20}
          value={d.specializations}
          onChange={(specializations) => setDetails({ specializations })}
        />
      </Field>
      <Field
        label="Academic interests"
        hint="One per line. Powers “Explore by expertise” and shared-interest colleagues."
      >
        <LinesField
          rows={4}
          max={20}
          value={d.academicInterests}
          onChange={(academicInterests) => setDetails({ academicInterests })}
        />
      </Field>
      <Field
        label="Spotlight tags"
        hint="Up to three, one per line — shown if they're picked for “Meet a researcher”."
      >
        <LinesField
          rows={3}
          max={3}
          value={d.spotlightTags}
          onChange={(spotlightTags) => setDetails({ spotlightTags })}
        />
      </Field>
      <Field label="Teaching philosophy" hint="Optional. Shown as a quote on the profile.">
        <RichTextEditor
          basic
          minHeight="min-h-24"
          placeholder="What guides your teaching…"
          value={toHtml(d.teachingPhilosophy)}
          onChange={(teachingPhilosophy) => setDetails({ teachingPhilosophy })}
        />
      </Field>
    </>
  );
}

export function BackgroundFields({ details: d, setDetails }: DetailsProps) {
  return (
    <>
      <Field label="Education">
        <ItemList
          items={d.education}
          onChange={(education) => setDetails({ education })}
          newItem={() => ({ degree: "", field: "", institution: "", year: "" })}
          addLabel="Add qualification"
          render={(item, setItem) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Degree, e.g. MPhil"
                value={item.degree}
                onChange={(e) => setItem({ degree: e.target.value })}
              />
              <Input
                placeholder="Field of study"
                value={item.field}
                onChange={(e) => setItem({ field: e.target.value })}
              />
              <Input
                placeholder="Institution"
                value={item.institution}
                onChange={(e) => setItem({ institution: e.target.value })}
              />
              <Input
                placeholder="Year"
                value={item.year}
                onChange={(e) => setItem({ year: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
      <Field label="Career" hint="Leave the end year empty for the current role.">
        <ItemList
          items={d.careerPositions}
          onChange={(careerPositions) => setDetails({ careerPositions })}
          newItem={() => ({
            position: "",
            organization: "",
            startYear: "",
            endYear: "",
          })}
          addLabel="Add position"
          render={(item, setItem) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_90px]">
              <Input
                placeholder="Position"
                value={item.position}
                onChange={(e) => setItem({ position: e.target.value })}
              />
              <Input
                placeholder="Organisation"
                value={item.organization}
                onChange={(e) => setItem({ organization: e.target.value })}
              />
              <Input
                placeholder="From"
                value={item.startYear}
                onChange={(e) => setItem({ startYear: e.target.value })}
              />
              <Input
                placeholder="To"
                value={item.endYear}
                onChange={(e) => setItem({ endYear: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
    </>
  );
}

export function ResearchFields({ details: d, setDetails }: DetailsProps) {
  return (
    <>
      <Field label="ORCID iD">
        <Input
          placeholder="0000-0000-0000-0000"
          value={d.orcid}
          onChange={(e) => setDetails({ orcid: e.target.value })}
        />
      </Field>
      <Field
        label="Publications"
        hint="Authors comma-separated; this person's name is bolded on the site."
      >
        <ItemList
          items={d.publications}
          onChange={(publications) => setDetails({ publications })}
          newItem={() => ({
            title: "",
            year: null,
            url: "",
            authors: "",
            venue: "",
            type: "Article",
            citations: null,
          })}
          addLabel="Add publication"
          render={(item, setItem) => (
            <div className="grid gap-2">
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) => setItem({ title: e.target.value })}
              />
              <Input
                placeholder="Authors"
                value={item.authors}
                onChange={(e) => setItem({ authors: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_90px_90px]">
                <Input
                  placeholder="Journal / venue"
                  value={item.venue}
                  onChange={(e) => setItem({ venue: e.target.value })}
                />
                <select
                  value={item.type}
                  onChange={(e) => setItem({ type: e.target.value })}
                  className="h-9 rounded-md border border-input bg-white px-2 text-sm"
                >
                  {PUBLICATION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <Input
                  placeholder="Year"
                  inputMode="numeric"
                  value={item.year ?? ""}
                  onChange={(e) => setItem({ year: toInt(e.target.value) })}
                />
                <Input
                  placeholder="Citations"
                  inputMode="numeric"
                  value={item.citations ?? ""}
                  onChange={(e) => setItem({ citations: toInt(e.target.value) })}
                />
              </div>
              <Input
                placeholder="Link (https://…)"
                value={item.url}
                onChange={(e) => setItem({ url: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
      <Field label="Projects">
        <ItemList
          items={d.projects}
          onChange={(projects) => setDetails({ projects })}
          newItem={() => ({
            title: "",
            role: "",
            startDate: "",
            endDate: "",
            url: "",
          })}
          addLabel="Add project"
          render={(item, setItem) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                className="sm:col-span-2"
                placeholder="Project title"
                value={item.title}
                onChange={(e) => setItem({ title: e.target.value })}
              />
              <Input
                placeholder="Role"
                value={item.role}
                onChange={(e) => setItem({ role: e.target.value })}
              />
              <Input
                placeholder="Link (https://…)"
                value={item.url}
                onChange={(e) => setItem({ url: e.target.value })}
              />
              <Input
                type="month"
                aria-label="Start"
                value={item.startDate}
                onChange={(e) => setItem({ startDate: e.target.value })}
              />
              <Input
                type="month"
                aria-label="End"
                value={item.endDate}
                onChange={(e) => setItem({ endDate: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
    </>
  );
}

export function RecognitionFields({ details: d, setDetails }: DetailsProps) {
  return (
    <>
      <Field label="Conferences & engagements">
        <ItemList
          items={d.conferences}
          onChange={(conferences) => setDetails({ conferences })}
          newItem={() => ({
            name: "",
            role: "Participant",
            location: "",
            year: null,
            url: "",
          })}
          addLabel="Add conference"
          render={(item, setItem) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
              <Input
                placeholder="Conference"
                value={item.name}
                onChange={(e) => setItem({ name: e.target.value })}
              />
              <select
                value={item.role}
                onChange={(e) => setItem({ role: e.target.value })}
                className="h-9 rounded-md border border-input bg-white px-2 text-sm"
              >
                {CONFERENCE_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <Input
                placeholder="Location"
                value={item.location}
                onChange={(e) => setItem({ location: e.target.value })}
              />
              <Input
                placeholder="Year"
                inputMode="numeric"
                value={item.year ?? ""}
                onChange={(e) => setItem({ year: toInt(e.target.value) })}
              />
              <Input
                className="sm:col-span-2"
                placeholder="Link (https://…)"
                value={item.url}
                onChange={(e) => setItem({ url: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
      <Field
        label="Honours & affiliations"
        hint="e.g. “Fellow” · “Ghana Mathematics Society, 2021”."
      >
        <ItemList
          items={d.honors}
          onChange={(honors) => setDetails({ honors })}
          newItem={() => ({ title: "", description: "" })}
          addLabel="Add honour"
          render={(item, setItem) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) => setItem({ title: e.target.value })}
              />
              <Input
                placeholder="Organisation, year"
                value={item.description}
                onChange={(e) => setItem({ description: e.target.value })}
              />
            </div>
          )}
        />
      </Field>
    </>
  );
}
