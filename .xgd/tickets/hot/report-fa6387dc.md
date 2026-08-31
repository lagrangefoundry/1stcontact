---
uid: report-fa6387dc
id: REPORT-2801
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:26:57.472208+00:00'
updated_at: '2026-08-31T07:26:57.472208+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-ba3e3fba.md` — class **AA** (both added, no merge base;
  file is outside the sparse-checkout cone, so the conflict existed only in the
  index with no working-tree markers). Rule applied: **2b / 2e** — incoming side is
  a strict superset of HEAD, so the superset was kept.
  Resolved with `git checkout --theirs` + `git add --sparse`.

  Both sides carry the same commit subject (`xgd(ticket): update request
  request-ba3e3fba`), so the auto-enrichment reported "intent unknown on one or
  both sides". No timeline arbitration was needed: the two sides are not competing
  on any fact. The full diff between stage 2 (ours) and stage 3 (theirs) is a
  single added line — incoming adds the metadata field
  `fields.chat_comment: comment-bf3e29de`; every other byte of the 330-line ticket
  (frontmatter fields, `status: abandoned`, timestamps, and the entire request
  body) is identical. This is a non-overlapping field addition on a field HEAD
  never touched, which 2e resolves as "keep the superset".

  No `fields.intent_uid` / `story_uid` / `capability_uid` were modified, and no
  content absent from both sides was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-ba3e3fba.md` — **fully preserved**. The staged blob is
  byte-identical to the incoming commit's version:
  `git diff 183744f7dbb1a647b16aac305329c12294f414da -- <path>` returns empty.
  The incoming commit's sole change, `chat_comment: comment-bf3e29de`, is present
  at line 17 of the resolved file (verified by grep). The staged diff vs HEAD is
  `1 file changed, 1 insertion(+)` — exactly the incoming delta, nothing more.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code,
test, or UAT files were involved in this conflict — the cherry-picked commit
(`183744f7`) touches this one ticket file and nothing else.

Cherry-pick sequencer state left intact: `CHERRY_PICK_HEAD` is still present, and
no `--continue` / `--skip` / `--quit` / `--abort` / `reset` was run.
