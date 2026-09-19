---
uid: report-6d972e3e
id: REPORT-4396
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T11:10:44.672132+00:00'
updated_at: '2026-09-19T11:10:44.672132+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **AA** (both added), index-only (path is
  outside the sparse-checkout cone, DOC-986 §2/§4.1; no working-tree markers).
  Rule applied: **2e** (intent/bookkeeping ticket) — *one side is a strict
  superset of the other, keep the superset*. Resolved to the **ours (HEAD)**
  side via `git checkout --ours` + `git add --sparse`.

  Why ours: the incoming commit `3fc6491` (`xgd(ticket): create bug
  bug-3ade1af4`, 2026-09-01) is the bare 18-line creation stub —
  `title: Untitled`, `status: draft`, `completed_at: null`,
  `last_field_updated: created_at`, `updated_at` identical to `created_at`, and
  a body of `(new ticket)`. The ours side (`af0186b`, `xgd(ticket):
  seed_local_overlay bug bug-3ade1af4`, 2026-09-17) is the fully-developed
  BUG-40 ticket that descends from that same creation event — identical `uid`,
  `id`, `type`, `created_by` and `created_at` — carrying the real title, the
  full three-cause symptom/analysis body, `status: bundled`,
  `version: 0.2.33`, `bundled_in: bundle-8e1807f6`, the `commits` list, and
  `chat_comment` / `severity` / `story_points`.

  The two sides are not competing over any fact. There is no field where each
  side asserts a different value for the same thing: every divergence is a
  creation-time placeholder on the incoming side against the advanced value on
  ours. Both the superset test and the enrichment's timeline rule (take the
  more recent commit) select ours. Taking theirs would have reverted BUG-40 to
  an untitled draft stub and destroyed the entire ticket body.

## Incoming changes preserved

Not a code file, but the STEP 3 check was applied to the incoming diff in full.
`3fc6491` touches exactly one file (18 insertions, single-file commit). Every
substantive fact it introduces is present verbatim in the resolved version:

- `uid: bug-3ade1af4` — present
- `id: BUG-40` — present
- `type: bug` — present
- `created_by: xgd` — present
- `created_at: '2026-09-01T19:01:30.821719+00:00'` — present, byte-identical
- `fields.auto_merge_back: true` — present
- `fields.needs_review: false` — present
- `fields.priority: medium` — present

The only incoming lines absent from the resolution are the creation-time
placeholders that the ours side supersedes in the normal ticket lifecycle:
`title: Untitled`, `status: draft`, `completed_at: null`,
`last_field_updated: created_at`, the `updated_at` echo of `created_at`, and
the `(new ticket)` body. These are not developer content being discarded —
they are the default values the `create` operation emits, which every
subsequent edit to the ticket is expected to overwrite.

This is therefore the redundant case described in STEP 4 (BUG-1109/BUG-1122),
not the discarded case: the incoming commit's key change — the existence of
BUG-40 with those identifying facts — is already present in HEAD via the
seed_local_overlay route. The staged tree consequently shows no diff vs HEAD.
Per STEP 4 no `--skip` was issued; the resolution is staged and
`CHERRY_PICK_HEAD` (`3fc6491`) is left intact for
`cherry_pick_finalize_resolution` to act on.

No BUG-1301 precedence exception was invoked. No UAT or test file was involved.

## Post-merge review flag

The enrichment classed this conflict as "intent unknown on one or both sides"
and asked that it be flagged for post-merge review. Flagging it here for
completeness, though the resolution is not in doubt: the incoming side is a
creation stub with no authored content, so there is no developer intent on that
side that could have been lost.
