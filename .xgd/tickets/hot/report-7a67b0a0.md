---
uid: report-7a67b0a0
id: REPORT-4117
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:50:27.570283+00:00'
updated_at: '2026-09-12T19:50:27.570283+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — class **UU**, sparse-excluded
  (index-only conflict, no working-tree markers). Rule **2e** (intent /
  bookkeeping ticket, per-fact timeline resolution). Resolved **take ours
  (HEAD)**; staged with `git add --sparse`.

  The conflict was confined to four frontmatter lines; the Markdown body was
  byte-identical on both sides (git's 3-way merge produced no non-marker hunks).

  | | ours (HEAD) | theirs (incoming `486ef694e0`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `updated_at` | `2026-08-31T19:19:38Z` | `2026-08-25T22:52:42Z` |
  | `completed_at` | `2026-08-31T19:19:38Z` | `null` |

  This is a single fact (the ticket's lifecycle status) changed on both sides,
  so the timeline rule applies. The incoming side's own ledger — `xgd ticket
  history bug-db356ff8 --rev 486ef694e0` — is `draft → free_coding →
  free_coded → ready_to_reconcile (Aug 25)`, and `ready_to_reconcile` is its
  terminal position. HEAD's ledger picks up strictly downstream of that:
  `seed_local_overlay` (`7a8d0abd29`, Aug 31) imported the ticket already at
  `bundled`, and `56ced613a4` (Aug 31) advanced it to `free_and_reconciled`
  with `completed_at` set. HEAD is therefore the later-positioned intent for
  this fact, and applying theirs would have rewound the ticket six days and
  cleared `completed_at`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is
a bookkeeping ticket.

The staged resolution nets to **no diff vs HEAD** (`git diff --cached --stat`
is empty). Per STEP 4 this is not a failure, and STEP 3's discriminator
confirms it is the *redundant* case rather than the *discarded* case:

- The incoming commit's only substantive change is advancing `status` from
  `free_coded` to `ready_to_reconcile`. That advance is already subsumed by
  HEAD, which sits two lifecycle steps further along (`bundled` →
  `free_and_reconciled`) — bundling is exactly what consumes a
  `ready_to_reconcile` ticket, and this very run (`bundle-8e1807f6` /
  `reconcile-BUNDLE-27`) is that bundle.
- The literal string `ready_to_reconcile` never appears in HEAD's history for
  this file (`git log -S` returns nothing) because the overlay seed jumped
  `draft → bundled` in one commit rather than replaying each intermediate
  status. That is an artefact of overlay seeding, not evidence of a dropped
  transition.
- Everything else in the incoming commit (the entire ticket body) is already
  present in HEAD verbatim, carried in by the same overlay seed.

No BUG-1301 precedence exception was invoked; nothing was deleted.

Cherry-pick sequencer state left intact: `CHERRY_PICK_HEAD` still resolves to
`486ef694e0ce9d8ffab58fe8a8b55493f38b4861`. No `--continue` / `--skip` /
`--abort` / `reset` was run.
