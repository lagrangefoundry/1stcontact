---
uid: report-0e7b345f
id: REPORT-4070
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:33:15.828020+00:00'
updated_at: '2026-09-11T22:33:15.828020+00:00'
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

  Incoming commit: `bcedebfb50ecf4208ef7ac0834cdee3af79236c9`
  (2026-08-23 15:21:10 -0700). HEAD-side commit for this file:
  `56ced613a4b56626b0cc1460861816c5ed53ee22` (2026-08-31 12:19:38 -0700).

  This is sequencer position 25 in the bundle. Position 24 picked
  `1524d1503f` against the same file and also resolved to ours; that pick netted
  no diff and was skipped by finalize, so the HEAD-side blob for this file is
  unchanged from the previous round. `bcedebfb50` is the developer's NEXT edit,
  eight minutes later in the working timeline.

  **Exactly two conflicted regions**, resolved per-fact rather than by picking a
  winner file:

  | Region | Ours (HEAD) | Theirs (`bcedebfb50`) | Rule applied |
  |---|---|---|---|
  | lifecycle fields (`updated_at`, `completed_at`, `last_field_updated`, `status`) | `2026-08-31T19:19:38Z`, completed, `last_field_updated: status`, `status: free_and_reconciled` | `2026-08-23T22:21:09Z`, `completed_at: null`, `last_field_updated: body`, `status: draft` | same fact changed differently → **later-positioned intent wins** → ours (2026-08-31 > 2026-08-23) |
  | `## Status` opening paragraph | "Both halves landed and verified (2026-08-23)… See **Implementation — the tenant fix** at the end." | "Scope drafted, awaiting operator confirmation before coding." | same section changed differently → **later intent wins**; ours explicitly supersedes the incoming sentence (the work it says is pending has since landed) |

  Everything else merged clean, including the `fields:` block (ours carries
  `story_points`, `commits[]`, `version: 0.2.10`, `bundled_in` — keys the
  incoming commit never touched) and the entire body from line 121 onward.

  Enrichment metadata reported "intent unknown on one or both sides — take the
  more recent commit by timestamp." Applied, and it agrees with the per-fact
  judgment above. Both sides carry the same bare subject
  (`xgd(ticket): update bug bug-db356ff8`) with no `--commit-message` narrative,
  so timestamp was the only discriminator available for the competing facts.
  Flagged for post-merge review per that rule — though, as below, the tiebreak
  is not load-bearing, because ours subsumes theirs.

## Incoming changes preserved

Verified with `git diff CHERRY_PICK_HEAD:<path> HEAD:<path>` — the full delta
from the incoming blob to the ours blob. **Ours is a strict superset of theirs.**
Every `-` line in that diff is one of the two competing facts named in the table
above; there is no third category. Nothing else `bcedebfb50` authored is missing.

This commit's substantive contribution was appending two sections to the ticket
body (its own `last_field_updated: body` names that as its purpose). All of it is
present verbatim in the resolved file — which is precisely why those hunks merged
clean and never surfaced as conflicts:

- `## Production state — confirmed empirically (2026-08-23)` — the D1 query
  results (`d1_migrations` = 2 rows, all six data tables zero rows) and the
  conclusion that schema is present and data absent.
- `### Interim production patch applied` — the
  `INSERT OR IGNORE INTO tenants …` SQL and the caveat that it is a one-off
  patch of production state, not the fix.
- `## Second finding — bin/publish --production cannot authenticate as written`
  — the `cf-access-jwt-assertion` analysis, the confirmed 302 to the Access
  login page, the empty `service_tokens` listing, through the closing
  "Needs its own ticket."

So this commit's intent had already reached the branch via the post-watermark
sync, and the HEAD-side commit then carried BUG-36 forward to
`free_and_reconciled` on top of it — additively, retaining every one of these
sections and appending the Approved-scope-addition and tenant-fix implementation
records after them.

No hunks were dropped under the BUG-1301 precedence exception; it did not arise.
No UAT test files were involved in this conflict.

## Net staged diff

`git diff --cached HEAD` is **empty** — this cherry-pick is redundant, not
discarded. Per STEP 3 that distinction turns on whether the incoming commit's key
changes are present in HEAD, and they are (enumerated above), not merely absent.
Per STEP 4 this is explicitly not a @fail reason and not grounds to call `--skip`
(BUG-1109/BUG-1122): staged and left for `cherry_pick_finalize_resolution`.

Post-staging verification: `git status --porcelain` empty, zero conflict markers
remaining in the file, `CHERRY_PICK_HEAD`
(`bcedebfb50ecf4208ef7ac0834cdee3af79236c9`) still present. No `--continue` /
`--skip` / `--quit` / `--abort` / `reset` / `checkout <branch>` was issued; the
only git writes were `checkout --ours` and `add --sparse` on the single
conflicted path.
