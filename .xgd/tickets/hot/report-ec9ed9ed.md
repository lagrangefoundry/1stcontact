---
uid: report-ec9ed9ed
id: REPORT-3068
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:52:15.932631+00:00'
updated_at: '2026-08-31T20:52:15.932631+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

Cherry-pick c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b ("xgd(ticket): update bug
bug-db356ff8", authored 2026-08-23 18:48:30 -0700), scope path
.../cherry_pick_one_attempt/38/0. One conflicted path — the same ticket as
attempt 37/0, at the next commit in the incoming series.

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — class **UU**, intent/bookkeeping ticket
  (STEP 2 rule **2e**). Outside the sparse-checkout cone, so resolved with
  `git checkout --ours --` then `git add --sparse --`.

  The incoming commit is frontmatter-only (5 insertions, 4 deletions; no body
  or code content). Resolved **per fact**:

  | Fact | Base | Ours (HEAD) | Theirs (incoming) | Taken | Why |
  |---|---|---|---|---|---|
  | `last_field_updated` | body | status | status | status | both sides made the same change |
  | `fields.story_points` | absent | 3 | 3 | 3 | both sides added it identically |
  | trailing newline | present | removed | removed | removed | both sides agree |
  | `updated_at` | 2026-08-24T01:48:23 | **2026-08-26T17:36:27** | 2026-08-24T01:48:29 | ours | genuine per-fact conflict; ours is later |
  | `status` | draft | **bundled** | free_coding | ours | genuine per-fact conflict; see below |
  | `fields.commits`, `fields.version` (0.2.10), `fields.bundled_in` (bundle-78f4e2fe) | absent | added | absent | ours | addition only HEAD made |

  Only two facts were genuinely contested, and both resolve to HEAD under the
  enrichment block's stated rule ("Intent unknown on one or both sides. Take the
  more recent commit by timestamp"): the HEAD-side commit is `7a8d0abd`
  (`seed_local_overlay`, 2026-08-31 07:24:26 -0700) against the incoming's
  2026-08-23 18:48:30 -0700, and the ticket's own `updated_at` agrees
  (2026-08-26 vs 2026-08-24). `xgd working-timeline` was not consulted because
  the enrichment reports intent unknown on at least one side, which is exactly
  the case that rule covers.

  On `status` specifically, the two values are not rival labels but successive
  positions in one lifecycle: `draft → free_coding → … → bundled`. HEAD's
  `bundled` is downstream of the incoming's `free_coding`, and HEAD carries the
  matching `bundled_in: bundle-78f4e2fe` / `commits` / `version` fields that only
  exist at that stage. Taking `free_coding` would have rewound the ticket behind
  the bundle that currently contains it and orphaned those three fields.

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched; no content
  absent from both sides introduced.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is
a bookkeeping ticket, and this commit touched only its frontmatter. Verified
against `git show c1d2a2ff -- .xgd/tickets/hot/bug-db356ff8.md`, the incoming
commit's changes appear in the resolved file as follows:

- `last_field_updated: status` — present, line 11.
- `fields.story_points: 3` — present, line 19.
- trailing-newline removal — present.
- `status` advanced past `draft` — present, and further advanced: HEAD holds
  `bundled` (line 12), downstream of the incoming's `free_coding`.
- `updated_at` bumped — present, at HEAD's later value `2026-08-26T17:36:27`
  (line 9) rather than the incoming's `2026-08-24T01:48:29`.

The last two are per-fact timeline outcomes on two mutually exclusive scalars,
not discarded developer work: the incoming's intent (advance this ticket's
lifecycle out of `draft` and record its story points) is present in HEAD in a
strictly more advanced form. Nothing developer-authored is missing.

No hunk was dropped under the BUG-1301 precedence exception; no test file was
involved and no test function on either side was deleted.

## Note for the finalize step

The staged tree is identical to HEAD (`git diff --cached --stat HEAD` empty) —
the BUG-1109/BUG-1122 redundant-commit case again, for the same reason as
attempt 37/0: HEAD's `seed_local_overlay` commit already carries this ticket's
content, and HEAD then advanced it past the state this commit was recording.
Per STEP 4, `--skip` was NOT called; the sequencer is untouched and
`CHERRY_PICK_HEAD` still reads c1d2a2ff872a6fcda07f1f2e7c8d1ec51fa87f1b.
Finalize should detect the clean staged diff and skip the commit.
