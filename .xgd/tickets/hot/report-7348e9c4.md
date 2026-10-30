---
uid: report-7348e9c4
id: REPORT-5491
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:15:43.339018+00:00'
updated_at: '2026-09-29T07:15:43.339018+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e: `request-*`, user-authored, no ledger-replay narrative).
  Two conflict regions: the frontmatter status block and the body tail
  after `## Origin`. **HEAD is a strict superset of incoming on both** —
  resolved by keeping the superset (HEAD).

  Staged via `git checkout --ours` + `git add --sparse` (path is outside
  the sparse-checkout cone — 11% checkout, DOC-986 §2/§4.1 — so plain
  `git add` was refused).

  Detail:
  - **Frontmatter**: HEAD `status: bundled` / `completed_at: 2026-09-14` /
    `updated_at: 2026-09-16` vs incoming `status: draft` / `completed_at: null` /
    `updated_at: 2026-09-01`. Same fields changed on both sides, so the
    later-positioned intent wins per 2e — that is HEAD. Taking incoming
    would have regressed a bundled, completed ticket back to draft.
  - **Body tail**: HEAD carries six post-implementation sections absent from
    incoming (`## What the codec must do, precisely`,
    `## Sequencing, revisited: AC5 is not deliverable yet`,
    `## A finding AC4 turned up`,
    `## One honest caveat about "the last native dependency"`).
    Incoming adds nothing here — its file ends at `## Origin`. Additive on
    HEAD only, so kept.

## Incoming changes preserved

Incoming commit `da7fe401e6` ("content edit: record the dependency-free
hand-rolled PNG decision…") is a **body edit whose entire payload is already
present verbatim in HEAD**. Verified by reading `git show da7fe401e6` hunk by
hunk against the resolved file — every section it introduces is present:

| Incoming hunk | Present in resolved file |
|---|---|
| `## The decision: hand-rolled, dependency-free` | line 61 |
| `## Formats: PNG is the whole of this path, deliberately` | line 73 |
| `### Consequence: non-PNG input is refused, not silently mishandled` | line 96 |
| exact-equality rewording under *What must not move* | lines 110–111 |
| `## Shape: a pure core the Worker can import` | line 126 |
| AC2 rewrite (decoded pixels byte-identical, DEFLATE not canonical) | lines 135–139 |
| AC4 rewrite (narrowed to **arithmetic cores**) | lines 142–145 |
| `## Deferred: streaming row-lockstep decode` | line 150 |

No incoming hunk was dropped. The BUG-1301 precedence exception was not
needed and was not invoked — nothing was deleted, and no test function was
touched by this conflict.

## Resulting state

Staged tree is byte-identical to HEAD for this path, so this cherry-pick
carries no net change — the incoming content reached the branch through a
later commit already on it. Per STEP 4, `--skip` was NOT called; the tree is
staged, `CHERRY_PICK_HEAD` is intact at `da7fe401e6`, and Python's finalize
step will detect the empty staged diff.
