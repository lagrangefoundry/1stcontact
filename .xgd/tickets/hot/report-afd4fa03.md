---
uid: report-afd4fa03
id: REPORT-3404
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:33:20.117883+00:00'
updated_at: '2026-09-03T23:33:20.117883+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**). Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  the conflict existed only in the index with no working-tree markers; resolved
  with `git checkout --ours` + `git add --sparse`.

  **Rule applied: 2e "one side is a strict superset of the other".** Diffing the
  merge base (`6d32b77e`) against the incoming blob (`6087865d`) shows the
  incoming commit `59a11113` ("xgd(ticket): update request request-439cd0c8")
  made exactly one content change: it added `chat_comment: comment-0fb97f84`
  under `fields`. Its only other delta is stripping the file's trailing newline
  — a formatting artifact, not a fact.

  The HEAD side (`a4b20546`, "xgd(ticket): seed_local_overlay request
  request-439cd0c8") already carries that identical `chat_comment` value, plus a
  large body of further work the incoming side never had: `status: bundled`,
  `version: 0.2.24`, `bundled_in: bundle-203b1dc2`, the `commits` list, and the
  rewritten body (Shadow → Description, the implementation-review decisions, the
  "what was built" departures, the bundle measurement, and the 2026-08-31
  resolved-questions section).

  HEAD is therefore a strict superset of incoming on every fact. No field or
  section was changed differently on the two sides, so this is not a genuine
  intent conflict and the per-fact timeline rule was not needed — no
  `working-timeline` lookup was required. Nothing from either side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/request-439cd0c8.md` — **preserved.** The incoming commit's
  sole change, `chat_comment: comment-0fb97f84`, is present in the resolved file
  at line 17 (verified by grep against the staged content, whose hash is
  `a4b20546`, before staging).

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
here. No code, implementation, or UAT test files were involved in this conflict.

## Note for the finalize step

The resolution nets to no diff versus HEAD — `git status --porcelain` reports no
tracked-file entries at all after staging. This is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: STEP 3's distinguishing check confirms the
incoming commit's key change is *present* in HEAD via a different route (the
HEAD-side `seed_local_overlay` commit landed the same `chat_comment` alongside
the bundling metadata), rather than simply absent. Per STEP 4 no `--skip` was
issued; `cherry_pick_finalize_resolution` should detect the clean staged diff and
skip the commit itself. `CHERRY_PICK_HEAD` was left intact.
