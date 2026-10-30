---
uid: report-a438d868
id: REPORT-5726
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T10:22:30.482576+00:00'
updated_at: '2026-09-30T10:22:30.482576+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync stage resolution — `d137bd257e` (bug-3ade1af4)

Cherry-pick target `9ac98712a708888db67f8aff21f22b16bd98094e`, branch
`resync-377b581e`, HEAD `e70d1e699c`, retry count 1, `prior_stage_failure` empty.

## STEP 1 — Inventory

`CHERRY_PICK_HEAD` = `d137bd257e5096e8e14628f09adc5844ac5a80f1`
(`xgd(ticket): update bug bug-3ade1af4`, authored 2026-09-15T18:48:35-0700).

One conflict, materialized with markers in the working tree:

```
UU .xgd/tickets/hot/bug-3ade1af4.md
```

Frontmatter-only on both sides; the 111-line body is byte-identical across all
three index stages.

| stage | blob | state |
|---|---|---|
| `:1:` base | `f3761a7fd7` | `updated_at` 2026-09-14T10:29:13.489970, `status: free_and_reconciled` |
| `:2:` ours | `4b1ec9bd2a` (== `HEAD:<path>`) | `updated_at` 2026-09-19T15:15:31.624433, `status: free_and_reconciled` |
| `:3:` theirs | `1f50971ca1` | `updated_at` 2026-09-16T01:48:35.906839, `status: bundled` |

Base is the *previous* pick's result (`ff482d9dcc`-equivalent, which wrote
`completed_at`/`status` at 09-14), so the ledger position is as forecast in
REPORT-5685: this is the "backward to `bundled`" commit, one before the tip.

## STEP 2 — Resolution

Intent/bookkeeping ticket. `git diff :3: :2:` is exactly two lines —
`updated_at` and `status`. Resolved **`--ours`**.

This is not a judgement call between the two sides. Incoming's own branch
supersedes its own write: xgd-working's tip for this path is `79bbb8e08f`
(2026-09-19T15:15:46.300383) with `status: free_and_reconciled`, and
`git diff :2: xgd-working:<path>` is a **single line** — `updated_at`, 14.7 s
apart. So theirs' `free_and_reconciled → bundled` write is a *backward*
lifecycle move that xgd-working itself reverses three days later to the exact
value ours already carries.

The enrichment rule ("intent unknown on one or both sides → take the more
recent commit by timestamp") independently agrees: ours leads on both contested
facts (09-19 > 09-16).

## STEP 3 — Incoming changes preserved

Nothing discarded. Theirs' entire delta from base is the two scalars above;
both are superseded on xgd-working's own subsequent history. Taking theirs would
roll the ticket's lifecycle backward — i.e. it is the resolution that would lose
data here, not `--ours`.

## STEP 4 — Staging

`git checkout --ours -- <path>` then `git add --sparse -- <path>`.

- `git status --porcelain` — completely empty
- `git diff HEAD --stat` — empty → **zero net change from HEAD**, so
  `resync_cherry_pick_finalize_resolution` will skip the commit
- `CHERRY_PICK_HEAD` still present (`d137bd257e`); no `--continue`/`--skip`/
  `--abort`/`--quit`/`reset` was run

## Forecast for the remaining pick

One pick remains on this path: xgd-working's tip `79bbb8e08f`
(2026-09-19T15:15:46.300383, `status: free_and_reconciled`). Ours-vs-tip is one
line (`updated_at`, ours 15:15:31.624433 vs tip 15:15:46.300383) — that one is
the **exception**: incoming's `updated_at` is genuinely later, so it is not
`--ours`.

Note the per-pick SHAs on this branch differ from those recorded in earlier
reports for the same ticket (`9563d602d4` → `d137bd257e`, `4de6b3df56` →
`79bbb8e08f`): identify a pick by its content and author date, not by SHA.
