---
uid: report-ae7acd2f
id: REPORT-3414
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:59:00.114271+00:00'
updated_at: '2026-09-03T23:59:00.114271+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket (rule **2e**). Index-only conflict: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so there were no working-tree markers. Resolved with `git checkout --ours` + `git add --sparse`; staged blob is `561e1e92b8` (the ours side).

  Incoming commit `7e2eac8d00` (`xgd(ticket): update request request-909e42f8`, authored 2026-08-31 15:09:14 -0700) — 1 file changed, 2 insertions, 2 deletions, all frontmatter.

  Neither side carries a `fields.intent_uid`, so `xgd working-timeline` has nothing to compare; per-fact ordering was taken from `updated_at`, which is also what the enrichment metadata prescribes ("take the more recent commit by timestamp"). Ours (`seed_local_overlay`, `2026-09-02T17:48:26Z`) is later than incoming (`2026-08-31T22:09:14Z`) on every contested fact, so 2e's per-fact timeline rule and the enrichment rule agree.

  Per-fact resolution:

  - `fields.story_points` — the substantive field this commit records itself as updating. **Value is `3` on both sides, identical.** The incoming commit changed no field *value* at all; its entire delta is the two metadata lines below.
  - `updated_at` — same field, different values. Kept ours (`2026-09-02T17:48:26.845864+00:00`) over incoming (`2026-08-31T22:09:14.813845+00:00`); ours is later.
  - `last_field_updated` — same field, different values (ours `status`, incoming `story_points`). Kept ours. This is a derived marker naming whichever field the most recent write touched; ours' most recent write is the 2026-09-02 bundling operation that set `status`/`bundled_in`, so `status` is the value consistent with ours' `updated_at`. Taking incoming's `story_points` while keeping ours' later timestamp would produce an internally inconsistent record.
  - `status` — ours `bundled` (with `fields.bundled_in: bundle-203b1dc2`) vs incoming `free_coded`. Kept ours: `bundled` is the downstream successor state, and accepting incoming would demote operator/workflow-set lifecycle state.
  - `fields.bundled_in`, the reflowed body, and the appended `# What landed` implementation record — present only on ours, untouched by the incoming diff. Kept.

  Nothing was invented; every retained value is present on one of the two sides.

## Incoming changes preserved

The incoming commit's full delta against its own base (`5a490754fb` → `734f26f231`) is exactly two lines — an 8-second `updated_at` bump and a `last_field_updated` marker flip. Verified against the blobs:

- The field it names, `fields.story_points: 3`, is **byte-identical on both sides** — already present in the staged result. No developer-authored value is discarded.
- Its body is byte-identical to its own base, i.e. this commit did not touch the prose. Ours' body is a strict superset (same content, reflowed, plus the `# What landed` record), so keeping ours drops nothing the incoming side authored.
- The `fields.commits` list (`858d63202f`, `c056002a52`) and `fields.version: 0.2.22` are identical on both sides and present in the result.

The only incoming values not carried forward are the two bookkeeping metadata lines, each superseded by a strictly later value of the same fact on ours. That is 2e's per-fact timeline rule operating as intended, not a discard of developer code.

No hunk was dropped under the BUG-1301 precedence exception; none applied. No code, test, or spec-ticket files were involved.

**Net effect**: the staged tree is byte-identical to HEAD (`e322692c9f`) for this path, so this cherry-pick nets to no diff — the second consecutive commit in this run to do so, both being metadata-only updates to a ticket whose later state HEAD already holds. Per STEP 4 this is the redundant-commit case, not the discarded-commit case: STEP 3's distinguishing check confirms the incoming commit's substantive content (`story_points: 3`) is *present in HEAD*, not absent. `--skip` was not called; `CHERRY_PICK_HEAD` (`7e2eac8d00`) is left intact for `cherry_pick_finalize_resolution`.
