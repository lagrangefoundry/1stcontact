---
uid: report-d9bfb0eb
id: REPORT-5496
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:28:53.887983+00:00'
updated_at: '2026-09-29T07:28:53.887983+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — class **UU**, six conflict hunks.
  Classified under **STEP 2e — intent/bookkeeping ticket** (`bug-*`:
  user-authored, no intent-ledger narrative to replay; 2d does not apply,
  this is not a story/acceptance_criterion/capability ticket).

  Incoming cherry-pick is `b6b2cfc512` (2026-09-01 15:03 -0700), the
  commit that first fleshed BUG-43 out from its `(new ticket)`
  placeholder. HEAD's last touch of this file is `e8f9e7c85b5d`
  (2026-09-19 08:15 -0700) — 18 days later.

  Every one of the six hunks is the same shape: both sides state the
  **same fact differently**, and HEAD states it later. Per 2e that is a
  genuine conflict resolved by taking the later-positioned intent, per
  fact — which here is HEAD on all six:

  1. **Frontmatter status block** — incoming `status: draft`,
     `completed_at: null`, `updated_at: 2026-09-01T22:03:01Z`; HEAD
     `status: free_and_reconciled`, `completed_at: 2026-09-14T10:29:01Z`,
     `updated_at: 2026-09-19T15:15:28Z`. HEAD is the lifecycle state the
     ticket actually reached.
  2. **`fields:` tail** — HEAD adds `commits`, `version: 0.2.40`,
     `bundled_in: bundle-8e1807f6`; incoming has no counterpart. HEAD is
     a strict superset here.
  3. **Symptom** — HEAD adds the operator's manual-refresh confirmation
     that localises the fault to the panel. Superset.
  4. **Root cause** — "when the assistant **writes**" (HEAD) vs "when an
     assistant **turn ends**" (incoming).
  5. **Fix / What is wanted** — incoming specifies **one final
     `site_changed` event after the model's stream**; HEAD specifies a
     signal **emitted per write**, re-reading the counter after every
     `tool_activity`, plus a new "What is wanted" section and the
     callback-throws-is-swallowed guarantee.
  6. **Test plan** — incoming asserts one end-of-turn frame; HEAD asserts
     one frame *per write*, interleaved, plus a third **app** bullet.

  Hunks 4–6 are not drift: HEAD's own "What is wanted" section explicitly
  revises the incoming design, in as many words — "emitted per write
  **rather than once at the end of the turn**, so that a request answered
  by several edits shows the page unfolding as the assistant works rather
  than jumping to a finished state when it stops talking." Incoming is
  the superseded draft of a decision HEAD already recorded as remade.

  Resolved with `git checkout --ours`, staged with `git add --sparse`
  (plain `git add` is refused for paths outside the 11% sparse-checkout
  cone, DOC-986 §2/§4.1). Each git write issued as the sole content of
  its own call per BUG-1294. `grep -c` for conflict markers returns 0.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-360c5a44.md` — **confirmed.** The incoming
  commit's two genuinely-new facts merged cleanly outside the conflict
  markers and are present in the resolved file:
  - `title: 'Builder preview: the frame is never reloaded after an
    assistant turn'` (line 5)
  - `severity: high` (line 17, in `fields:`)

  Everything else incoming contributed is prose that HEAD carries in a
  later, deliberately-revised form (hunks 4–6 above), or lifecycle
  scalars HEAD has since moved past (hunk 1). No incoming fact was
  discarded that HEAD does not already state more recently.

No hunks were dropped under the BUG-1301 precedence exception. No code
files, UAT tests, or spec tickets were involved in this conflict.

## Staging state

`git status --porcelain` is empty; `git status` reports "all conflicts
fixed" with the cherry-pick still in progress (CHERRY_PICK_HEAD intact
for the next workflow step). No `--continue` / `--skip` / `--quit` /
`--abort` was invoked.

Note for finalize: the resolution is byte-identical to HEAD, so the
staged diff for `b6b2cfc512` is empty — this cherry-pick is an empty
commit. Per STEP 4 it was left staged rather than skipped here; the
finalize step's clean-staged-diff detection should handle it.
