---
uid: report-6643b83e
id: REPORT-4150
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:10:52.789781+00:00'
updated_at: '2026-09-13T22:10:52.789781+00:00'
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

  Incoming commit: `8b6541d4b1` (2026-08-31 14:16:33 -0700), no free-text
  `--commit-message` body. Its diff against its own parent is 4 insertions /
  4 deletions, and is entirely a status transition plus a whitespace change:
    1. `updated_at` bumped to `2026-08-31T21:16:33Z`
    2. `last_field_updated: body` → `status`
    3. `status: draft` → `free_coding`
    4. removal of the trailing newline at EOF

  HEAD side: the same ticket at `status: free_and_reconciled`, `result: pass`,
  `updated_at` 2026-09-02 01:34Z, with a "What landed (free-coded)" section.

  Per-region resolution:

  1. **Frontmatter** — same fields changed on both sides. Later-positioned side
     wins: HEAD (2026-09-02, `free_and_reconciled`, `completed_at` set) over
     incoming (2026-08-31 21:16Z, `free_coding`, `completed_at: null`). Note
     this is not a competing claim but a *superseded lifecycle position*:
     `free_and_reconciled` is the downstream state of the very transition this
     commit performs (`draft` → `free_coding`), so HEAD already reflects the
     incoming intent having been carried out and moved past.
  2. **Tail after `## Implementation notes carried from review`** — the incoming
     side of this region is a single line, `  explicit `MIGRATIONS` list.`,
     which is the *same* line HEAD has; it appears in the conflict only because
     incoming makes it the file's final line with no trailing newline, whereas
     HEAD continues into `---` / "What landed (free-coded, 2026-08-31)" through
     the operator note. Kept HEAD. The shared line is preserved exactly once
     (verified at L729 — not duplicated by the resolution).

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched. No content
  invented that was not on one side.

## Incoming changes preserved

Verified against `git show 8b6541d4b1 -- .xgd/tickets/hot/request-13a5e206.md`.
Both of the incoming commit's changes are accounted for:

- **The status transition** — superseded, not discarded. The commit moves the
  ticket `draft` → `free_coding`; HEAD stands at `free_and_reconciled`
  (L11), which is downstream of `free_coding` on the same lifecycle. Taking
  HEAD keeps the ticket's furthest-advanced state rather than rewinding it to
  an intermediate one.
- **Trailing-newline removal at EOF** — present. HEAD and the incoming commit
  agree the file ends without a trailing newline. The marker edits reintroduced
  one, so it was stripped with `perl -i -pe 'chomp if eof'` before staging (same
  artifact as the three preceding attempts in this bundle).

The body prose is untouched by this commit, so there is no prose content to
preserve or lose here.

No hunks dropped under the BUG-1301 precedence exception; none applied here.

## Note on the staged diff

The resolution nets to **no diff vs HEAD** (`git diff --cached HEAD --stat`
empty). Redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's test
is whether the incoming commit's key change is *present* in HEAD rather than
absent, and here the status transition it performs has already been made and
advanced past. Staged and exiting `@done`; `--skip` not called.
`CHERRY_PICK_HEAD` still reads `8b6541d4b13686d35982b71ca7b688dcc2857cc8` for
`cherry_pick_finalize_resolution`.

Cross-attempt observation: attempts 90/91/92/93 of this bundle have each netted
to zero against HEAD for this same ticket, consistent with the seeded overlay
(`8b5aa7c1ec xgd(ticket): seed_local_overlay request request-13a5e206`) having
already placed the ticket's final state on the branch, leaving the individual
`ticket update` commits with nothing to apply.
