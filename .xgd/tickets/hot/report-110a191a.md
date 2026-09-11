---
uid: report-110a191a
id: REPORT-4068
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:30:45.214929+00:00'
updated_at: '2026-09-11T22:30:45.214929+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, rule **2e**
  (intent/bookkeeping ticket: `bug-*`, user-authored content, not matrix state).
  Resolved to the **HEAD (ours)** blob via `git checkout --ours` +
  `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Three conflicted hunks, resolved per-fact rather than by picking a winner file:

  | Hunk | Ours (HEAD) | Theirs (incoming `1524d1503f`) | Rule applied |
  |---|---|---|---|
  | lifecycle fields (`updated_at`, `completed_at`, `last_field_updated`, `status`) | `2026-08-31T19:19:38Z`, completed, `last_field_updated: status`, `status: free_and_reconciled` | `2026-08-23T22:13:33Z`, `completed_at: null`, `last_field_updated: severity`, `status: draft` | same fact changed differently → **later-positioned intent wins** → ours (2026-08-31 > 2026-08-23) |
  | `fields:` additions (`story_points: 3`, `commits[]`, `version: 0.2.10`, `bundled_in: bundle-78f4e2fe`) | present | absent — incoming never touched these keys | **ours is a strict superset** → keep ours |
  | `## Status` body | full implementation record ("Both halves landed and verified", + Approved scope addition, + Implementation — the tenant fix) | `Scope drafted, awaiting operator confirmation before coding.` | same section changed differently → **later intent wins**; ours explicitly supersedes the incoming sentence |

  Enrichment metadata reported "intent unknown on one or both sides — take the
  more recent commit by timestamp." That was applied and it agrees: the HEAD-side
  commit is `56ced613a4` (2026-08-31 12:19:38 -0700); the incoming commit is
  `1524d1503f` (2026-08-23 15:13:34 -0700). Both carry the same bare subject
  (`xgd(ticket): update bug bug-db356ff8`) with no narrative body, so the
  timestamp was the only discriminator available for the competing facts.
  Flagged for post-merge review per that rule — though see below: the timestamp
  tiebreak turned out not to be load-bearing, because ours subsumes theirs.

## Incoming changes preserved

Verified with `git diff CHERRY_PICK_HEAD:<path> HEAD:<path>` — i.e. the full
delta from the incoming blob to the ours blob. **Ours is a strict superset of
theirs.** Every `-` line in that diff is one of the two competing facts named in
the table above; there is no third category. Nothing else the incoming commit
authored is missing.

The incoming commit's substantive additions are all present verbatim in the
resolved file, which is exactly why those hunks merged clean and never appeared
as conflicts:

- `title: 'control-app: fresh deployment 503s until bin/publish runs, so the
  builder never boots'` (incoming changed it from `Untitled`) — present.
- `fields.severity: high` — the field the incoming commit's own
  `last_field_updated: severity` names as its purpose — present (line 25,
  unconflicted).
- The entire ticket body the incoming commit wrote — `## Symptom`,
  `## Diagnosis` (including the two-opener table and the `TENANT_ID` argument),
  `## Immediate unblock (no code change)`, `## Proposed fix`, `## Test plan` —
  present byte-for-byte.

So the incoming commit's intent (fill in a stub ticket that was `title: Untitled`
/ body `(new ticket)`, and set `severity: high`) had already reached this branch
through the post-watermark sync, and the HEAD-side commit then carried BUG-36
forward to `free_and_reconciled` on top of it.

No hunks were dropped under the BUG-1301 precedence exception; it did not arise.
No UAT test files were involved in this conflict.

## Net staged diff

`git diff --cached HEAD` is **empty** — this cherry-pick is redundant, not
discarded. Per STEP 3 that distinction is decided by whether the incoming
commit's key changes are present in HEAD, and they are (enumerated above), not
merely absent. Per STEP 4 this is explicitly not a @fail condition and not a
reason to call `--skip` (BUG-1109/BUG-1122): the tree is staged and left for
`cherry_pick_finalize_resolution` to detect and skip.

`CHERRY_PICK_HEAD` (`1524d1503f964ef4ed7adf60aa43dae3eefc08e7`) confirmed still
present after staging. No `--continue` / `--skip` / `--quit` / `--abort` /
`reset` / `checkout <branch>` was issued; the only git writes were
`checkout --ours` and `add --sparse` on the single conflicted path.
