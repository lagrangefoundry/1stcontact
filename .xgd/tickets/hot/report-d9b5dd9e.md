---
uid: report-d9b5dd9e
id: REPORT-3786
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=story)'
created_by: xgd
created_at: '2026-09-10T19:49:26.794443+00:00'
updated_at: '2026-09-10T19:49:26.794443+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

> **What changed since the last check.** The previous story-level check
> (`report-e5fd0e6a`, 2026-09-10T19:41Z, FAIL, 3 violations + 1 warning) reported
> that three fix attempts had produced **no body edits at all**. Attempt 4
> (`report-42796731`, 19:45Z) did write. All four prescribed edits are present in
> the persisted tickets and were re-verified here against the branch — not taken
> on the fix report's word. This check re-derived the intent ledger independently
> and found no new drift.

## Cumulative Intent Considered

Chronological ledger of the intents that touch this capability's scope. Bundle
members are listed individually because the stories carry the bundle UID as
`intent_uid` while aligning to specific members.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-101 (`request-b63bbed5`, BUNDLE-11 `bundle-ee56a66e`) | free_and_reconciled | 2026-07-26 | Font provenance index; three-state `redistribute_in_product`; `distribution` marker; `1c fonts check` with four violation kinds + on-disk scan; actions warn, redistribution blocks; missing/malformed record is a hard error | YES |
| REQ-102 (`request-56cb1897`, BUNDLE-11) | free_and_reconciled | 2026-07-26 | `1c new` seeds a minimal valid L1 document — ladder, background, flowed root, one placeholder run; renders/shots unedited; `1c repro` overwrites wholesale; no flag, no mode detection | YES |
| REQ-114 (`request-3cd338cd`, BUNDLE-14 `bundle-0385746c`) | free_and_reconciled | 2026-07-31 | Palette colour model (model half → STORY-80, other capability); census command; retrofit of `storage/sites/*`; §4 retired the colour token group and the `theme.palette` key outright | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | `listSiteAssets` — union of registry + asset store, merged by handle, `onDisk`/`registered` provenance, one handle vocabulary, derived `kind`, reachable from CLI and `/api/assets` | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | Background-image picker over the *same* listing; adds no source | YES (no delta here) |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker becomes a **local** thumbnail grid with file-name labels; `format?: 'image'` on the descriptor | YES |
| REQ-133 / REQ-140 | free_and_reconciled | 2026-08-12 / 08-15 | Palette popup, page-editor colour from the palette | YES (editor capability) |
| REQ-137 (`request-d2980a95`, BUNDLE-18 `bundle-d9226698`) | free_and_reconciled | 2026-08-12 | Deletes palette entry `steps`, adds continuous `shade`; **supersedes REQ-114 AC3's byte-identity** with a bounded ≤8/255 per-channel guarantee | YES |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | Async `SiteStore` port, filesystem behind it; states "no behaviour change at all" | YES |
| REQ-143 (`request-18a48d63`) | free_and_reconciled | 2026-08-15 | D1/R2 adapter for the port; both adapters live, `1c` keeps editing `storage/sites/` | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder origin in workerd; the Node origin's routes move | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud | YES (site delivery capability) |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Locale identity, money/time, reserved slugs. Re-verified: neither body asks for a scaffold change — `scaffold`/`starter` appear only in their test-run notes, and `scaffold.ts` seeds no locale | YES (no delta here) |
| REQ-162 (`request-13a5e206`) | **free_and_reconciled** (2026-09-02) | 2026-08-31 | Product ticket store: D1 ticket schema, TypePack, `material`/`reference`/`brief` types, blob store in its own bucket | **YES — newly reconciled since the last check; different subject (client material as tickets), no delta here** |
| REQ-154 (`request-b88b79fe`) | **bundled** | 2026-08-20 | Browser Rendering driver behind the existing `BrowserDriver` seam | imminent — capture capability; does not change what a scaffolded page *is* |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Image generation component | NO |
| REQ-155–161, REQ-163–166 | draft | 2026-08-20 → 08-31 | Capture port, sharp removal, fidelity surface, KB, Library tab, ingestion, corpus export, projected reference, capture-to-ticket | NO (not active) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 (`story-86c7c21b`) — authoring start point | REQ-102 (origin), REQ-114 | **aligned (repaired)**. The closing "Intent/implementation agreement" bullet now reads "the page-declared literal colours"; the self-contradiction with its own first Technical Context bullet is gone. Re-verified on branch: `tools/generate/src/cli/scaffold.ts:47-48` seeds `STARTER_BACKGROUND = '#ffffff'` / `STARTER_TEXT = '#111827'` as literals, `:62-63` places them on the document, `:82` reuses `STARTER_TEXT` on the run (no third value), `:61` seeds `widths: [...STARTER_WIDTHS]`, and the file's only `palette` mention (`:45`) is the comment stating the scaffold declares none. REQ-102's four acceptance items remain fully covered. |
| STORY-92 (`story-8685be2d`) — font provenance & licence | REQ-101 | **aligned**, unchanged and untouched by attempt 4. Re-verified: the three-state gate at `tools/generate/src/cli/fonts.ts:299-308` treats `REVIEW_REQUIRED` as *no*, the `distribution` marker is read at `:181` and declared at `packages/site-schema/src/schema.ts:915`, the four violation kinds are enumerated from `:107`, and `:217` documents the on-disk scan catching bytes no page references. |
| STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit | REQ-114, REQ-137 | **aligned (repaired)**. Title now reads "… migrate it onto a palette **within a proven per-channel bound**", matching the body's REQ-137 language. Re-verified: `SHADE_FIT_TOLERANCE = 8` at `tools/generate/src/cli/colors.ts:372`, used at `:454` jointly with the family-change refusal the body describes. The body's one surviving "byte-identical" is the second-run fixpoint claim, which REQ-137 does not touch. |
| STORY-102 (`story-c46abfa6`) — site asset store | REQ-118 (origin); REQ-128, REQ-132, REQ-142/143, REQ-145 downstream | **aligned (repaired)**. The "Known upstream limitation" paragraph is replaced by "The listing carries no label and no thumbnail, by boundary"; the false chooser claim and the "closed upstream, never wrapped locally" rationale are gone, and the word "upstream" no longer appears. The adapter-specific phrasing is generalised to "asset store" / "the store holds bytes for it" (last check's warning 4). Re-verified: `SiteAsset` at `tools/generate/src/cli/edit.ts:1849-1856` carries `{id, src, alt, kind, onDisk, registered}` and no label/thumbnail; `listSiteAssets` (`:1883-1905`) reads `opts.store.listAssets(slug)` and merges the registry by `assetHandle`; `apps/control-app/src/builder/image-picker.js` exists (REQ-132 wrapped locally); `/api/assets` is served at `apps/control-app/src/router.ts:421`. |
| CAP-89 body (`capability-b4ac88fc`) | REQ-137, REQ-142/143 | **aligned (repaired)**. The colour-census paragraph now says "within a proven per-channel bound" and "bounded-reported-or-nothing write … reports the drift it accepted"; the asset paragraph says "the site's asset store (bytes, no metadata)". |

**Consistency**: no story asserts behaviour the ledger does not support. The four
repairs above were each checked against the branch rather than accepted from the
fix report; every one is present in the persisted ticket body.

**Coverage**: each of the capability's four scope areas maps to exactly one
story, and every reconciled intent's asked behaviour is expressed — either here
or, for the halves that belong elsewhere, in STORY-80 (palette model), STORY-100
(copy/image write path) and STORY-107 (asset writes). The two intent-status
changes since the last check add nothing to express: REQ-162 stands up a ticket
store for *client* material (a distinct subject from a site's own asset
inventory, and the licence half is already held apart by STORY-102's stated
boundary), and REQ-154 swaps a browser driver behind an existing seam. No
`ac-add` at this level.

**Exclusivity**: no overlap between the four stories. STORY-92 and STORY-102 both
enumerate font files but answer different questions (project-level licence
obligation vs site-level reference listing), and STORY-102 holds them apart
explicitly. STORY-93's "declares no palette" and STORY-97's retrofit are
complementary.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-102, STORY-93, STORY-97, CAP-89 | — | All three violations and the one warning of `report-e5fd0e6a` are repaired and independently verified against the branch (see the ledger rows for the file:line evidence). The four-attempt spin is resolved: `last_field_updated` is `body` on STORY-93 and STORY-102, `title` on STORY-97, `body` on CAP-89, all at 2026-09-10T19:43–19:44Z. | none |
| 2 | info | coverage | STORY-92 (`story-8685be2d`) | — | REQ-155 (`request-01ea4eec`) is still **draft**, so the on-disk premise stands unchanged. It remains the one intent that would force a change here: it ports the *reference* store off the filesystem, and `storage/references/` is named at `tools/generate/src/cli/fonts.ts:216` as exactly the tree the on-disk scan exists to catch. | none while draft |
| 3 | info | exclusivity | STORY-102 (`story-c46abfa6`) | — | REQ-161 (Library tab) and REQ-163 (ingestion) are draft and would land a *materials* listing over the REQ-162 ticket store. That is client material, not a site's referenceable assets — but if they reconcile, the boundary between "what can this site reference" and "what material this client has" is the exclusivity question to re-ask here. | none while draft |

## Notes for the Editor

- **Nothing to fix at this level.** No story body, title, AC or test needs a
  change from this check. Do not re-open findings 1–3 of `report-e5fd0e6a`; they
  are closed, and re-applying their prescribed text would corrupt bodies that
  already carry it.

- **The two intent-status changes since 19:41Z are both no-deltas**, and both were
  checked rather than assumed. REQ-162 reconciled on 2026-09-02 (the last check's
  ledger still listed it in the draft block); REQ-154 is `bundled`, i.e. imminent.
  Neither asks for behaviour inside this capability's four scope areas.

- **`uat_coverage` is not this check's field and was not touched.** For the
  record as it stands now: CAP-89 `fail`, STORY-93 `stale`, STORY-102 `stale`,
  STORY-97 `pass`, STORY-92 `pass`. The two `stale` values are the expected
  consequence of attempt 4 editing those two bodies — the UAT-coverage check owns
  re-deriving them, and the capability aggregate will keep reading `fail` until it
  does. That is not story-level drift and must not be resolved by writing the
  field here.
