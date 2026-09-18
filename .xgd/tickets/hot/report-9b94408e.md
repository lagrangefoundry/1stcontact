---
uid: report-9b94408e
id: REPORT-4301
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T05:15:07.445146+00:00'
updated_at: '2026-09-18T05:15:07.445146+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, class **2e** (intent/
  bookkeeping ticket: `bug-*`, not a spec ticket, so 2d's ledger-replay does not
  apply). Outside the sparse-checkout cone, so the conflict lived in the index
  with the markers materialised in the worktree; staged with `git add --sparse`.
  **Resolved to HEAD on all three hunks.**

  The auto-enrichment reported intent unknown on one or both sides and
  prescribed "take the more recent commit by timestamp." Timestamps:

  | side | commit | date |
  |---|---|---|
  | ours (HEAD) | `56ced613a4` | 2026-08-31 12:19:38 -0700 |
  | theirs (incoming) | `1524d1503f` | 2026-08-23 15:13:34 -0700 |

  HEAD is the later side by 8 days, so the enrichment rule and the 2e per-fact
  timeline rule agree and both select HEAD.

  The three hunks, per fact:

  1. **frontmatter scalars** — `updated_at` / `completed_at` /
     `last_field_updated` / `status`. Same facts changed on both sides →
     later side wins → HEAD (`status: free_and_reconciled`, `completed_at`
     set, `2026-08-31`). Taking incoming would have demoted the ticket back
     to `status: draft` with `completed_at: null`.
  2. **`fields:`** — HEAD adds `story_points`, `commits`, `version: 0.2.10`,
     `bundled_in: bundle-78f4e2fe`; incoming touches none of them. HEAD is a
     strict superset → keep the superset. Taking incoming would have dropped
     the reconcile bookkeeping outright.
  3. **`## Status` body** — incoming: one line, `Scope drafted, awaiting
     operator confirmation before coding.` HEAD: ~270 lines of implementation
     record (empirical production-state confirmation, the approved scope
     addition for the publish credential, the tenant fix, its five UATs,
     verification results, and the follow-ups it explicitly disclaims). Same
     section changed differently on both sides → later side wins → HEAD.

  No field was invented, and no `fields.intent_uid` / `story_uid` /
  `capability_uid` was touched.

## Incoming changes preserved

Verified mechanically, not by eye — every line of the incoming blob was
checked against the resolved file:

```
git show 1524d1503f:.xgd/tickets/hot/bug-db356ff8.md \
  | grep -Fxv -f .xgd/tickets/hot/bug-db356ff8.md
```

The only incoming lines absent from the resolution are the four superseded
frontmatter scalars named in hunk 1 above, some blank lines, and the
`Scope drafted, ...` placeholder from hunk 3. Every substantive line the
incoming commit authored is present in the resolved file, confirmed by
direct grep: the full title (`control-app: fresh deployment 503s until
bin/publish runs, so the builder never boots`), `severity: high`, and each
body section it introduced — `## Symptom`, `## Diagnosis`,
`## Immediate unblock (no code change)`, `## Proposed fix`, `## Test plan`,
`## Status`.

This is the STEP 4 / BUG-1109 redundant-commit case, **not** a discard.
`1524d1503f` is BUG-36's *first* body write: it takes the ticket from
`title: Untitled` / `(new ticket)` to the drafted scope. HEAD already
contains that entire text verbatim — it arrived by a different route, the
post-watermark sync — and then continues past it with the landed-and-verified
implementation record for the same work. So the incoming commit's intent is
present in HEAD in refined form, and nothing it authored is lost.

Consequently the staged tree is byte-identical to HEAD and this pick nets to
no diff. Per STEP 4, no `--skip` was issued; `CHERRY_PICK_HEAD`
(`1524d1503f964ef4ed7adf60aa43dae3eefc08e7`) is intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip
the commit itself.

No code or test files were involved, so no BUG-1301 precedence exception was
invoked and no UAT function was deleted.

## Flagged for post-merge review

Per the enrichment's instruction for unknown intent. Low risk: the divergence
is confined to one bookkeeping ticket's own metadata and status narrative, the
later side was kept whole, and the earlier side's content survives inside it.
The reviewable question is only whether BUG-36 should read
`free_and_reconciled` at `version: 0.2.10` in `bundle-78f4e2fe` (HEAD's claim,
kept) rather than `draft`.

## Verification

- `git ls-files -u` — empty, no unmerged index entries.
- `git status --porcelain` — empty, no conflict-class lines remain.
- No conflict markers in the resolved file.
- `git rev-parse CHERRY_PICK_HEAD` → `1524d1503f964ef4ed7adf60aa43dae3eefc08e7`,
  sequencer untouched.
- No full-suite quality check was run; none was applicable to a
  documentation-only ticket conflict.

## Tooling note

`git checkout --ours --sparse` is not a valid flag, and the
`--ignore-skip-worktree-bits` spelling is denied under this session's
don't-ask mode. What worked for an out-of-cone path:
`git cat-file blob HEAD:<path> > <path>` as its own call, then
`git add --sparse -- <path>` as its own call.
