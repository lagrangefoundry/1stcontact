---
uid: report-7b20123f
id: REPORT-2718
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:47:41.632677+00:00'
updated_at: '2026-08-31T05:47:41.632677+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-18a48d63.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule **2e**, resolved per-fact; enrichment rule "take the more recent commit by
  timestamp" concurs). Resolved to **ours (HEAD side)** via
  `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout cone —
  DOC-986 §2/§4.1, conflict existed in the index only, no working-tree markers).

  **Why AA at all**: incoming-side commit `0d11a01` (`xgd(resync): strip .xgd/tickets ...`,
  BUG-904) deleted the file from the main snapshot, and `fb1d4d6` re-added it; HEAD side
  independently re-added it via `209bea1` (`seed_local_overlay`). Same ticket, two
  independent (re-)additions.

  **Per-fact resolution** — the two sides differ *only* in frontmatter bookkeeping; the
  entire ticket body (§1–§4, 265/267 lines) is byte-identical. Every differing fact is
  later-positioned on ours:
  | Fact | Ours (HEAD, `209bea1` @ 2026-08-30 22:06) | Theirs (`fb1d4d6` @ 2026-08-23 12:41) | Kept |
  |---|---|---|---|
  | `updated_at` | 2026-08-24T02:10:41Z | 2026-08-17T20:06:08Z | ours (later) |
  | `status` | `bundled` | `ready_to_reconcile` | ours (later lifecycle state) |
  | `fields.commits` | `7ebc721b` consolidated into `working_sha_history` of the live entry | `7ebc721b` still a separate entry | ours (later consolidation; sha retained, not lost) |
  | `fields.bundled_in` | `bundle-b3b7c399` | absent | ours (superset) |

  Taking theirs would have reverted `status` to `ready_to_reconcile` and dropped
  `bundled_in: bundle-b3b7c399` — i.e. un-bundled the very ticket this reconcile run is
  processing. No content was invented; no field was touched beyond what one side already
  declared.

## Incoming changes preserved

- `.xgd/tickets/hot/request-18a48d63.md` — no code files were in this conflict. The
  incoming commit `fb1d4d6`'s change to this path is the full 268-line re-addition of the
  ticket. Its substantive content (the entire narrative body) **is present verbatim** in the
  resolved file; the only incoming lines absent are the four superseded bookkeeping values
  in the table above, each of which HEAD carries in a strictly later state. Nothing was
  discarded — this is STEP 3's "present via a different route" (redundant), not "genuinely
  absent" (discarded). No BUG-1301 precedence exception was needed.

## Staging state

`git status --porcelain` reports no remaining conflict classes. The staged diff vs HEAD is
empty for this commit (BUG-1109/BUG-1122: HEAD already carries this commit's effect via the
`seed_local_overlay` route). Per STEP 4 this was staged and left for
`cherry_pick_finalize_resolution` to skip — `--skip`/`--continue`/`--abort` were **not**
called, and `CHERRY_PICK_HEAD` (`fb1d4d621e89fd00a44a8a73e114b2bf7de35bb2`) is intact.
