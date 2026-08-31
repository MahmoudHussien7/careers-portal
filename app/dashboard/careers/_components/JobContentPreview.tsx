"use client";

import {
  CAREER_SECTION_LABELS,
  parseBulletLines,
  parseRoleOverviewParagraphs,
} from "./careerContentFormat";

interface Props {
  roleOverview: string;
  keyResponsibilities: string;
  candidateProfile: string;
  whatWeOffer: string;
}

export function JobContentPreview({
  roleOverview,
  keyResponsibilities,
  candidateProfile,
  whatWeOffer,
}: Props) {
  const paragraphs = parseRoleOverviewParagraphs(roleOverview);
  const keyItems = parseBulletLines(keyResponsibilities);
  const profileItems = parseBulletLines(candidateProfile);
  const offerItems = parseBulletLines(whatWeOffer);

  const hasContent =
    paragraphs.length > 0 ||
    keyItems.length > 0 ||
    profileItems.length > 0 ||
    offerItems.length > 0;

  if (!hasContent) {
    return (
      <p className="text-xs text-muted-foreground">
        Preview will appear here as you fill in the sections below (same layout as
        the public careers page).
      </p>
    );
  }

  return (
    <div className="space-y-6 rounded-md border border-dashed border-border-color bg-muted-background/40 p-4 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Public page preview
      </p>

      {paragraphs.length > 0 && (
        <section>
          <h4 className="mb-2 text-base font-semibold text-gi-primary">
            {CAREER_SECTION_LABELS.roleOverview}
          </h4>
          <div className="space-y-2 text-[#4b5563]">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-7">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {keyItems.length > 0 && (
        <BulletBlock
          title={CAREER_SECTION_LABELS.keyResponsibilities}
          items={keyItems}
        />
      )}
      {profileItems.length > 0 && (
        <BulletBlock
          title={CAREER_SECTION_LABELS.candidateProfile}
          items={profileItems}
        />
      )}
      {offerItems.length > 0 && (
        <BulletBlock
          title={CAREER_SECTION_LABELS.whatWeOffer}
          items={offerItems}
        />
      )}
    </div>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4 className="mb-2 text-base font-semibold text-gi-primary">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-[#4b5563]">
        {items.map((item) => (
          <li key={item} className="leading-7">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
