---
uid: report-9ab695f3
id: REPORT-4071
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:36:16.967374+00:00'
updated_at: '2026-09-11T22:36:16.967374+00:00'
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

  Incoming commit: `1a64efded18ac2cf82fd680afc1fb3af601a17fd`
  (2026-08-23 16:03:08 -0700). HEAD-side commit for this file:
  `56ced613a4b56626b0cc1460861816c5ed53ee22` (2026-08-31 12:19:38 -0700).

  Sequencer position 26. Positions 24 (`1524d1503f`) and 25 (`bcedebfb50`) hit
  the same file and also resolved to ours; both netted no diff and were skipped
  by finalize, so the HEAD-side blob is unchanged across all three rounds.
  `1a64efded1` is the developer's next edit, ~42 minutes after position 25's.

  **Two conflicted regions**, resolved per-fact:

  | Region | Ours (HEAD) | Theirs (`1a64efded1`) | Rule applied |
  |---|---|---|---|
  | lines 9–19: lifecycle fields (`updated_at`, `completed_at`, `last_field_updated`, `status`) | `2026-08-31T19:19:38Z`, completed, `last_field_updated: status`, `status: free_and_reconciled` | `2026-08-23T23:03:08Z`, `completed_at: null`, `last_field_updated: body`, `status: draft` | same fact changed differently → **later-positioned intent wins** → ours (2026-08-31 > 2026-08-23) |
  | lines 233–383: tail after "…so neither granted anything." | 148 lines: `## Implementation — landed and verified end to end`, `### A third finding`, `### The client secret was never printed into the session`, `# Implementation — the tenant fix` and its subsections through `## Still open, and NOT this ticket` | **empty** — nothing between the `=======` at 382 and the `>>>>>>>` at 383 | **ours is a strict superset**; theirs contributes nothing here → keep ours |

  The second region is a false conflict: the incoming blob ends at
  "…so neither granted anything." with no trailing newline, so git could not
  cleanly attribute ours' EOF append and marked the whole tail. Theirs adds
  nothing in that span, so nothing of the developer's is at stake in it.

  Everything else merged clean — the `fields:` block (ours' `story_points`,
  `commits[]`, `version: 0.2.10`, `bundled_in`, keys incoming never touched),
  and the `## Status` opening paragraph, which resolved to ours' "Both halves
  landed and verified" without conflict because this commit did not touch that
  line.

  Enrichment metadata reported "intent unknown on one or both sides — take the
  more recent commit by timestamp." Applied, and it agrees with the per-fact
  judgment. Both sides carry the same bare subject
  (`xgd(ticket): update bug bug-db356ff8`) with no `--commit-message` narrative,
  so timestamp was the only discriminator for the one genuinely competing fact.
  Flagged for post-merge review per that rule — though the tiebreak is not
  load-bearing, since ours subsumes theirs.

## Incoming changes preserved

Verified with `git diff CHERRY_PICK_HEAD:<path> HEAD:<path>`, filtered to
removals only — i.e. every line present in the incoming blob and absent from
ours. **Exactly five lines**, all accounted for by the first region above:

```
-updated_at: '2026-08-23T23:03:08.033794+00:00'
-completed_at: null
-last_field_updated: body
-status: draft
-Scope drafted, awaiting operator confirmation before coding.
```

(The fifth is the `## Status` sentence ours supersedes with "Both halves landed
and verified" — carried in the incoming blob from an earlier commit, not
authored by this one.) The remaining 163 lines of delta are all ours-side
additions. **Ours is a strict superset of theirs.**

This commit's substantive contribution was appending one section, and all of it
is present verbatim in the resolved file — which is why it merged clean rather
than conflicting:

- `# Approved scope addition — fix the publish credential (option A)` — the
  operator-approval note and scoping rationale.
- `## Why the API token cannot simply be swapped in` — the three credentials
  Access accepts at the edge, and why a Cloudflare API token is a different
  system that provisions rather than publishes.
- `## The change` — the full file-by-file plan (`bin/access-token`,
  `push.ts` with `CF-Access-Client-Id`/`CF-Access-Client-Secret` and
  `redirect: 'manual'`, `index.ts` flags, `bin/publish`, `ACCESS.md`, and the
  "No Worker change" note on `access.ts:256-259`).
- `## Note — two service tokens were created and revoked` — the accidental
  201s and their same-minute deletion.

So this commit's intent had already reached the branch via the post-watermark
sync, and the HEAD-side commit carried BUG-36 forward to `free_and_reconciled`
additively on top of it, appending the implementation records after this
section rather than replacing it.

No hunks were dropped under the BUG-1301 precedence exception; it did not arise.
No UAT test files were involved in this conflict.

## Net staged diff

`git diff --cached HEAD` is **empty** — redundant, not discarded. Per STEP 3
that distinction turns on whether the incoming commit's key changes are present
in HEAD, and they are (enumerated above), not merely absent. Per STEP 4 this is
explicitly not a @fail reason and not grounds to call `--skip`
(BUG-1109/BUG-1122): staged and left for `cherry_pick_finalize_resolution`.

Post-staging verification: `git status --porcelain` empty, zero conflict markers
remaining in the file, `CHERRY_PICK_HEAD`
(`1a64efded18ac2cf82fd680afc1fb3af601a17fd`) still present. No `--continue` /
`--skip` / `--quit` / `--abort` / `reset` / `checkout <branch>` was issued; the
only git writes were `checkout --ours` and `add --sparse` on the single
conflicted path.
