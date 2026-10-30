---
uid: report-96f7b9e9
id: REPORT-5556
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T14:21:02.591143+00:00'
updated_at: '2026-09-29T14:21:02.591143+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — UU, §2g config file, `version` scalar only (the whole of the
  file's incoming diff). Kept HEAD's `0.2.113` over incoming's `0.2.105`.
  **Deviation from 2g's "incoming wins"** — see the dropped-hunk note below.
  The resolved file is byte-identical to HEAD, so `package.json` no longer
  appears in `git status --porcelain`; that is expected, not a missed stage.

Auto-merged, no conflict, staged as the cherry-pick left them:
`db/dev-seed.sql`, `tests/test_UAT_FC_REQ-192_dev_seed.workers.test.ts`,
`tests/test_UAT_FC_REQ-193_names.workers.test.ts`,
`tests/test_UAT_FC_REQ-193_seeded_names.workers.test.ts`.

## Incoming changes preserved

Verified by restricting the index-vs-incoming comparison to the five paths in
`7ea4e12b72`'s own diff:

```
git diff --cached --numstat 7ea4e12b72 -- db/dev-seed.sql tests/... package.json
1	1	package.json
```

That is the complete output: the staged tree is **byte-identical to incoming
for all four code files**, and differs only by the single `version` line in
`package.json` (`0.2.105` → `0.2.113`), which is the deliberate drop below.

| incoming change | present in resolved tree |
| --- | --- |
| `db/dev-seed.sql` — four `accounts` rows, Alice's three businesses pointed at her account, `acct_` → `biz_` remint | yes — blob identical to incoming |
| `Person` carrying `accountId`; users INSERT keeps `account_id`, drops `display_name` (seed side) | yes — blob identical to incoming |
| `test_UAT_FC_REQ-192_dev_seed.workers.test.ts` | yes — blob identical to incoming |
| `test_UAT_FC_REQ-193_names.workers.test.ts` | yes — blob identical to incoming |
| `test_UAT_FC_REQ-193_seeded_names.workers.test.ts` | yes — blob identical to incoming |
| `package.json` version bump `0.2.104` → `0.2.105` | no — dropped, see below |

No test function was deleted or modified by this resolution. The three UAT
files carry incoming's bytes exactly, so every assertion the developer wrote
for REQ-193 is present as written.

### Dropped hunk — `package.json` version scalar (BUG-1301 precedence)

`7ea4e12b72`'s `package.json` diff is a single incidental bump
`0.2.104 → 0.2.105`, not REQ-193/195 content — the commit message mentions the
version only as a trailing bookkeeping line ("Version 0.2.105."). Its target
was already superseded by `50a6940825 chore(version): 0.2.113 for REQ-192
[FREE-CODED]` (2026-09-06T12:21:05-07:00), a free-coded commit this same resync
queue cherry-picked onto the branch ahead of it, along with `0.2.111` and
`0.2.112` before it. Taking incoming would walk the published version number
BACKWARDS by eight patches.

`version` is a monotone counter, not developer intent about code: no developer
code rides on the hunk, and the counter's value is reproduced by the later
free-coded bumps already on the branch. This is the same ground recorded for
every preceding version conflict in this resync run
(`resolve-377b581e-61a0becc61`, `-242a8bf969`, `-b38dbdabf1`, `-164e51cba7`,
`-13d686aaf0`), applied consistently.

The enrichment's per-file rule ("Intent unknown on one or both sides. Take the
more recent commit by timestamp and flag this file for post-merge review")
would, read literally, have selected incoming: `7ea4e12b72` is
12:26:57-07:00 and the HEAD-side `package.json` commit is 12:21:05-07:00. It
was not followed, because on inspection this is not a genuine intent collision
— it is a monotone counter whose HEAD-side value is strictly ahead. The file is
flagged for post-merge review as the enrichment requests.

## Verification limits

The tree was not built or tested. Resync is a caretaker process and must not run
test_fix; the three conflicting-commit test files are all `*.workers.test.ts`,
which are unrunnable in this session role (`listen EPERM` from the
workerd/miniflare pool). Verification here is by blob comparison against the
incoming commit, which is stronger than reading for this resolution: four of the
five files are proven identical to incoming rather than merely inspected.

## Staging state

`git status --porcelain` shows no UU/AA/DU/UD lines — only the four `M` staged
code files. `CHERRY_PICK_HEAD`
(`7ea4e12b724f90d5cfc114c31a105c8d811ea5e0`) is intact; no `--continue`,
`--skip`, `--quit`, `--abort` or `reset` was issued.
