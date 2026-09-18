---
uid: report-c9a843c8
id: REPORT-4319
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T06:22:13.501222+00:00'
updated_at: '2026-09-18T06:22:13.501222+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` (BUG-37) — class **UU**, intent/bookkeeping
  ticket → rule **2e**, resolved per-fact by working-timeline position. Result:
  ours (HEAD) side taken for every conflicted fact; `git checkout --ours` +
  `git add --sparse`. Nets to **no diff vs HEAD** (redundant, not discarded —
  see below).

## Per-fact resolution

Three conflict regions, all of them the same fact-pair at two different
working-timeline positions:

| region | ours (HEAD) | theirs (`fe97d3bc34`, authored 2026-08-24T21:06:15Z) |
|---|---|---|
| `updated_at` / `completed_at` / `last_field_updated` / `status` | `2026-08-31T19:19:36Z`, completed, `status: free_and_reconciled` | `2026-08-24T21:06:15Z`, `completed_at: null`, `status: draft` |
| `fields` | `chat_comment`, `commits` (3 entries), `version: 0.2.13`, `bundled_in: bundle-78f4e2fe` | `fields.title` only (duplicate of the top-level `title:`) |
| body tail (`## Relationship to BUG-36`) | ends at "BUG-36 neither caused this nor fixes it." | same text reflowed, plus `## Not started — Diagnosis only. No branch cut, no code written.` |

The incoming commit is the ticket's **second** commit ever — `4677b81619`
created it at `21:06:08Z`, `fe97d3bc34` updated the title 7 seconds later. Every
fact it carries was superseded by the developer's own later work on the same
timeline, and HEAD already holds that later state.

## Incoming changes preserved

Not a code file, so no code hunks are at stake. Evidence that nothing developer-
authored is discarded — the incoming facts were superseded **on the incoming
branch itself**, not by this resolution:

- `git show xgd-working:.xgd/tickets/hot/bug-6612c4b7.md` (the working branch
  that contains `fe97d3bc34`) is **identical** to the ours side: same
  `updated_at: 2026-08-31T19:19:36Z`, same `status: free_and_reconciled`, same
  `commits`/`version`/`bundled_in`, **no** `fields.title`, and **no**
  `## Not started` section. So the working timeline itself deleted
  `fields.title` and the `## Not started` section, and moved the status
  `draft → bundled → free_and_reconciled`.
- HEAD's own copy entered this branch via `501a0595d1`
  (`xgd(ticket): seed_local_overlay`, 2026-08-31), which already carried the
  post-supersession state (`status: bundled`, `updated_at: 2026-08-26T17:36Z`,
  no `fields.title`). Five subsequent HEAD-side ticket updates advanced it to
  `free_and_reconciled`.
- The one fact the incoming side uniquely asserted — the ticket title — is
  preserved byte-identically in the ours side's top-level `title:` field.
  `fields.title` was a redundant duplicate that the ticket's own later timeline
  position dropped; restoring it would revert a later developer-side removal, so
  2e's "apply both" does not govern here (the field is not untouched-on-ours, it
  is removed-later-on-theirs-own-branch).
- Ours stage-2 blob `f3b9d25b` equals `HEAD:.xgd/tickets/hot/bug-6612c4b7.md`,
  so the resolved file is exactly the current, reconciled ticket state.

No BUG-1301 precedence exception was invoked. No UAT/test files in this
conflict. No `fields.intent_uid` / `story_uid` / `capability_uid` touched, and
no content invented.

## State on exit

- `git ls-files -u` → empty.
- `git diff --cached HEAD` → empty (redundant commit per BUG-1109/BUG-1122;
  finalize will skip the commit).
- `CHERRY_PICK_HEAD` → `fe97d3bc344f6b637416ce69b5e6043fe3759e10`, still present
  and untouched for `cherry_pick_finalize_resolution`.
