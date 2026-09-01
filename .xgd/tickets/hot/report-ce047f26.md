---
uid: report-ce047f26
id: REPORT-3245
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T22:43:24.467901+00:00'
updated_at: '2026-09-01T22:43:24.467901+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-20979492.md` (DOC-25, "Behavior Modules — Contract & Catalog") — class **AA** (both added; sparse-excluded, so the conflict lives in the index only and needed `git add --sparse`). Rule applied: **2b (both added) + per-fact judgment (2e)** — resolved by taking the incoming side in full, which is lossless here.

  Justification: a direct diff of stage 2 (ours) against stage 3 (theirs) produced **exactly one hunk**, entirely inside the YAML frontmatter. The 300+ line document body is byte-identical on both sides, so there is no HEAD-side content to preserve and nothing to compose.

  The single conflicting fact is the `system_kb` field:
  - ours: `updated_at: 2026-08-22T22:03:32Z`, `last_field_updated: body`, `fields.system_kb: true`
  - theirs: `updated_at: 2026-08-31T19:43:11Z`, `last_field_updated: system_kb`, `system_kb` removed

  The incoming commit `df8d3e8db4` carries an explicit operation narrative — *"field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"* — declaring the removal as the intent. The HEAD-side commit for this file (`7ebd82de`, 2026-08-22) recorded `last_field_updated: body`, i.e. a body edit, and asserts no competing intent about `system_kb`. The two sides are therefore not competing on the same fact; and even under the timeline rule, incoming (2026-08-31) is later than ours (2026-08-22), so incoming wins on that fact either way.

  No `fields.intent_uid` / `story_uid` / `capability_uid` was modified, and no content was introduced that was not present on the incoming side.

## Incoming changes preserved

- `.xgd/tickets/hot/doc-20979492.md` — **preserved in full.** The resolved file's frontmatter shows `updated_at: '2026-08-31T19:43:11.537885+00:00'`, `last_field_updated: system_kb`, and `fields:` containing only `doc_kind: architecture` with `system_kb` absent. That is the entirety of the incoming commit's semantic change to this file. Staged diff vs HEAD is 2 insertions / 3 deletions, matching the one conflicting hunk exactly.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict. `CHERRY_PICK_HEAD` was left intact for `cherry_pick_finalize_resolution`; no `--continue` / `--skip` / `--abort` / `reset` was run.
