---
uid: report-ff9ab1c4
id: REPORT-2554
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 38'
created_by: xgd
created_at: '2026-08-20T22:18:57.429866+00:00'
updated_at: '2026-08-20T22:18:57.429866+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 1
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 38
**Fixes applied this call**: 0
**Violations remaining**: 1 violation (finding 1, AC-1354) + 1 warning (finding 2, AC-1353)
**Needs more work**: true — but **not in this loop**. `progress_made: false` is set deliberately,
for the fourth consecutive attempt, to route this to the assessor/operator via the documented
stuck-exit.

## Verdict

Unchanged from attempts 35–37, and re-derived at source this call *before* reading
`report-6e06a0cd` or `report-3421c03a`. Both actionable findings target artifacts that **do not
exist on the branch under check**. There is no mutation available in this worktree that would
leave the capability matrix more valid than it already is. The only mutations available are
fabrications.

## Independent re-derivation this call

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` @ `33e3163a2110b385eef35fcfb70aae4880074b6a` |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4`, committed **2026-08-19 17:43:02 -0700** |
| Divergence | `git rev-list --count HEAD..main` | **549** commits on `main` absent here (`main..HEAD` = 867) |
| Store modules @HEAD | `git ls-files tools/generate/src/store` | **8** — `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | `git ls-tree -r --name-only main -- …` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Capability UATs @HEAD | `git grep -aoE "test_UAT_AC(1321\|…\|1354)_…" HEAD -- tests tools packages apps` | **no output** — 0 of 11 ACs carry a UAT here |
| Capability UATs @`main` | same grep against `main` | **9 hits** — AC-1321–1327, 1329 in `tests/reconciliation-site-storage-port.test.ts`; AC-1328 in `tests/reconciliation-site-storage-port.workers.test.ts` |
| AC-1353 / AC-1354 UATs | same grep, both refs | **no hit on either ref** |
| `fsSiteStore` @HEAD | `git grep -acn "fsSiteStore" HEAD -- tools packages apps tests` | **zero occurrences, anywhere** |
| Port test files @HEAD | `git ls-files tests/reconciliation-site-storage-port{,.workers}.test.ts tests/test_UAT_FC_REQ-142_site_store_port.test.ts` | **0 of 3 present** |
| Workers-routed files @HEAD | `git ls-files 'tests/*.workers.test.ts'` | **0** — AC-1328's routing convention has no carrier here |
| Matrix consistency | `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-3f4a5f2b` | **11 ACs**, matching the ledger exactly; nothing malformed, orphaned or duplicated |

All greps forced text mode (`-a`): two heavy consumers of the editing surface carry NUL bytes as
cache-key separators and are silently skipped as binary otherwise.

## Why each finding is unactionable here — at the artifact level

**Finding 1 (violation, `uat-add`, AC-1354).** Both halves of AC-1354's Verification clause name
modules absent from this tree.

- *Structural half* — "assert each of the three entry points constructs the filesystem adapter in
  exactly one place, and nowhere beneath". `fsSiteStore` has **zero occurrences at HEAD**, in
  source or tests. There is no filesystem adapter here to count constructions of; the assertion
  would be vacuous by construction rather than satisfied.
- *Behavioural half* — "drive the assistant's tool adapter end to end against an injected store".
  The injectable store (`site-store.ts`), the filesystem-free implementation (`memory-store.ts`,
  and with it `makeMemorySite()`) and the assembly path (`assemble.ts`) are all absent at HEAD.
  There is nothing to inject and nothing to inject it into.

**Finding 2 (warning, `uat-edit`, AC-1353).** The rename target —
`tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` — does not exist at HEAD
(`git ls-files` returns nothing). The file exists only on `main`; the rename must be performed
there.

**Finding 3 (needs_review).** Confirmed independently, dates included. Branch cut `0f44ef1ba` on
2026-08-19 17:43; REQ-141/REQ-142's implementation *and* UATs landed on `main` at `c36402287` on
2026-08-20 05:21, ~11.5 hours later. The ticket store is global; the branch is not. The matrix is
correct and `main` largely satisfies it — the branch simply predates the work. **No fix exists in
this worktree by construction.**

**Findings 4 and 5 (info).** Honored. No `ac-edit` performed on AC-1353 or AC-1354 — the assessor
found both bodies sound against REQ-142, and finding 5 confirms the `main`-side construction sites
already match AC-1354's structural claim, so this is not a `code-issue` either.

## Mutations explicitly declined, and why

| Candidate | Declined because |
|---|---|
| Author `test_UAT_AC1354_*` in this worktree | Asserts against `site-store.ts` / `memory-store.ts` / `fsSiteStore`, none of which exist at HEAD. It would fail on import and make the branch's suite worse, not better. |
| Set `uat_coverage` on AC-1353 / AC-1354 | Manufactures a passing signal for evidence that is not there — precisely the failure mode this check exists to catch. `uat_coverage` is also owned by the uat-coverage check/fix pair, not by this workflow. |
| Edit AC-1353 / AC-1354 bodies to point at the `main`-side test paths | Finding 4 states explicitly that no `ac-edit` is warranted on either; both bodies are sound. Honoring the assessor's category. |
| Author the UAT directly in the `main` worktree | Out of this workflow's scope path, cross-branch, and outside the free-coding lifecycle. A regression-branch fix loop must not mutate another branch's tree. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs | The tree under check contains neither the production code the ACs describe nor the tests that prove them; branch predates REQ-141/REQ-142 by ~11.5h. Not drift. | **(a)** Re-cut or refresh `regression-cb0dad9c` from current `main`, **or (b)** exclude `capability-c4c7a854` from this regression run. |
| AC-1354 (`acceptance_criterion-56798f01`) | No UAT on **either** ref. | Option (a) alone does **not** close finding 1 — the UAT exists nowhere. It must be authored on `main` as ordinary work under its own scope ticket, then carried in. |
| AC-1353 (`acceptance_criterion-003caa07`) | Evidence complete on `main` but named `UAT_FC_REQ-142 …`; a UAT-by-name index cannot see it. | Rename in place on `main` to `test_UAT_AC1353_*`. Traceability only, no assertion change. Cheap same-file follow-on to the AC-1354 work. |

## Loop-health note for the operator (outside this task's scope, reported not acted on)

Attempt 37 declared `needs_more_work: true` + `progress_made: false` — the documented stuck-exit
(“Exit loop — stuck (only needs_review left), assessor runs”). The loop re-invoked anyway, as
attempt 38. Attempts 35 and 36 declared the same and were likewise re-invoked. Per the
failure/error taxonomy in `CLAUDE.md` this is an **error** (a defined exit path not firing), not a
recoverable failure, and it is what has kept a terminal condition circulating as a retryable one.
This call repeats the same honest declaration rather than mis-declaring `needs_more_work: false`
to force a different route, since that would misreport the state to the assessor.

Related: the self-loop budget is stated as 20 iterations and this is attempt 38.

**Divergence trend across passes**: 531 → 536 → 546 → 548 → 549 → 549 → **549**. Flat only because
`main` has not advanced since; deferring the re-cut makes the eventual merge larger, never smaller.

## Survey hazards for whoever picks this up on `main`

- Force text mode (`grep -a`). Two of the heaviest consumers of the editing surface carry NUL bytes
  as cache-key separators and are silently classified as binary and skipped otherwise.
- Locate the port **by path, not by symbol**. `SiteStore` resolves to two unrelated types: this
  editing port (`tools/generate/src/store/site-store.ts`) and the public-serving
  `apps/public-site/src/site-store.ts` under CAP-82.
- Do **not** route AC-1354's behavioural half through the toolbox construction helper — it builds
  its own `fsSiteStore` at `toolbox.ts:505` and would defeat the injected-store claim.
