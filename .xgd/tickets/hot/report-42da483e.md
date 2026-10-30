---
uid: report-42da483e
id: REPORT-5429
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T02:59:41.168085+00:00'
updated_at: '2026-09-29T02:59:41.168085+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (`request-*`; type-classified under STEP 2e, not 2d — `request` is not a
  matrix-defining spec type, it lives in `hot/` in this repo). Path is outside
  the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers; resolved via
  `git checkout`-equivalent blob materialization + `git add --sparse`.
  **Rule applied:** 2e "one side a strict superset: keep the superset" — HEAD
  (ours) kept. The enrichment metadata's fallback rule ("take the more recent
  commit by timestamp") independently agrees: HEAD is `updated_at`
  2026-09-09T21:32:50 vs incoming 2026-09-01T01:31:19.
  Resolved blob: `b4342d0ddc9f5d1ce0a150d02eedf2e944364dc3` (stage 0).

### Why HEAD is a strict superset

Direct blob diff of incoming (`e6b5619e`) → HEAD (`b4342d0d`) shows HEAD
contains every substantive field incoming carries, byte-identical, plus more:

| field | incoming (`14cd3cdd41`) | HEAD (resolved) |
|---|---|---|
| `commits` (2× `working_sha`) | `61a0becc…`, `deaf3f98…` | **identical** |
| `version` | `0.2.29` | **identical** |
| `last_field_updated` | `status` | **identical** |
| `bundled_in` | *absent* | `bundle-87be4669` |
| `status` | `free_coded` | `bundled` (downstream) |
| `updated_at` | 2026-09-01 | 2026-09-09 (9 days later) |
| body | — | + retrospective note on the account/business split ([[DOC-40]] §2, [[REQ-178]]) |

The only incoming-unique values are the stale lifecycle pair
(`status: free_coded`, `updated_at: 2026-09-01`). `bundled` is strictly
downstream of `free_coded` — the change ledger only ever records
`bundled → free_and_reconciled`, and `bundle-87be4669` is a real bundle shared
with `request-78370159`, `request-439cd0c8`, and `request-909e42f8`. Accepting
incoming would have regressed this ticket nine days backwards out of its bundle.
No disjoint edit on the incoming side was discarded (BUG-1030 concern does not
arise: this is a genuine superset, not a wholesale timestamp pick over
competing content).

## Incoming changes preserved

Verified by `git show 14cd3cdd41 -- <file>` against the staged blob:

- `working_sha: 61a0becc6122ee61948352cac03237307b292b31` — **present** (line 19)
- `working_sha: deaf3f98c482ba39a2bf1107ecc1d1c1602a77f9` — **present** (line 22)
- `reconcile_sha: null` / `main_sha: null` for both entries — **present**
- `version: 0.2.29` — **present** (line 25)
- `last_field_updated: status` — **present**

Every substantive line the incoming commit added survives verbatim in the
resolved version. The two superseded lines (`status: free_coded`,
`updated_at: 2026-09-01T01:31:19`) are lifecycle bookkeeping that HEAD has
legitimately advanced past, not developer content.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the
grounds of a prior HEAD-side refactor. No code files and no UAT test files were
involved in this conflict; no test function was deleted.

## Net effect

The resolution is byte-identical to HEAD, so this cherry-pick has an empty net
diff. Staged and left as-is per instructions — `--skip`/`--continue` not
invoked; CHERRY_PICK_HEAD (`14cd3cdd41`) remains present for the finalize step,
which will detect the clean staged diff and skip the commit.
