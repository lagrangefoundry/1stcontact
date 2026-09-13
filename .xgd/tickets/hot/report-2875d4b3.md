---
uid: report-2875d4b3
id: REPORT-4138
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:22:39.051480+00:00'
updated_at: '2026-09-13T21:22:39.051480+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — **UU**, sparse-excluded
  (`.xgd/tickets/**` is outside the cone, so the conflict existed only in the
  index; inspected via `git show :1:/:2:/:3:` and staged with `git add --sparse`).
  Rule applied: **2e (intent/bookkeeping ticket), per-fact composition** — the two
  sides touched disjoint facts, so both were applied rather than picking a winner's
  whole file.

  - Body (whole document): **incoming (theirs)**. The incoming commit
    `3b9156ae` (authored 2026-08-30 17:52:48 -0700, `last_field_updated: body`)
    reflows the prose — unwraps hard line breaks, switches `*em*` to `_em_`, and
    flattens the three markdown tables to one line per cell. Taken verbatim.
  - `status`: `ready_to_reconcile` → **`bundled`** (ours) and
    `fields.bundled_in: bundle-8eef3846` (ours) — the incoming side never touched
    either; both come from the bundling operation, which is the later op.
  - `updated_at` / `last_field_updated`: the only facts both sides changed
    differently. Ours (`2026-08-31T05:05:09.416379+00:00` / `status`) is later than
    incoming (`2026-08-31T00:52:48.576006+00:00` / `body`), so ours wins per fact,
    consistent with keeping ours' `status`/`bundled_in`.
  - Trailing newline at EOF: added (ours' only body-side change; incoming has
    "no newline at end of file").

  No `intent_uid` / `story_uid` / `capability_uid` field was touched, and no
  content absent from both sides was introduced.

## Incoming changes preserved

Verified before staging, in both directions:

- `diff theirs resolved` → the ONLY differences are the four frontmatter facts
  listed above plus the trailing newline. Every line of the incoming body edit
  (118 insertions / 156 deletions) is present verbatim in the resolution; the
  staged diff vs HEAD is exactly `118 insertions(+), 156 deletions(-)`.
- `diff ours resolved` → differences are confined to the body, i.e. the incoming
  reflow, with ours' frontmatter intact.

No hunk was dropped; the BUG-1301 precedence exception was not needed.

### Note for post-merge review (the enrichment asked for a flag)

Conflict enrichment reported "intent unknown on one or both sides", and
`xgd ticket history` is unavailable in this worktree (ticket store is
sparse-excluded on disk), so the decision rests on commit author dates and the
field-level diffs, both unambiguous here. Worth knowing why this conflict exists
at all:

- `bc62f285` (author 2026-08-30 17:52:48, 118+/156-) is **the same reflow as the
  incoming commit** and is already in this branch's history.
- `08e9358bc5` (author **2026-08-28** 09:40:51, committed 2026-09-12, 156+/118-)
  sits topologically *after* it and is its exact inverse — a replay of an
  earlier-authored commit landing after a later-authored one, which is what
  re-wrapped HEAD's body and produced this conflict. `98ea6de3a7` is a second
  copy of that same Aug-28 edit.

So HEAD's wrapped body is out-of-order replay residue, not a deliberate later
retraction of the reflow; the Aug-30 reflow is the latest authored state of the
body and is what this resolution keeps. The body edit is cosmetic either way
(no facts, ACs or field values change), but the flattened tables in the incoming
version are a legibility regression a human may want to re-wrap deliberately.
