---
uid: report-d266665c
id: REPORT-3724
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (story) — attempt
  9'
created_by: xgd
created_at: '2026-09-10T11:34:42.708823+00:00'
updated_at: '2026-09-10T11:34:42.708823+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: story
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (story)

**Attempt**: 9
**Fixes applied this call**: 1
**Violations remaining**: 0
**Needs more work**: false

One violation, one `story-body-edit`, one sentence. REPORT-3722's Notes for the
Editor were explicit that the section does not need rewriting and that
over-correcting in the other direction (promoting the module stack as an
authoring shape) would be its own defect. I took that at face value and scoped
the edit accordingly — the low mutation count is the instruction being followed,
not work left undone.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-85 (`story-179b8c06`) | Qualified the one-directional binding rule to the L1 page, and named the standalone (module-only) page as its complement |

### The edit, verbatim

Before:

> The rule is one-directional: every module must name a live, unique seam; a
> seam need not attract a module.

After:

> The rule is one-directional **on an L1 page**: every module mounted there must
> name a live, unique seam; a seam need not attract a module. A module on a page
> carrying no L1 document names no seam at all — that is the standalone shape
> `mountInL1` contrasts with.

Nothing else in the body changed. I re-fetched the ticket after the write and
diffed: 28338 → 28493 chars, a delta of exactly the inserted text, and the
remainder round-trips byte-identical. The five rejection rows, the orphan-seam
legality sentence, the STORY-83 cross-reference and the `mountInL1` paragraph
are all untouched, as instructed.

## Verification — from code, not from the fix report

REPORT-3722 directed me to fix the clause from `schema.ts:568-576` and
`harness.ts:113-147` rather than from REQ-93's delivered record. I read both
before editing and confirm the finding independently:

- `packages/site-schema/src/schema.ts:567-582` — `pageSchema.superRefine` takes
  the `if (!page.l1)` branch first, and inside it iterates `page.modules` raising
  an issue **only** under `if (m.slot !== undefined)`. A module with no `slot` on
  a page with no `l1` produces no issue. The branch's own comment states the
  intent: *"No page body to mount into — a `slot` here names nothing."*
- The doc comment above it (`schema.ts:522-544`) frames the page as **two
  shapes** — "a **behavior-module stack** … or an **L1 page**" — and describes
  REQ-93 as *narrowing* REQ-88's XOR, not as making the seam universal.
- `tools/generate/src/conformance/harness.ts:113-147` — `oneModulePage` builds
  `{ id, slug, title, modules: [instance] }` with neither `page.l1` nor
  `instance.slot`, and adds both **only** under `if (opts.mountInL1)`. The
  module-only page is the harness's default shape, so the pre-edit clause
  contradicted the path every module's universal ACs run through.

So the clause was false as an absolute and the qualifier is the correct repair.

I also swept the rest of the body for the same over-broad pattern
(`every module` / `must name` / `no seam` / `standing alone`). The only other
occurrences are the section heading at line 90 ("it must name the seam it mounts
into" — presupposes mounting, so correctly scoped), the rejection-table row that
already reads "a module **on an L1 page** that names no slot", and the
`mountInL1` paragraph's "standing alone", which the new sentence now names
explicitly instead of leaving in tension. The section is internally consistent.

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. The single finding was settled by code; the assessor raised no
`needs_review`.

## Carried notes for later cycles (not violations, no action taken)

| Element | Note | Owner |
|---|---|---|
| STORY-82 (`story-46e3b3c7`) | REPORT-3719 finding 8 / REPORT-3722 finding 5: STORY-82 is provenance rather than capability surface, so duplication would bite at its ACs, not its body. Correctly deferred. | AC-level cycle |
| STORY-82 (`story-46e3b3c7`) | REPORT-3722 finding 6: body closes "Story Points: 2" against `fields.story_points: 3`. Flagged by the assessor as explicitly out of this check's scope and *not* a finding; left untouched so it is not mistaken for drift. | — |
| STORY-85 (`story-179b8c06`) | REPORT-3720's forwarded `ac-add` for "the page-level binding rejections and `mountInL1`" should now be authored from the corrected clause: an AC asserting a module must *always* name a seam would fail against correct code, and specifically against the harness's default mode. | AC-level cycle |
