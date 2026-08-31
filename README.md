# Careers Portal Mockup

Standalone clone of the GI CMS **Careers** system: HR directory, job postings, candidates, CVs, recruiter pool, screening form builder, and pipeline analytics.

Drop this folder into another repo (or run it here) when you need the Careers product without blogs, properties, media, or the rest of the CMS.

## What’s included

```
careers-mockup/
  app/
    login/                          # Sign-in
    dashboard/careers/              # Portal pages + all Careers UI
    dashboard/account/              # Account settings / change password
    api/proxy/                      # Same-origin proxy to the backend
  Components/                       # Atoms, organisms, and UI used by Careers
  lib/
    dal.ts                          # Auth + HR / jobs / applications / forms APIs
    careers/                        # Pipeline + screening helpers
    schemas/                        # Zod validation for Careers forms
    auth.tsx, api.ts, token.ts, hocs/
  hooks/                            # useZodForm, useViewModal, usePagination
  types/                            # careers, screeningForm, hrFormBuilder, auth
```

Routes:

| Path | View |
| --- | --- |
| `/login` | Sign in |
| `/dashboard/careers` | Overview KPIs + charts |
| `/dashboard/careers/jobs` | Job postings |
| `/dashboard/careers/candidates` | Applications pipeline |
| `/dashboard/careers/cvs` | CV inbox |
| `/dashboard/careers/users` | HR directory |
| `/dashboard/careers/profiles` | Recruiter / HR profiles |
| `/dashboard/careers/forms` | Screening form builder |

## Run locally

```bash
cd careers-mockup
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL to the same backend the CMS uses
npm install
npm run dev
```

Dev server: [http://localhost:9001](http://localhost:9001) (port 9001 so it does not clash with the main CMS on 9000).

This mockup talks to the **same HR backend** through `/api/proxy`. It is a frontend extract, not a mocked-data demo.

## Reuse in another project

1. Copy the `careers-mockup` folder.
2. Keep the `@/*` path alias in `tsconfig.json`.
3. Point `NEXT_PUBLIC_API_BASE_URL` at your API.
4. If the host app already has auth/layout/UI, keep `app/dashboard/careers`, `lib/careers`, `lib/schemas/careers.ts`, and `types/careers.ts` / `types/screeningForm.ts` / `types/hrFormBuilder.ts`, then rewire imports.

## Not copied (on purpose)

Properties, blogs, communities, agents, off-plan, media, developers, client errors, Quill editor, Redux, and React Query. The DAL here only exposes auth + Careers endpoints.
