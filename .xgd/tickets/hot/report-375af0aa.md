---
uid: report-375af0aa
id: REPORT-2076
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=story)'
created_by: xgd
created_at: '2026-08-16T05:55:59.087394+00:00'
updated_at: '2026-08-16T05:55:59.087394+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: story
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Bundle members are
listed individually, since the stories carry the bundle UID as `intent_uid` but
align to specific members.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-102 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8` 2026-08-06 | `1c new` seeds a minimal valid L1 document — ladder, background, flowed root, one placeholder run; renders/shots unedited; `1c repro` overwrites wholesale; no flag, no mode detection | YES |
| REQ-101 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8` 2026-08-06 | `fonts/registry.yaml` provenance index; three-state `redistribute_in_product`; `distribution` marker on site config; `1c fonts check` with four violation kinds + on-disk scan; actions warn, redistribution blocks; missing/malformed registry is a hard error | YES |
| REQ-114 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | merged `cd8f98c8` 2026-08-06 | Palette colour model (model half → STORY-80, other capability); census command; retrofit of `storage/sites/*` with byte-identical conversion (AC3); §4 retired `paletteTokensSchema`, `layerColorRoleSchema` and the `theme.palette` key outright | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | merged `b2b9208c` 2026-08-07 | `listSiteAssets` — the union of registry + `draft/assets/`, merged by handle, with `onDisk`/`registered` provenance, one handle vocabulary, a derived `kind`, reachable from CLI and `/api/assets` | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | Background-image picker over the *same* listing; explicitly "reuses that ticket's asset listing", no new source | YES (no delta here) |
| REQ-132 (`request-5946d045`) | free_and_reconciled | merged `6cb3942f` 2026-08-12 | Image picker becomes a local thumbnail grid with file-name labels; `format?: 'image'` hint on the descriptor. Wrapped **locally** in `apps/control-app/src/builder/image-picker.js` because the upstream enum control has no seam | YES |
| REQ-137 (`request-d2980a95`, bundle-d9226698) | bundled | 2026-08-12/13 | Deletes palette entry `steps`, adds continuous `shade` on the reference; `1c colors --assign` emits entries + shades and never a step; **supersedes REQ-114 AC3's byte-identity** with a bounded ≤8/255 guarantee; re-retrofits `xgd` + `gigabytealchemy` | imminent |
| REQ-133 (`request-8467b1a3`) | ready_to_reconcile | 2026-08-12 | Palette popup — display/pick/edit the site's colours (editor capability) | imminent (other capability) |
| REQ-140 (`request-3c0fec69`) | ready_to_reconcile | 2026-08-15 | Page-editor colour from the palette (editor capability) | imminent (other capability) |
| REQ-142 / REQ-143 / REQ-145 | free_coded / draft | 2026-08-15 | Async `SiteStore` port then a D1/R2 adapter. REQ-142 states "no behaviour change at all" | NO (not yet; see notes) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Image generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 (`story-86c7c21b`) — authoring start point | REQ-102 (origin), REQ-114 (`updated_by`) | **drift**: Description correctly restates colour provenance post-REQ-114, but the final Technical Context bullet still calls the scaffold's colours "theme-sourced". Self-contradictory. Coverage of REQ-102's four acceptance items is complete. |
| STORY-92 (`story-8685be2d`) — font provenance & licence | REQ-101 | aligned. All of REQ-101's registry contract, four violation kinds, warn-vs-block split, distribution marker, hard-error-on-missing-registry and the deliberate no-acquisition-verb omission are expressed. `1c fonts check [--json]` confirmed wired (`tools/generate/src/cli/index.ts:312`), so the story's "machine-readable form" is grounded. No later intent touches the registry. |
| STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit | REQ-114 | aligned **to the system as it stands**; REQ-137 (imminent) will supersede the `steps` derivation and the byte-identity gate. Verified `steps` still present and `shade` absent on this branch, so the story is not yet wrong. `1c colors <slug> [--json]` confirmed wired (`index.ts:303`). |
| STORY-102 (`story-c46abfa6`) — site asset store | REQ-118 (origin); REQ-128, REQ-132 downstream | **drift**: the "Known upstream limitation" paragraph states a picker behaviour REQ-132 removed, and rests on a rule REQ-132 deliberately departed from. The listing's own surface is unchanged by both REQ-128 and REQ-132, so this is a body-text repair, not a coverage gap. |

Exclusivity: no overlap between the four stories. STORY-92 and STORY-102 both
enumerate font files but answer different questions (project-level licence
obligation vs site-level reference listing), and STORY-102 holds them apart
explicitly. STORY-93's "declares no palette" and STORY-97's retrofit are
complementary, not competing.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-102 (`story-c46abfa6`) | story-body-edit | Technical Context → "Known upstream limitation, deliberately not worked around" asserts that "a chooser drawn from this listing shows the handle rather than a friendly name or a thumbnail", justified by "the project's rule that a component gap is closed upstream and never wrapped locally". REQ-132 (free_and_reconciled, merged `6cb3942fdbc8271b1142858f7546943642f53aa4`, 2026-08-12) replaced the `<select>` with a thumbnail grid carrying file-name labels, implemented **locally** in `apps/control-app/src/builder/image-picker.js` precisely because the upstream component has "no seam for a thumbnail grid". Both the factual premise and its stated rule are now false. Confirmed landed on this branch: `apps/control-app/src/builder/image-picker.js` exists; `format?: 'image'` at `packages/site-schema/src/l1/edit.ts:202`. | Rewrite the paragraph. Keep what is still true — the upstream enum control renders an option's text as its value verbatim, and **the listing itself carries no label or thumbnail** (`SiteAsset` is `{id, src, alt, kind, onDisk, registered}`; REQ-132's label is the handle's basename derived client-side). Drop the claim that the builder's chooser shows the handle, and drop the "closed upstream, never wrapped locally" rationale, replacing it with the REQ-132 boundary: presentation of the choices belongs to the editor-gesture capability, this capability supplies the data. |
| 2 | violation | consistency | STORY-93 (`story-86c7c21b`) | story-body-edit | Technical Context → final bullet ("Intent/implementation agreement") still reads "The derived-rather-than-restated ladder and **the theme-sourced colours** are implementation decisions … documented here as behaviour". REQ-114 (free_and_reconciled, merged `cd8f98c8`, §4) deleted `paletteTokensSchema` and the required `palette` key on `themeTokensSchema`, so a scaffold cannot source colour from the theme. The story's own first Technical Context bullet already says exactly this ("That palette no longer exists … the single place a fresh site's colour is stated is the page's own layout document"), so the story contradicts itself. Code confirms the restated version: `tools/generate/src/cli/scaffold.ts:45-46` seeds `STARTER_BACKGROUND = '#ffffff'` and `STARTER_TEXT = '#111827'` as literals on the L1 document. | In the final bullet, replace "the theme-sourced colours" with "the page-declared literal colours" (or delete the clause). No other change; the Description and the first bullet are correct. |
| 3 | warning | coverage | STORY-97 (`story-5e7eb0c5`) | story-body-edit | REQ-137 (`request-d2980a95`, status `bundled` → imminent) revises this story's subject on two load-bearing points: (a) palette entry `steps` is **deleted** in favour of a continuous `shade` on the reference, and `1c colors --assign` "never emits a step" (AC1, AC3) — STORY-97 describes ramp grouping as "one entry with steps"; (b) REQ-137 §3 explicitly **supersedes REQ-114 AC3's byte-identity**, replacing it with a bounded ≤8/255 guarantee on genuine ramp members (82 of 210 colour slots changed on `xgd`) — STORY-97's title says "without moving a pixel" and its gate says "every derived reference reproduces byte-for-byte the literal it replaces". Not a violation today: verified REQ-137's code has **not** reached this branch — `packages/site-schema/src/l1/palette.ts:63-72` still defines `steps` with no `shade`, and `tools/generate/src/cli/colors.ts:342-364` still emits steps — so STORY-97 accurately describes the current system. | No edit now. Flagged so the reconcile of `bundle-d9226698` rewrites the title, the ramp-grouping description and the lossless gate together rather than leaving the byte-identity claim standing. |
| 4 | info | — | STORY-97 | — | Out-of-scope line "Any colour-picker or palette-editor UI. Explicitly deferred by the intent." remains accurate as a statement about REQ-114. REQ-133 and REQ-140 (both ready_to_reconcile) now build that UI, but in the editor capability — this is a capability boundary, not a claim that no such UI exists. | none |
| 5 | info | — | STORY-102 | — | REQ-128 (free_and_reconciled, 2026-08-08) added the painted-container background picker over this same listing and explicitly "reuses that ticket's asset listing". `listSiteAssets` gained no source, field or caller-visible change, so there is no coverage delta for this capability; the behaviour is covered by STORY-100 (CAP-86, `capability-f753cecd`). | none |

## Notes for the Editor

- **Both violations are single-phrase repairs in Technical Context**, not
  structural drift. Neither story's Description, In-scope or Out-of-scope
  section is wrong, and no AC needs to be added, edited or deprecated at this
  level. The capability's four scope areas each map cleanly to exactly one
  story, and every reconciled intent's asked behaviour is expressed somewhere —
  either here or, for the halves that belong elsewhere, in STORY-80 (palette
  model), STORY-100 (the copy/image write path) and STORY-107 (asset writes via
  the control surface).

- **Shared root cause for finding 2**: the REQ-114 update to STORY-93 rewrote
  the Description and added a leading Technical Context bullet explaining the
  colour-provenance move, but did not sweep the rest of the section for the old
  wording. Worth a scan of any other story updated by `bundle-0385746c` for
  residual "theme palette" / "theme-sourced colour" phrasing.

- **REQ-137 is the one to watch.** It is the only imminent intent that lands
  inside this capability (its model half is STORY-80's, but AC3–AC5 are squarely
  the `1c colors` census/retrofit surface this capability owns). When
  `bundle-d9226698` reconciles, STORY-97 needs a coordinated rewrite — the title
  itself encodes the guarantee that is being superseded, so a body-only edit
  would leave the drift visible in the story list.

- **Not counted, but on the horizon**: REQ-142 (`free_coded`), REQ-143 and
  REQ-145 move the site store to D1/R2. REQ-142 states "no behaviour change at
  all" and its code has not reached this branch (`listSiteAssets` is still sync
  at `tools/generate/src/cli/edit.ts:1287`). If REQ-143 lands, STORY-102's
  premise of "the site's draft asset directory" and STORY-92's on-disk source-
  tree scan both describe a filesystem that will no longer be the store — those
  are the two places to re-check at that point, not now.

- **Verified rather than assumed** during this check: `1c fonts check [--json]`
  and `1c colors <slug> [--json]` are both wired (`tools/generate/src/cli/index.ts:303,312`),
  grounding the "machine-readable form" claims in STORY-92 and STORY-97 that
  REQ-101 and REQ-114 do not spell out in their acceptance lists.
