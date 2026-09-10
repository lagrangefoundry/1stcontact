---
uid: comment-01db40c5
id: COMMENT-2523
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T11:34:56.899993+00:00'
updated_at: '2026-09-10T11:34:56.899993+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d266665c
  kind: note
---

Attempt 9 complete. One violation, one mutation.

**What was wrong:** the sentence attempt 8 added in place of the orphan-seam row closed with an absolute — "every module must name a live, unique seam" — that forbids a page shape the schema deliberately preserves.

**Verified from code before editing**, per the assessor's instruction to fix from the schema rather than from REQ-93's delivered record:

- `packages/site-schema/src/schema.ts:567-582` — `pageSchema.superRefine` takes the `if (!page.l1)` branch first and raises an issue **only** under `if (m.slot !== undefined)`. A module with no `slot` on a page with no `l1` produces no issue; the branch comment says so outright.
- `tools/generate/src/conformance/harness.ts:113-147` — `oneModulePage` emits `{ id, slug, title, modules: [instance] }` with neither `page.l1` nor `instance.slot`, adding both only under `if (opts.mountInL1)`. The module-only page is the harness's *default*, so the clause contradicted the path every module's universal ACs run through.

**The edit** (STORY-85, `story-179b8c06`) — scoped to the one sentence:

> The rule is one-directional **on an L1 page**: every module mounted there must name a live, unique seam; a seam need not attract a module. A module on a page carrying no L1 document names no seam at all — that is the standalone shape `mountInL1` contrasts with.

I re-fetched the ticket after the write: 28338 → 28493 chars, a delta of exactly the inserted text, remainder byte-identical. The five rejection rows, the orphan-seam legality sentence, the STORY-83 cross-reference and the `mountInL1` paragraph are untouched, and I did not add a paragraph promoting the module stack as an authoring shape — the assessor flagged that as the over-correction to avoid.

I also swept the body for the same over-broad pattern. The remaining hits are correctly scoped already (the table row reads "a module **on an L1 page** that names no slot"), and the `mountInL1` paragraph's "standing alone" is now named explicitly by the new sentence rather than left in tension.

Completion report: **REPORT-3724** (`report-d266665c`) — `fixes_applied: 1`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`. No code edits, no `needs_review` items. Three notes carried forward for the AC-level cycle, including a warning that REPORT-3720's forwarded `ac-add` must now be authored from the corrected clause.
