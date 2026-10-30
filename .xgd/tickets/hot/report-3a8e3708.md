---
uid: report-3a8e3708
id: REPORT-5688
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T07:18:58.543767+00:00'
updated_at: '2026-09-30T07:18:58.543767+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e

Picked commit: `db928873d00d25554dde453e392c363d34bf7b40`
(`xgd(ticket): update bug bug-034bf955`, author 2026-09-14 10:29:07)
HEAD: `f9477a9cd029192e3309fd7153b3e002b9372bff` (unmoved after resolution)
Anchor: `report-377b581e` · `prior_stage_failure`: empty

## Files resolved

One path, class `UU`, materialized:

| stage | blob |
| --- | --- |
| `:1:` base | `91ed8faee2` |
| `:2:` ours | `64c6c0f135` (== `HEAD:.xgd/tickets/hot/bug-034bf955.md`, unmoved) |
| `:3:` theirs | `77da6e144a` |

Resolved `--ours` (`git checkout --ours` + `git add --sparse`). **Zero net change** —
`git status --porcelain` and `git diff --cached --stat HEAD` are both completely
empty, so finalize will skip the commit. `CHERRY_PICK_HEAD` intact.

Two free sanity checks confirm this is the forecast series from REPORT-5620:
base `91ed8faee2` **is** the previous pick's theirs blob (the queue walks this path
in commit order), and ours' blob is unmoved from HEAD (the previous zero-net-change
resolution really netted to nothing).

## Incoming changes preserved

Theirs' entire delta from base is three frontmatter lines, and **two of the three
are already byte-identical on ours**:

| fact | base | theirs | ours |
| --- | --- | --- | --- |
| `completed_at` | `null` | `2026-09-14T10:29:07.362661+00:00` | **same, to the microsecond** |
| `status` | `bundled` | `free_and_reconciled` | **same** |
| `updated_at` | 09-11T18:53:54 | 09-14T10:29:07 | 09-19T15:15:29 (ours leads by 5 days) |

So `git diff :3: :2:` is literally one line (`updated_at`) plus ours' trailing
newline. Ours already holds this commit's own output values — there is nothing to
adjudicate and no incoming fact is dropped. The body (109 lines) is byte-identical
on both sides apart from ours adding the trailing newline.

This is the same "theirs writes `completed_at` == its own `updated_at` in one
write" pattern recorded on `ff482d9dcc` and `1c9f59d330`: both sides are stamping
the same reconcile event, ours simply continued past it.

No bundle-pair analysis was needed — the two sides never disagree about which
bundle owns the ticket (`bundled_in: bundle-8e1807f6` byte-identical on both).

The enrichment's rule ("intent unknown → take the more recent commit by
timestamp") happens to agree with `--ours` here, since ours' `updated_at` is the
later one — but the decisive argument is the fact-level one above, not the
timestamp.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The resolution followed from fact-level
comparison alone.

## Forecast for the remaining picks on this path

Both re-verified live against ours' blob `64c6c0f135` this run:

- `d0bab67c2b` (09-15) — **`--ours`**. Moves `status` backward to `bundled` with
  `updated_at` 2026-09-16T01:48:34, five weeks-equivalent behind ours' 09-19. A
  lifecycle status moving BACKWARD on xgd-working is normal on this branch; it is
  not evidence the pick is later.
- `e269a1b69f` (09-19, the tip) — **THE exception, not `--ours` on one fact**.
  Ours-vs-tip is exactly one line: `updated_at` `2026-09-19T15:15:48.590661` vs
  ours' `15:15:29.760393` — 18.8 s later, and every other field is byte-identical.
  That one fact goes to incoming.

Always run the ours-vs-tip diff rather than inferring it from lifecycle status:
ours holding the terminal state (`free_and_reconciled` + `completed_at` +
`bundled_in`) does NOT imply the tip matches. REPORT-5605 predicted "no exception
at the tip" from exactly that inference and was wrong.
