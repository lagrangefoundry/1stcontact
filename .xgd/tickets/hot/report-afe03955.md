---
uid: report-afe03955
id: REPORT-5686
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T07:11:27.912579+00:00'
updated_at: '2026-09-30T07:11:27.912579+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e

Picked commit: `75fd86986336fab2b92a290abc32ada4a4583f72` — "xgd(ticket): update request request-51514090", author/commit date 2026-09-14 03:29:03 -0700, +3/-3.
HEAD at resolution: `f9477a9cd029192e3309fd7153b3e002b9372bff` (unmoved).
Anchor: `report-377b581e`. `prior_stage_failure`: empty.

## Files resolved

| Path | Class | Resolution | Net change |
| --- | --- | --- | --- |
| `.xgd/tickets/hot/request-51514090.md` | `UU`, materialized, 1 conflict region | `--ours` | none |

Index stages:

- base `:1:` `21a05a6198` — **this is the previous pick's THEIRS blob** (`32b56f0960`, REPORT-5622), confirming the queue is walking this path in commit order and that we are on REPORT-5622's forecast series.
- ours `:2:` `efd42480e9` — unmoved from the previous pick (`== HEAD:<path>`), so that resolution really netted to nothing.
- theirs `:3:` `e1c7c33572`.

## Incoming changes preserved

Theirs' entire delta from base is three frontmatter lines, body untouched:

- `updated_at` `2026-09-11T18:53:54.684664` → `2026-09-14T10:29:03.385320`
- `completed_at` `null` → `2026-09-14T10:29:03.385320`
- `status` `bundled` → `free_and_reconciled`

Two of the three are already on ours, and the third was retracted by the incoming side itself:

1. **`completed_at` is byte-identical on ours** — ours already carries
   `2026-09-14T10:29:03.385320` to the microsecond. Nothing to adjudicate.
2. **`status` was reverted by xgd-working's own next commit, and ours IS that
   revert.** `git diff <ours blob efd42480e9> 035f9cd7e7:<path>` is **empty**.
   `035f9cd7e7` (2026-09-15 18:48:38) is the direct child of the picked commit on
   xgd-working and moves `status` back `free_and_reconciled` → `bundled`, stamping
   `updated_at: 2026-09-16T01:48:38.671366+00:00` (the same instant in UTC).
   So ours is not main's competing opinion — it is literally the incoming side's
   own later revision of this file. Keeping ours discards nothing incoming
   decided; it honours incoming's *latest* decision.
3. `updated_at`: ours 09-16 leads theirs' 09-14 by 2 days, consistent with (2).

This is the documented **backward-lifecycle trap** on this ticket
(`free_and_reconciled` 09-14 → `bundled` 09-15 → `free_and_reconciled` 09-19):
`75fd869863` setting `free_and_reconciled` *looks* like forward progress, but a
lifecycle status does move backward on xgd-working, so "monotone lifecycle" is
not a safe inference. The superseding-commit blob test is what settles it.

The enrichment's "intent unknown → take the more recent commit by timestamp" rule
incidentally agrees with `--ours` here (ours' `updated_at` is the later one), but
the blob equality against `035f9cd7e7` is the load-bearing evidence.

No bundle-pair (`bundle-4efd33fe` vs `bundle-8e1807f6`) analysis was needed:
`bundled_in` is byte-identical on both sides, so the two sides never disagree
about which bundle owns the ticket.

## Arbitration of last resort (BUG-1460)

Not applicable — STEP 3h never fired. The determination rests on blob equality
between ours and the incoming side's own superseding commit, plus the
byte-identical `completed_at`.

## Result

`git checkout --ours` + `git add --sparse`. `git status --porcelain` is
**completely empty** and `git diff --cached --stat HEAD` is empty — zero net
change, so finalize will skip the commit. `CHERRY_PICK_HEAD` intact at
`75fd86986336fab2b92a290abc32ada4a4583f72`; HEAD still `f9477a9cd0`.

## Forecast for the remaining picks on this path

Re-verified live against ours' blob `efd42480e9` (unchanged from the previous
pick, so the earlier forecast holds by construction):

| Pick | Date | Call |
| --- | --- | --- |
| `035f9cd7e7` | 09-15 18:48 | `--ours` — blob **is** ours, so it should auto-merge and never reach the resolver |
| `cc24e09188` (tip) | 09-19 15:15 | **THE EXCEPTION** — not `--ours` |

Tip detail, confirmed live: `git diff efd42480e9 cc24e09188:<path>` is exactly
two frontmatter lines — `updated_at` `2026-09-19T15:15:39.421261` (vs ours'
`2026-09-16T01:48:38.671366`) and `status: free_and_reconciled` (vs ours'
`bundled`). `completed_at` and the body are byte-identical. That is a genuine
later decision by the incoming side, so incoming wins both facts on that pick.

Do **not** infer the tip call from ours holding a terminal-looking state — run
the ours-vs-tip diff every time.
