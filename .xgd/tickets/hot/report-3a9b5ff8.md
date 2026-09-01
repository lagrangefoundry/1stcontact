---
uid: report-3a9b5ff8
id: REPORT-3166
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T01:31:13.979487+00:00'
updated_at: '2026-09-01T01:31:13.979487+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule **2e**, request-* ticket). Resolved by taking the **HEAD (ours)** side in
  full via `git checkout --ours` + `git add --sparse`.

  **Why ours, not incoming.** This is the REQ-154 request ticket, present on both sides
  with no merge base:

  - **Incoming** (`97327f55c1`, `xgd(ticket): update request request-b88b79fe`,
    2026-08-23 16:26:15 -0700) is a pure 98-line file *creation* — the ticket at its
    original **2026-08-20T23:16:27** draft state (`status: draft`,
    `last_field_updated: body`, no `commits`/`version`/`bundled_in`, no "What was built"
    section). The commit touches this one file and adds nothing else.
  - **Ours** (`afd199743a`, `xgd(ticket): seed_local_overlay request request-b88b79fe`,
    2026-08-31 16:52:27 -0700) carries the same ticket at **2026-08-31T05:05:09**:
    `status: bundled`, `last_field_updated: status`, plus `fields.commits`
    (working_sha 29c0e86d), `fields.version: 0.2.16`, `fields.bundled_in: bundle-8eef3846`,
    and the full "# What was built" narrative section.

  Applying 2e per fact rather than per file:

  - **Strict-superset test (2e bullet 2).** A token-level diff of the two index blobs
    (`git diff --word-diff=porcelain --word-diff-regex='[A-Za-z0-9_]+' ca6629593d e73c0ef808`)
    returns exactly **three** tokens present on the incoming side and absent from ours:
    `2026-08-20T23:16:27.614503`, `body`, `draft`. Every other token of the incoming file
    — the whole body, all seven shared `fields` keys, title, uid, id, created_at — is
    present verbatim in ours. Ours is otherwise a strict superset.
  - **Same-fact conflicts (2e bullet 3).** Those three tokens are the same three facts
    (`updated_at`, `last_field_updated`, `status`), and on each one ours is the
    later-positioned state: 2026-08-31 > 2026-08-20 in the ticket's own `updated_at`, and
    `status` advances draft → bundled (a forward lifecycle move, not a divergent edit).
    The auto-enrichment's rule for this file ("intent unknown on one or both sides — take
    the more recent commit by timestamp") points the same way: ours 2026-08-23 vs
    incoming 2026-08-31, HEAD is more recent by 8 days.

  So there is no fact on which the incoming side is authoritative, and no content on
  either side was invented or dropped. No `fields.intent_uid` / `story_uid` /
  `capability_uid` was touched.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit `97327f55c1` touches
exactly one file (`.xgd/tickets/hot/request-b88b79fe.md`, 98 insertions, 0 deletions) and
it is a ticket, not code. No BUG-1301 precedence exception was invoked; no test function
was deleted.

The incoming commit's substantive content — the REQ-154 ticket body and its `fields` — is
**present in the resolution**, verified token-for-token by the word-diff above. Its only
absent tokens are the three superseded lifecycle facts, which HEAD carries at a strictly
later state. This is STEP 4's redundant-commit case (BUG-1109/BUG-1122), not STEP 3's
discard case: the incoming change is present in HEAD via a different route (the later
ticket state already contains all of it), rather than merely missing.

`git diff --cached HEAD` is consequently **empty** and `git status --porcelain` shows no
UU/AA/DU/UD/AU/UA lines. Per STEP 4 this was staged and left as-is — `--skip` was NOT
called, and `CHERRY_PICK_HEAD` (97327f55c1d75dfef7bf44d407e7b73949eef6e6) is intact for
`cherry_pick_finalize_resolution` to act on.

## Post-merge review flag

The enrichment asked that this file be flagged for post-merge review since intent was
unknown on one or both sides. Flagging here: REQ-154's ticket state on the reconcile
branch is the bundled 2026-08-31 version; the 2026-08-20 draft state carried by the
incoming working-branch commit was intentionally not restored.
