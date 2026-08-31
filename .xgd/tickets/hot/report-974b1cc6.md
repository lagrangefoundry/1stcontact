---
uid: report-974b1cc6
id: REPORT-2755
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:29:32.416079+00:00'
updated_at: '2026-08-31T06:29:32.416079+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-9dafeb0b.md` — class **AA** (both added), intent/bookkeeping
  ticket outside the sparse-checkout cone (DOC-986 §2/§4.1, so the conflict lived in
  the index only, no working-tree markers). Rules applied: **2b** (both added — one
  side is a strict superset, keep the superset) reinforced by **2e** (bookkeeping
  ticket, incoming only added a field the other side never touched → keep the
  superset). Resolved with `git checkout --theirs` + `git add --sparse`.

  Diff between the two sides was a single line: incoming (`48e0f61f`, free_coded,
  2026-08-23) carries `fields.chat_comment: comment-c51b7259`; ours (`2e7ca097`,
  2026-08-05) does not. Every other byte — frontmatter, `commits[]`, `version`,
  `bundled_in`, and the full body (behavior / root cause / fix / acceptance
  sections) — was identical on both sides, so no per-fact timeline arbitration was
  needed: nothing was contested. The auto-enrichment note ("intent unknown on one or
  both sides, take the more recent commit by timestamp") points the same way — the
  incoming commit is also the later one — but the superset rule made that
  independent of the timestamp tiebreak.

  No spec ticket (2d) was involved, so no matrix fields were touched.
  `fields.intent_uid` / `story_uid` / `capability_uid` were not modified, and no
  content absent from both sides was introduced.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-9dafeb0b.md` — **fully preserved.** Verified by diffing the
  staged blob against `48e0f61fd8c212679c6f7684ded76480dad950c0:.xgd/tickets/hot/bug-9dafeb0b.md`:
  byte-identical. The staged diff vs HEAD is `1 file changed, 1 insertion(+)` — exactly
  the `chat_comment: comment-c51b7259` field the incoming commit contributes, with the
  HEAD-side content otherwise intact.

No code/implementation files, UAT test files, or config files were in conflict, so
no hunks were dropped and the BUG-1301 precedence exception was not invoked.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `48e0f61fd8c212679c6f7684ded76480dad950c0`)
left in place for `cherry_pick_finalize_resolution`. No `--continue` / `--skip` /
`--quit` / `--abort` / `reset` was run.
