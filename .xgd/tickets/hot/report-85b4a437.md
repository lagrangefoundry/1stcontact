---
uid: report-85b4a437
id: REPORT-4318
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:18:44.224717+00:00'
updated_at: '2026-09-18T06:18:44.224717+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **AA (both added)**, intent/bookkeeping
  ticket (§2e; also §2b superset test). Resolved to the **HEAD (ours)** side via
  `git checkout --ours` + `git add --sparse` (path is outside the sparse cone on
  this reconcile branch, DOC-986 §2/§4.1).

  Both sides are the same ticket (`uid: bug-6612c4b7`, `id: BUG-37`, identical
  `created_by`/`created_at: 2026-08-24T21:06:08.727702+00:00`) at two different
  points in its own lifecycle:

  - **Incoming** (`4677b816` — `xgd(ticket): create bug bug-6612c4b7`,
    2026-08-24): the ticket's creation state. `status: draft`,
    `completed_at: null`, `last_field_updated: created_at`, body ends with
    "## Not started — Diagnosis only. No branch cut, no code written." Body is a
    *leading hypothesis* (dead `PREVIEWS` WeakMap exhausting isolate memory)
    plus three undecided candidate fixes.
  - **Ours / HEAD** (`xgd(ticket): update bug bug-6612c4b7`, `updated_at`
    2026-08-31): the resolved state. `status: free_and_reconciled`,
    `completed_at` set, plus fields the incoming side never had at all
    (`fields.commits` with three `working_sha` entries, `fields.version: 0.2.13`,
    `fields.bundled_in: bundle-78f4e2fe`, `fields.chat_comment`).

  Per-fact application of §2e rather than a whole-file coin flip: **every fact
  present on the incoming side is also present on the HEAD side, at a later
  value.** There is no field and no section that exists only on the incoming
  side. HEAD is a strict superset, and it is also the later-positioned side by
  timestamp (2026-08-31 > 2026-08-24), so both §2e tests select the same side.

  This holds for the body text too, which is the only place the two differ in
  substance. HEAD does not discard the incoming's narrative — it *carries it
  forward explicitly*, under a section headed "## Superseded — the original
  hypothesis, recorded because it was wrong", which names each claim from the
  incoming body and records the measurement that falsified it (render is ~2% of
  the request, not the cost centre; memory was never the mechanism; "Edit is the
  larger render" is false). Grafting the incoming's draft sections back in as
  live text would have reinstated a hypothesis the developer had already
  measured and rejected — that is the discard risk here, and it runs in the
  opposite direction to the usual one.

  No `fields.intent_uid` / `story_uid` / `capability_uid` was touched, and no
  content was introduced that is not on the HEAD side.

## Incoming changes preserved

No code/implementation files were in conflict — the incoming commit
`4677b816199d596f493093d78959d5e6c778d6a3` touches exactly one path
(`.xgd/tickets/hot/bug-6612c4b7.md`, 144 insertions, file creation).

The incoming commit's key change is the **existence of BUG-37 with that
identity**. Verified present in HEAD: same `uid`, same `id`, same `created_by`,
byte-identical `created_at`. It is present via a later route (the ticket was
subsequently updated through to `free_and_reconciled` on the reconcile branch),
not absent — STEP 3's redundant-vs-discarded distinction resolves to
**redundant**.

Consequently the staged tree is identical to HEAD (`git diff --cached HEAD` is
empty). Per STEP 4 this is not a failure and `--skip` was **not** called; the
cherry-pick sequencer state is left intact (`CHERRY_PICK_HEAD` verified still
present) for `cherry_pick_finalize_resolution` to detect the clean staged diff
and skip the commit itself.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the
grounds of a prior refactor, and no test function was deleted (no test files were
in conflict).

`git status --porcelain` after staging: empty. No `UU`/`AA`/`DU`/`UD` lines
remain; no conflict markers remain in the working-tree file.
