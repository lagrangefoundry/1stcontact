---
uid: report-d203eccc
id: REPORT-2478
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 2'
created_by: xgd
created_at: '2026-08-20T17:04:07.563127+00:00'
updated_at: '2026-08-20T17:04:07.563127+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 2
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings)
**Needs more work**: true
**Progress made**: false — blocked entirely by the `needs_review` item (finding 9)

## Verdict

Findings 1–8 are all `uat-add` / `uat-edit`. **Every file each of them targets is absent from
`regression-cb0dad9c`.** Authoring them here would produce test files whose imports do not
resolve, failing at collection and breaking the regression suite. That is a strictly worse
matrix state, so no mutation was applied. This reproduces REPORT-2476's conclusion, and it was
reached by independent verification rather than by carrying that report forward on trust.

## Independent re-verification performed this call

I did not take report-79169a27 at face value. Four checks, all run from this worktree:

| Check | Command | Result |
|---|---|---|
| Port absent from branch | `ls tools/generate/src/store/` | `base/diff/fsutil/history/index/loadSite/paths/snapshot` only — no `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts` |
| Port absent tree-wide | `git grep -l -a -E "site-store\|memorySiteStore\|fsSiteStore\|SiteStore" -- tools/ tests/ packages/` | **zero** hits (`-a` forced: STORY-118's NUL-byte hazard in `builder.ts`/`fidelity.ts` would otherwise hide files) |
| Branch ancestry | `git merge-base --is-ancestor b18b859d7 HEAD` | **false**; against `main` → **true**. HEAD `3d0e59c0f`, `main` `bda6c9939` |
| Target files exist on main | `git ls-tree -r --name-only main -- tools/generate/src/store tests` | all seven present: `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |

Note HEAD advanced from `50aeebe08` (as cited in report-79169a27) to `3d0e59c0f` — that is the
`check_uat_validation` workflow's own report/comment commits, not code. The tree is unchanged.

## Assessor claims I could check from here — all corroborated

Because `main` is readable from this worktree (`git show main:…`) even though it is not an
ancestor, two of the findings most likely to be mis-targeted by a later fix loop were verified
against real source. Both hold:

| Finding | Claim | Verification | Verdict |
|---|---|---|---|
| 2 | The injectable seam is `l1Operations`, **not** `createL1Toolbox` | `git show main:tools/generate/src/cli/ai/toolbox.ts \| grep -n l1Operations` → `176:export function l1Operations(slug: string, opts: EditOptions): L1Operations` (used internally at `:404`) | **Correct.** The "Notes for the Editor" near-miss is real: target `:176`, not `createL1Toolbox`. `createL1Toolbox` overriding an injected store is what AC-1354 *requires*, not a violation |
| 3 | `appendChange` / `changesSince` / `pendingChanges` are called by no test | `git grep -a -n -E "appendChange\|changesSince\|pendingChanges" main -- tests` → **no output** | **Correct.** The totality claim covers 11 verbs; the tree exercises 7 |

This raises confidence that findings 1–8 are ready to apply verbatim the moment a branch
containing the port is available. Nothing in them is disputed on its merits.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** All eight actionable findings target files absent from this branch |

## Code Edits

None this call. No `code-issue` was raised by the assessor and none was found; every suggested
edit is test-side.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (whole level) | The capability is in regression `cb0dad9c`'s matrix but its implementation is not in the branch. Branch cut at merge-base `0f44ef1ba` (2026-08-19 17:43); BUNDLE-19 landed the port at `b18b859d7` (2026-08-20 05:49). The regression received this capability's **ticket store** without its **code and tests** | Choose one: **(a)** resync `regression-cb0dad9c` past `b18b859d7`, then re-enter `fix_uat_validation` — all eight findings become both actionable *and* runnable here; **(c)** run `check_uat_validation` + `fix_uat_validation` for this capability on a branch that contains the port; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c`. (a) and (c) are substantive; (b) defers. **This is not intent ambiguity — no reading of the ledger resolves it** |

## Why `progress_made=false` is the honest declaration

The loop contract designates `needs_more_work=true, progress_made=false` for exactly this
state: blocked entirely by a `needs_review` item. Findings 1–8 are not deferred on their
merits — they are deferred on the branch, and finding 9 gates every one of them. Manufacturing
a token mutation to keep the loop alive would buy a third zero-progress iteration against the
same wall and delay the operator decision that is the only thing capable of unblocking this
level.

## Ready-to-apply ordering, for whoever picks this up unblocked

Unchanged from report-79169a27, and re-endorsed after the checks above:

1. **Finding 4** first — a deletion (`…test.ts:585-590` plus its `seedWithPalette` scaffolding).
   It is the claim AC-1327 was narrowed five times to expel; leaving it keeps CAP-85's evidence
   (AC-1033, already `uat_coverage: pass`) duplicated inside CAP-101's evidence set.
2. **Findings 3 and 5** — extensions to existing tests.
3. **Findings 1 and 2** — new tests. Finding 1 is largely a lift of existing FC-named
   assertions (`test_UAT_FC_REQ-142_site_store_port.test.ts:105,115`) plus one new bullet;
   finding 2 is genuine authoring against `l1Operations` at `toolbox.ts:176` (verified above).
4. **Warnings 6–8** — cheap once their host tests are open.
