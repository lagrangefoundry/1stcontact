---
uid: request-4fcbd354
id: REQ-151
type: request
title: Site locale identity, and rendered lang/dir
created_by: xgd
created_at: '2026-08-20T21:59:13.430458+00:00'
updated_at: '2026-08-21T20:10:13.835456+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# Site locale identity, and rendered `lang` / `dir`

## Why

The first customer cohort is international — Ireland (EUR) and the UK (GBP) alongside US
customers. `siteConfigSchema` (`packages/site-schema/src/schema.ts:872`) has **no notion of
where a business is**: it carries `businessName`, `tagline`, `contact`, `integrations` and
`distribution`, and nothing else. `contact.address` exists but is a free-text string — it
cannot drive a formatting decision and is not a substitute.

In its absence the US/English assumption is being hardcoded. `<html lang="en">` is a
literal in **two** renderers today:

- `packages/framework/src/l1/render.ts:2465`
- `tools/generate/src/render/render.ts:188`

**The `lang` half is the part with a closing window.** Published revisions are immutable R2
snapshots ([[DOC-12]] §7; `tools/generate/src/cli/commands.ts:107` — *"a revision is
immutable and there is nothing on it to edit"*). A site published before this lands carries
`lang="en"` permanently, and fixing the renderer does **not** fix published artifacts —
every live site would need republishing, which is an operational act that can sweep in
draft changes the customer has not approved. Search engines also index `lang`, so a wrong
value costs re-crawl time to recover.

Right now there are **zero published revisions** (`storage/sites/*/history.json` are both
`{"revisions": []}`), so the cost is hours. That is the reason to do it now rather than
when it becomes obviously needed.

A wrong `lang` is also a live accessibility defect independent of i18n: it is what a screen
reader uses to choose pronunciation.

## What to change

**1 — Four fields on `siteConfigSchema`:**

| field | standard | example |
|---|---|---|
| `country` | ISO 3166-1 alpha-2 | `IE` |
| `locale` | BCP 47 | `en-IE` |
| `currency` | ISO 4217 | `EUR` |
| `timezone` | IANA zone id | `Europe/Dublin` |

All four optional. `locale`, `currency` and `timezone` **derive from `country`** when
absent, each individually overridable. `country` itself defaults to `US`, so the two
existing sites validate unchanged with no migration.

They stay separate fields rather than being derived at each use because they correlate
without determining: locale decides placement and separators, currency decides symbol and
decimal count. `Intl.NumberFormat('en-IE', …EUR)` → `€49.99`; `('de-DE', …EUR)` → `49,99 €`.

**2 — A country → (locale, currency, timezone) derivation table.** Must cover at least
IE / GB / US; structured so adding a country is a data edit, not a code change. A country
with multiple plausible zones must be explicit about which default it picks.

**3 — Both renderers emit `lang` and `dir` from the page's resolved locale.** `dir` is
`rtl` for RTL scripts (ar, he, fa, ur), `ltr` otherwise.

**4 — Expose the resolved locale into the render context** so behavior modules can reach
it — the payments and calendar modules will both need it (see the money/time REQ).

**No DB migration is required.** `sites.site_json` is a verbatim TEXT blob
(`db/migrations/0001_site_store.sql`), so these fields need no change to D1.

## Acceptance criteria (provisional)

1. A site with no locale fields validates and renders exactly as today (`lang="en"`,
   `dir="ltr"`) — no regression for the two existing sites.
2. A site declaring `country: 'IE'` and nothing else resolves to `en-IE` / `EUR` /
   `Europe/Dublin`, and renders `<html lang="en-IE" dir="ltr">`.
3. An explicit `locale`, `currency` or `timezone` overrides the derived value; the others
   still derive.
4. Both render paths emit the same `lang`/`dir` for the same site — no divergence between
   `packages/framework` and `tools/generate`.
5. An RTL locale renders `dir="rtl"`.
6. An invalid country / locale / currency / timezone is a **validation error with a
   machine-readable path**, not a silent fallback.

## Test approach

UATs named `test_UAT_FC_REQ-151_*` covering AC 1–6: derivation, override, both render
paths, RTL, and the validation failures. Regression scope is the site-schema validation
suite and both renderer suites.

## Why free-coded

Small, well-bounded, and time-sensitive — the immutability of published revisions means the
cost rises the moment the first customer site goes live.

## Origin

[[CHAT-26]] · [[DOC-34]] §5 — FR-1 and FR-2 of that session's foundational review.