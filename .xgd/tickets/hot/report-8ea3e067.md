---
uid: report-8ea3e067
id: REPORT-4151
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:13:37.698401+00:00'
updated_at: '2026-09-13T22:13:37.698401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. Two conflict regions, resolved per-fact.
  Markers edited out by hand rather than `git checkout --ours`, so hunks git had
  already auto-merged from the incoming side survived. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone).

  Incoming commit: `76cd837f38` (2026-08-31 14:18:30 -0700), message *"content
  edit: correct the prerequisite — REQ-104 is on xgd-working; only the shared
  artifact store is stale, so bin/install is the whole fix"*.

  **The message overstates this commit's diff.** `git show --stat` confirms it
  touches only this one file, and its diff against its own parent is 3
  insertions / 3 deletions with **no prose change at all**:
    1. `updated_at` bumped to `2026-08-31T21:18:30Z`
    2. `last_field_updated: status` → `body`
    3. re-addition of the trailing newline at EOF

  The prose the message describes lives in the sibling commit `1e28c676bf`
  (2026-08-31 14:18:42, twelve seconds later, identical message), which is the
  commit that actually swaps `resync-577be0d7`/`a60537ee3c` for `fad535e8a4` —
  established in this bundle's attempt 92 via `git log -S` on both sides'
  distinctive strings. HEAD already carries that corrected prerequisite text, so
  nothing about the announced correction is at stake in this resolution.

  HEAD side: the same ticket at `status: free_and_reconciled`, `result: pass`,
  `updated_at` 2026-09-02 01:34Z, with a "What landed (free-coded)" section.

  Per-region resolution:

  1. **Frontmatter** — same fields both sides. Later-positioned side wins: HEAD
     (2026-09-02, `free_and_reconciled`, `completed_at` set) over incoming
     (2026-08-31 21:18Z, `free_coding`, `completed_at: null`). As in the
     preceding attempt this is a superseded lifecycle position rather than a
     competing claim — `free_and_reconciled` is downstream of `free_coding`.
  2. **Tail after `## Implementation notes carried from review`** — HEAD side is
     the blank line, `---`, and the "What landed (free-coded, 2026-08-31)"
     section through the operator note; **the incoming side of this region is
     empty** (incoming's file ends at the `MIGRATIONS` line, which sits above
     the conflict and auto-merged). Nothing from incoming to preserve; kept
     HEAD. The shared `MIGRATIONS` line is present exactly once (L729).

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched. No content
  invented that was not on one side.

## Incoming changes preserved

Verified against `git show 76cd837f38 -- .xgd/tickets/hot/request-13a5e206.md`.
All three of the incoming commit's changes are accounted for:

- **`last_field_updated` / `updated_at`** — superseded, not discarded. HEAD
  stands at `last_field_updated: result` / 2026-09-02 with
  `status: free_and_reconciled` (L11), downstream of the `free_coding` position
  this commit records. Taking HEAD keeps the furthest-advanced state rather than
  rewinding to an intermediate one.
- **Trailing-newline re-addition at EOF** — not applicable to the resolved file,
  and not a discard. Incoming re-adds a newline after `  explicit `MIGRATIONS`
  list.`, which is its *final* line; in HEAD that line is mid-file (L729) and
  the file ends 115 lines later on "Cloudflare does not.", which HEAD ends
  without a trailing newline. Since the tail is HEAD's content, HEAD's EOF
  convention governs. The marker edits reintroduced a newline there, stripped
  with `perl -i -pe 'chomp if eof'` before staging.
- **The prose correction named in the commit message** — absent from this
  commit's diff entirely (see above); carried by sibling `1e28c676bf`, and
  already present in HEAD.

No hunks dropped under the BUG-1301 precedence exception; none applied here.

## Note on the staged diff

The resolution nets to **no diff vs HEAD**. Redundant-commit case
(BUG-1109/BUG-1122), not a discard: STEP 3's test is whether the incoming
commit's key changes are *present* in HEAD rather than absent, and the metadata
transition it records has been made and advanced past. Staged and exiting
`@done`; `--skip` not called. `CHERRY_PICK_HEAD` still reads
`76cd837f383bddc490cb33eba89fa98ccfb6769f` for
`cherry_pick_finalize_resolution`.

Cross-attempt observation: attempts 90–94 of this bundle have each netted to
zero against HEAD for this same ticket, consistent with the seeded overlay
(`8b5aa7c1ec xgd(ticket): seed_local_overlay request request-13a5e206`) having
already placed the ticket's final state on the branch.
