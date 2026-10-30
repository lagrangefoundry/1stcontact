---
uid: report-12f2fd40
id: REPORT-5505
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:51:08.440566+00:00'
updated_at: '2026-09-29T07:51:08.440566+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — **UU**, intent/bookkeeping ticket
  (STEP 2 class **2e**; index-only conflict, outside the sparse-checkout cone
  per DOC-986 §2, so resolved via `git checkout --theirs
  --ignore-skip-worktree-bits` + `git add --sparse`; this git build does not
  accept `--sparse` on `checkout`).

  Both commit subjects were bare `xgd(ticket): update bug bug-5bc83942` with no
  narrative body, so no operation intent was declarable from the ledger. Rather
  than take a whole side by `updated_at` (which would have discarded legitimate
  disjoint work), the two sides were diffed against the merge base and composed
  per fact:

  | Fact | Base | Ours (HEAD, 9c0940f9) | Theirs (incoming, 00277071) | Resolution |
  |---|---|---|---|---|
  | `fields.commits` | absent | **added** (working/reconcile/main sha block) | absent | **keep ours** — OURS-only addition |
  | `updated_at` | 22:43:25 | 22:43:25 (unchanged) | **22:43:53** | **take theirs** — only side that actually advanced it, and it accompanies the real content edit |
  | Body: fault 4 section | short paragraph | unchanged | **rewritten & greatly expanded** (promote/register asymmetry, `image.src` analysis, three separable defects) | **take theirs** — THEIRS-only change |
  | Body: Status section | "Waiting on lf BUG-39 before scoping faults 3 and 4" | unchanged | **rewritten** (fault 4 now scopable; fault 3 still blocked) | **take theirs** — THEIRS-only change |

  No fact was changed differently on both sides, so the 2e "later-positioned
  intent wins per fact" tiebreak was never needed. The result is a true union,
  not a winner-takes-all.

## Incoming changes preserved

Verified by diffing the resolved file against the incoming stage-3 blob
(`5ab2ffb2`):

```
17a18,22
>   commits:
>   - working_sha: d46756fefa43ca8709acb13d64abccb2ac91d961
>     reconcile_sha: 834be7e6a5057adc7f2089c459146d0b0e5331a7
>     main_sha: null
>     working_sha_history: []
```

The diff is **additions only** — every line of the incoming version survives
verbatim, including the entire rewritten fault 4 diagnosis and the new Status
text. Spot-checked on the staged blob: `promoteToSiteAsset`, a token that
appears only on the incoming side, is present 3 times in the index content.

Symmetrically, `base -> ours` was confirmed to contain nothing but the
`commits:` block (plus an incidental stripped trailing newline, not carried
over — theirs' newline convention was kept), so keeping theirs' body discards
no HEAD-side work.

No hunks were dropped; the BUG-1301 precedence exception was not invoked and no
test functions were involved.

## Staging state

`git status --porcelain` reports `M  .xgd/tickets/hot/bug-5bc83942.md` with
`git ls-files -u` empty — no unmerged entries remain. `CHERRY_PICK_HEAD`
(`0027707142203775e007960830ed909e2fb77fee`) is intact; no `--continue`,
`--skip`, `--quit`, or `--abort` was issued.
