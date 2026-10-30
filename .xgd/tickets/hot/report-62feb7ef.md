---
uid: report-62feb7ef
id: REPORT-5687
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T07:15:27.090537+00:00'
updated_at: '2026-09-30T07:15:27.090537+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — `1c9f59d330`

Cherry-picked commit `1c9f59d330` ("xgd(ticket): update request request-8b33a146",
author 2026-09-14 03:29:05, +3/-3) onto `resync-377b581e` at HEAD `f9477a9cd0`.
Apply target `9ac98712a708888db67f8aff21f22b16bd98094e`. Anchor `report-377b581e`.
`prior_stage_failure` empty.

## Files resolved

| path | class | resolution | net change |
| --- | --- | --- | --- |
| `.xgd/tickets/hot/request-8b33a146.md` | `UU` | `--ours` | none |

Index stages: base `ed24a4ce42`, ours `284e1e08f9`, theirs `590b1b9da3`.

Two free sanity checks both pass, confirming this pick is the next item of the
series forecast in REPORT-5621:

- the base blob `ed24a4ce42` **is** the previous pick's *theirs* blob (the queue
  walks this path in commit order);
- ours `284e1e08f9` is unmoved — byte-identical to `HEAD:.xgd/tickets/hot/request-8b33a146.md`,
  which proves the previous zero-net-change resolution really netted to nothing.

## Incoming changes preserved

Theirs' entire delta from base is three frontmatter facts, and **two of the three
are already present on ours byte-identically**:

| fact | base | theirs | ours | outcome |
| --- | --- | --- | --- | --- |
| `completed_at` | `null` | `2026-09-14T10:29:05.317898+00:00` | `2026-09-14T10:29:05.317898+00:00` | identical — nothing to adjudicate |
| `status` | `bundled` | `free_and_reconciled` | `free_and_reconciled` | identical — nothing to adjudicate |
| `updated_at` | 2026-09-11T18:53:54 | 2026-09-14T10:29:05 | 2026-09-19T15:15:29 | ours leads by 5 days |

So `git diff <theirs> <ours>` is literally one frontmatter line plus a trailing
newline that ours adds. Ours already holds the picked commit's own output values —
`completed_at` to the microsecond and the exact `status` it sets — so no incoming
content is discarded by taking ours. The body (155 lines) is byte-identical on
both sides.

This is the same "theirs writes `completed_at` == its own `updated_at` in one
write" pattern recorded on `bug-360c5a44` / `ff482d9dcc` and on `bundle-8e1807f6`:
both sides are stamping the same reconcile event, and ours then continued past it
to 2026-09-19.

The enrichment's rule ("intent unknown on one or both sides — take the more recent
commit by timestamp") incidentally points the same way here, ours' `updated_at`
being the later of the two. The decisive evidence is the fact-by-fact comparison
above, not the timestamp.

Result: zero net change. `git status --porcelain` is completely empty after
`checkout --ours` + `add --sparse`; `CHERRY_PICK_HEAD` intact; HEAD unmoved at
`f9477a9cd0`. Finalize will skip the commit.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The resolution follows from ours already
carrying two of theirs' three written facts verbatim and leading on the third.

## Forecast for the remaining picks on this path

Both re-verified live against ours' (unmoved) blob `284e1e08f9`:

- `798a8a5ee0` (2026-09-15) — backward move to `status: bundled`, `updated_at`
  2026-09-16T01:48:39 < ours' 09-19. **`--ours`, zero net change.** Note the
  backward lifecycle move: a `bundled` on an intermediate pick is not evidence it
  precedes a `free_and_reconciled` one.
- tip `d1453db0b6` (2026-09-19) — **IS the exception.** Ours-vs-tip is exactly one
  line: `updated_at` 2026-09-19T15:15:37.349811 vs ours' 15:15:29.110241 (8.2 s
  later), every other field byte-identical. It wins that one fact.

Always run the ours-vs-tip diff rather than inferring the tip from lifecycle
status — ours holding the terminal state does not imply the tip matches.
