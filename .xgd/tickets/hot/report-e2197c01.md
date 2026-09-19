---
uid: report-e2197c01
id: REPORT-4379
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:21:48.201898+00:00'
updated_at: '2026-09-19T10:21:48.201898+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** ("one side is a strict superset of the other: keep
  the superset"). Resolved to **ours** (HEAD).

  Incoming commit `287de98` (*xgd(ticket): update request request-26dafd83*)
  changed exactly two things against the merge base `f461ffc`:
  1. added `fields.chat_comment: comment-cb7fa49c`
  2. dropped the trailing newline at end of file

  Ours (`139d346`) contains both of those facts verbatim, plus a set of strictly
  additional, non-competing advances the base never had: `status: draft` →
  `bundled`, `last_field_updated: created_at` → `status`, a refreshed
  `updated_at`, a `fields.commits` list (3 working shas), `fields.version:
  0.2.31`, `fields.bundled_in: bundle-87be4669`, and an appended
  `## What landed` section.

  There is no per-fact competition to arbitrate: a full diff of theirs against
  ours shows the only lines present on the incoming side and absent from ours
  are *base* content that ours deliberately advanced, not anything the incoming
  commit authored —
  - `status: draft` / `last_field_updated: created_at` / the stale `updated_at`,
    superseded by ours' status advance to `bundled`;
  - the "**Granularity** — one document per module, or one catalogue?" open
    question bullet, which ours removed because its own appended `What landed`
    section answers it ("One catalogue per source, not one document per module…
    It stays one document per source until a single module no longer fits a
    chunk").

  So this is not a case of a competing edit to a shared fact (which would send
  it to the `xgd working-timeline` tie-break); it is the superset case. No
  content was invented, and no `fields.intent_uid` / `story_uid` /
  `capability_uid` was touched.

## Incoming changes preserved

Both of the incoming commit's changes are present in the resolved file,
verified directly against the staged HEAD blob:

- `fields.chat_comment: comment-cb7fa49c` — present at line 17.
- No trailing newline — the blob ends `…may cluster oddly beside it.` with no
  terminating `\n` (confirmed by `od -c` on the tail).

No hunk was dropped; the BUG-1301 precedence exception was not needed and is not
invoked here.

## Note for the finalize step

The resolution nets to **no staged diff vs HEAD** (`git diff --cached HEAD` is
empty). This is the redundant-commit case, not the discarded-commit case: per
STEP 3's test, the incoming commit's key changes are *present* in HEAD (having
arrived via the later ours-side ticket update that also carried them), not
merely absent. Per STEP 4 I did not call `--skip`; the cherry-pick sequencer is
untouched and `CHERRY_PICK_HEAD` (`287de98…`) is still in place for
`cherry_pick_finalize_resolution` to detect the empty diff and skip the commit.
