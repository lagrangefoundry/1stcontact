---
uid: report-e5fd0e6a
id: REPORT-3784
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=story)'
created_by: xgd
created_at: '2026-09-10T19:41:56.216549+00:00'
updated_at: '2026-09-10T19:41:56.216549+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: story
  violations: 3
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 1
**Needs review**: 0

> **Read this first.** Two of the three violations are **carried over verbatim
> from the previous story-level check** (`report-375af0aa`, 2026-08-16, FAIL,
> 2 violations). Three fix attempts have since been recorded and **neither story
> body was edited**. Evidence: `story-86c7c21b` and `story-c46abfa6` both show
> `updated_at` 2026-08-16T06:14 with `last_field_updated: uat_coverage` — a field
> write from the UAT-coverage check at 06:16, not a body edit — and neither has
> been touched in the 25 days since. The offending sentences are still present
> byte-for-byte. This check is not re-deriving a new problem; it is reporting
> that the prescribed edits were never applied.

## Cumulative Intent Considered

Bundle members are listed individually, since the stories carry the bundle UID
as `intent_uid` but align to specific members.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-102 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8`, 2026-08-06 | `1c new` seeds a minimal valid L1 document — ladder, background, flowed root, one placeholder run; renders/shots unedited; `1c repro` overwrites wholesale; no flag, no mode detection | YES |
| REQ-101 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8`, 2026-08-06 | Font provenance index; three-state `redistribute_in_product`; `distribution` marker; `1c fonts check` with four violation kinds + on-disk scan; actions warn, redistribution blocks; missing/malformed record is a hard error | YES |
| REQ-114 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | merged `cd8f98c8`, 2026-08-06 | Palette colour model (model half → STORY-80, other capability); census command; retrofit of `storage/sites/*`; §4 retired the colour token group and the `theme.palette` key outright | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | merged `b2b9208c`, 2026-08-07 | `listSiteAssets` — union of registry + asset directory, merged by handle, `onDisk`/`registered` provenance, one handle vocabulary, derived `kind`, reachable from CLI and `/api/assets` | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | Background-image picker over the *same* listing; explicitly reuses it, adds no source | YES (no delta here) |
| REQ-132 (`request-5946d045`) | free_and_reconciled | merged `6cb3942f`, 2026-08-12 | Image picker becomes a **local** thumbnail grid with file-name labels; `format?: 'image'` on the descriptor. Wrapped in `apps/control-app/src/builder/image-picker.js` because the upstream enum control has no seam | YES |
| REQ-137 (BUNDLE-18, `bundle-d9226698`) | **free_and_reconciled** | merged `bbdde0d0`, 2026-08-13 | Deletes palette entry `steps`, adds continuous `shade` on the reference; `--assign` never emits a step; **supersedes REQ-114 AC3's byte-identity** with a bounded ≤8/255 guarantee | **YES — was `bundled`/imminent at the last check; now live** |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette popup (editor capability) | YES (other capability) |
| REQ-140 (`request-3c0fec69`) | free_and_reconciled | 2026-08-15 | Page-editor colour from the palette (editor capability) | YES (other capability) |
| REQ-142 (`request-0dd62a5d`) | **free_and_reconciled** | 2026-08-15 | Async `SiteStore` port, filesystem behind it. States **"no behaviour change at all"** | **YES — was `free_coded` at the last check** |
| REQ-143 (`request-18a48d63`) | **free_and_reconciled** | 2026-08-15 | D1/R2 adapter for the port. Both adapters live and current; the `1c` CLI keeps editing `storage/sites/` | **YES — the prior check named this as the trigger to re-examine STORY-102 and STORY-92** |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder origin in workerd; the Node `1c builder` origin's routes move | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud (site delivery capability — out of scope here) | YES (other capability) |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Locale identity, money/time representation, reserved slugs. Verified **not** to touch the scaffold: `starterSiteJson` seeds no locale (`tools/generate/src/cli/scaffold.ts:29-39`) | YES (no delta here) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Image generation component | NO |
| REQ-155 – REQ-166 | draft | 2026-08-20 → 08-31 | Capture port, KB, Library tab, ingestion | NO (not active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 (`story-86c7c21b`) — authoring start point | REQ-102 (origin), REQ-114 (`updated_by`) | **drift, unrepaired**: Description and the leading Technical Context bullet correctly restate the post-REQ-114 colour provenance, but the closing bullet still calls the scaffold's colours "theme-sourced". Self-contradictory. REQ-102's four acceptance items remain fully covered. REQ-151 verified not to add a locale to the starter. |
| STORY-92 (`story-8685be2d`) — font provenance & licence | REQ-101 | **aligned**. Re-checked against REQ-142/143 as the prior report directed: `1c fonts check` still scans the filesystem (`tools/generate/src/cli/fonts.ts:24` `node:fs`, `:222-233` walks `storage/<tree>/`), and REQ-142 §4 keeps `storage/sites/` git-tracked on the operator's machine. The story's on-disk-scan premise stands. |
| STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit | REQ-114, REQ-137 (`updated_by`) | **drift, new**: the **body** was correctly rewritten for REQ-137 on 2026-08-16 (`shade`, the measured 8/255 bound, "supersedes the pixel-identity guarantee"), but the **title** still promises "without moving a pixel". Exactly the coordinated rewrite the prior check's warning #3 asked for, applied to the body only. |
| STORY-102 (`story-c46abfa6`) — site asset store | REQ-118 (origin); REQ-128, REQ-132, REQ-142/143, REQ-145 downstream | **drift, unrepaired** (violation 1) plus a **new warning** from REQ-143. The listing's behavioural surface — union, provenance, one handle vocabulary, derived kind, reachable without a gesture — is unchanged and still true. |

**Exclusivity**: no overlap between the four stories. STORY-92 and STORY-102 both
enumerate font files but answer different questions (project-level licence
obligation vs site-level reference listing), and STORY-102 holds them apart
explicitly. STORY-93's "declares no palette" and STORY-97's retrofit are
complementary. Unchanged from the prior check.

**Coverage**: each of the capability's four scope areas maps to exactly one
story, and every reconciled intent's asked behaviour is expressed — either here
or, for the halves that belong elsewhere, in STORY-80 (palette model), STORY-100
(copy/image write path) and STORY-107 (asset writes). No `ac-add` at this level.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-102 (`story-c46abfa6`) | story-body-edit | **Carried over unfixed from `report-375af0aa` finding 1.** Technical Context → "Known upstream limitation, deliberately not worked around" still asserts that "a chooser drawn from this listing shows the handle rather than a friendly name or a thumbnail", justified by "the project's rule that a component gap is closed upstream and never wrapped locally". REQ-132 (free_and_reconciled, merged `6cb3942fdbc8271b1142858f7546943642f53aa4`) made both clauses false, and did so **locally**. Re-verified on this branch: `apps/control-app/src/builder/image-picker.js` exists and its header reads "One closed list of image handles, drawn as thumbnails with their file names" and "WHY IT IS HERE AND NOT IN `mountFields` … a thumbnail grid is not reachable through its seams"; `format?: 'image'` at `packages/site-schema/src/l1/edit.ts:210`, emitted at `:996` and `:1032`. | Rewrite the paragraph. Keep what is still true — **the listing itself carries no label or thumbnail** (`SiteAsset` is `{id, src, alt, kind, onDisk, registered}`; REQ-132 derives its label from the handle's basename client-side). Delete the claim that the chooser shows the handle, and delete the "closed upstream, never wrapped locally" rationale; replace it with the capability boundary — presentation of the choices belongs to the editor-gesture capability, this capability supplies the data. |
| 2 | violation | consistency | STORY-93 (`story-86c7c21b`) | story-body-edit | **Carried over unfixed from `report-375af0aa` finding 2.** Technical Context → closing "Intent/implementation agreement" bullet still reads "The derived-rather-than-restated ladder and **the theme-sourced colours** are implementation decisions … documented here as behaviour". REQ-114 (free_and_reconciled, merged `cd8f98c8`, §4) retired the colour token group, so a scaffold cannot source colour from the theme. The story's own first Technical Context bullet says exactly that, so the story contradicts itself. Re-verified on this branch: `tools/generate/src/cli/scaffold.ts:47-48` seeds `STARTER_BACKGROUND = '#ffffff'` / `STARTER_TEXT = '#111827'` as literals on the L1 document, and `packages/framework/src/tokens/defaults.ts:9-10` states "REQ-114 — no colour defaults: colour left the token surface". A whole-body sweep found this is the **only** remaining stale occurrence. | In the closing bullet, replace "the theme-sourced colours" with "the page-declared literal colours", or delete the clause. No other change — Description and the first bullet are correct. |
| 3 | violation | consistency | STORY-97 (`story-5e7eb0c5`) — **title** | story-body-edit (title) | The story title still reads "… migrate it onto a palette **without moving a pixel**". REQ-137 (`request-d2980a95` / BUNDLE-18 `bundle-d9226698`, now **free_and_reconciled**, merged `bbdde0d0`) supersedes REQ-114 AC3's byte-identity with a bounded per-channel guarantee, and the story's own body already says so: "This supersedes the pixel-identity guarantee REQ-114 AC3 made", "The bound is 8/255 per channel", "worst per-channel movement Δ5 on `xgd` and Δ8 on `gigabytealchemy`". Pixels demonstrably move. Confirmed landed on this branch: `SHADE_FIT_TOLERANCE = 8` at `tools/generate/src/cli/colors.ts:372`, and `packages/site-schema/src/l1/palette.ts:107` defines the continuous `shade` with no `steps` field. This is the prior check's warning #3 maturing: the body was rewritten on 2026-08-16, the title was not. | Retitle to state the guarantee the system actually makes — e.g. "… migrate it onto a palette within a proven per-channel bound" or "… without a visible colour shift". Body needs no further edit. |
| 4 | warning | consistency | STORY-102 (`story-c46abfa6`) | story-body-edit | REQ-143 (free_and_reconciled) added a live, diskless D1/R2 adapter beside the filesystem one, so the story's naming of the byte-bearing source as "the site's **draft asset directory**", and its provenance gloss "whether a **file** for it is present", are now adapter-specific where the intent is adapter-neutral. The implementation already generalised: `listSiteAssets` reads `opts.store.listAssets(slug)` (`tools/generate/src/cli/edit.ts:1883-1887`) and the `onDisk` doc comment reads "since REQ-142 it means 'the store has it', which is the same question asked of a store that may have no disk". Not a violation: REQ-142 declares "no behaviour change at all", the fs adapter is still live and current (REQ-142 §4), so the text is narrow rather than false. The capability body carries the same phrasing. | Opportunistic. Generalise "draft asset directory" → "the site's asset store" and "whether a file for it is present" → "whether the store holds bytes for it". Same edit applies to the capability body's "The site asset store" paragraph. |
| 5 | info | — | STORY-92 (`story-8685be2d`) | — | The prior report flagged STORY-92's on-disk source-tree scan as needing re-examination if REQ-143 landed. It landed; the scan is unaffected. `1c fonts check` reads the project's own `storage/` trees with `node:fs`, which is a project-level index over source, not the per-site store the port abstracts. No edit. | none |
| 6 | info | — | STORY-102 | — | REQ-145 (free_and_reconciled) moved the builder origin from the Node `1c builder` server into the control-app Worker. STORY-102's "reachable from the command line and from the builder's own origin" survives the move: `/api/assets` is now served at `apps/control-app/src/router.ts:421`, with `fetchAssets` at `apps/control-app/src/builder/api.js:70`. No edit. | none |

## Notes for the Editor

- **The loop is spinning without editing.** This is the single most important
  thing to act on. Findings 1 and 2 were written out with exact replacement text
  on 2026-08-16 and have survived three fix attempts untouched. Before attempting
  anything else, apply those two edits with `xgd ticket update <uid>
  --append-body` / the appropriate body-edit path and confirm
  `last_field_updated` changes away from `uat_coverage`. Do **not** edit the
  ticket files directly — whole-file rewrites carry stale frontmatter back.

- **All three violations are single-phrase repairs.** No Description, In-scope or
  Out-of-scope section is wrong; no AC needs to be added, edited or deprecated at
  this level; no `code-issue` is implicated. Finding 3 is a title edit and
  nothing more, because REQ-137's body rewrite already landed correctly.

- **Finding 3 is the predicted failure mode.** The prior check warned that "the
  title itself encodes the guarantee that is being superseded, so a body-only
  edit would leave the drift visible in the story list". That is precisely what
  happened when `bundle-d9226698` reconciled. Whoever repairs it should scan for
  the same shape elsewhere: a body rewritten for a superseding intent while the
  title kept the old promise.

- **REQ-142/143/145 have all landed since the last check**, which is the one
  material change to the intent picture. Their effect on this capability is
  smaller than the prior report allowed for: the store port is behaviour-neutral
  by construction, the fonts scan was never per-site, and the builder origin
  moved without changing what the store answers. Finding 4 is the whole of the
  residue, and it is cosmetic.

- **Still on the horizon, not counted**: REQ-155 (`request-01ea4eec`, draft) ports
  the *reference* store off the filesystem. If it reconciles, re-read STORY-92's
  "the check scans the source trees on disk" — `storage/references/` is named in
  `fonts.ts:216` as exactly the tree the on-disk scan exists to catch, and that
  is the one place this capability would genuinely have to change.
