---
uid: report-301b3afb
id: REPORT-2550
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 36'
created_by: xgd
created_at: '2026-08-20T22:05:34.521004+00:00'
updated_at: '2026-08-20T22:05:34.521004+00:00'
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

**Attempt**: 36
**Fixes applied this call**: 0
**Violations remaining**: 1 violation (AC-1354) + 1 warning (AC-1353)
**Needs more work**: true (but not inside this loop — see routing)

## Verdict

**No mutation was made, deliberately.** Both actionable findings are `uat-add` /
`uat-edit`. At level=uat the only levers are test files, and every file and every
production symbol those tests must exercise is **absent from the tree under check**.
There is no edit that lands here and leaves the matrix more valid than before.

This repeats attempt 35's routing decision (`report-f2d34ef1`, `fixes_applied: 0`,
`progress_made: false`), which the check (`report-b4181503`) then independently
re-confirmed. I re-derived the evidence from git myself this pass before reading that
conclusion; two numbers moved and one hazard is now confirmed at source.

## Independent re-derivation this pass

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| Divergence | `git rev-list --count HEAD..main` | **548** (was 546 at the check, 536 at attempt 35, 531 at 34) |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | **8** — `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree -r --name-only main -- tools/generate/src/store` | **14** — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port symbol @ HEAD | `git grep -ac "fsSiteStore" -- tools packages apps tests` | **no output** — the symbol AC-1354 counts does not exist on this branch |
| Port test files @ HEAD | `git ls-files tests \| grep -iE "site-storage-port\|site_store_port"` | **none** |
| AC-1353/1354 refs @ `main` | `git grep -ac -E "AC-?135[34]" main -- tests tools packages apps` | **no output** — neither AC is referenced anywhere, on either ref |

The divergence is still growing (531 → 536 → 546 → **548** over the last four passes).

## Why no test could be authored here

Finding 1 asks for `test_UAT_AC1354_*`, whose two halves are:

- **structural** — count `fsSiteStore(` in `cli/index.ts`, `cli/builder.ts`,
  `cli/ai/toolbox.ts` and assert none beneath them. On this branch that grep returns
  **nothing**: the assertion would either fail or, written permissively, pass vacuously
  against zero construction sites. A vacuous green is worse than the open violation.
- **behavioural** — bind the separately-exported operations against `makeMemorySite()`
  and drive the copy-edit / asset-add / missing-source-refusal triple. `memory-store.ts`,
  `site-store.ts` and `assemble.ts` do not exist here, so the file could not import,
  let alone run.

Finding 2's rename targets `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, which
also does not exist on this branch.

Authoring either on `main` from a regression-branch fix loop would be porting REQ-141 /
REQ-142 feature work across branches — outside this scope, and it would not make the
check pass *here* regardless.

## Hazard confirmed at source (for whoever authors the UAT on `main`)

The check warned that routing the behavioural half through the toolbox construction
helper would false-green. Verified directly this pass —
`git grep -n -a "fsSiteStore(" main -- <the three entry points>`:

```
toolbox.ts:505:  const surfaces: Untyped[] = [new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })]
builder.ts:628:    store = fsSiteStore(ctx)
index.ts:1313:  return { ...global, store: fsSiteStore(ctxOf(global)) }
```

`store:` follows the spread at `toolbox.ts:505`, so an injected `opts.store` is silently
overwritten by the filesystem adapter. A behavioural test routed through that helper
would run against the real filesystem and pass while proving nothing. **Bind the
separately-exported operations directly.** Note this is AC-1354's criterion being met
(that entry point naming its store once), not a defect — do not file it as a `code-issue`.

The production shape AC-1354 describes is otherwise exactly right on `main`: one
construction per entry point, none beneath. **What is missing is the assertion, not the
behaviour.** No production change is required by any finding.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | uat-add | AC-1354 (`acceptance_criterion-56798f01`) | **Not applied.** Target symbol `fsSiteStore` absent from this branch; test would be vacuous or non-importable. |
| — | uat-edit | AC-1353 (`acceptance_criterion-003caa07`) | **Not applied.** Target file `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` absent from this branch. |

Ticket bodies were re-read this pass and are **not** the defect: both ACs are `active`,
`kind: behavior`, `regression_only: false`, on `story-3f4a5f2b`, with well-formed
`## Criterion` / `## Verification` sections. Attempt 34's AC-1354 rewrite is intact and
correct. There is no `ac-edit` left to make.

`uat_coverage` was deliberately **not** touched on either AC. That field is owned by the
uat-coverage check/fix pair; setting it here would manufacture progress rather than
record it.

## Code Edits

None this call. No finding is a production defect.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| all 11 ACs / `capability-c4c7a854` | Branch cut at `0f44ef1ba` (2026-08-19 17:43); the capability's code and all 9 covering UATs landed on `main` at `c36402287` (2026-08-20 05:21), ~11.5h later. 0 of 11 ACs verifiable here; 0 `*.workers.test.ts` files exist on this branch at all. | **(a)** re-cut or refresh `regression-cb0dad9c` from current `main`, or **(b)** exclude `capability-c4c7a854` from this regression run. |
| AC-1354 | Genuine coverage gap that exists on `main` too — re-cutting alone does **not** close it. | Authorise `test_UAT_AC1354_*` to be written on `main` (finding 2's rename is a cheap same-file follow-on). |

## Routing

Per `CLAUDE.md`'s failure/error taxonomy this is a **terminal failure** being routed as a
recoverable one: the branch cannot grow the feature code, and the check cannot pass
without it, so no fix path exists by construction.

Declaring `progress_made: false` with `needs_more_work: true` to take the documented
"stuck" exit and hand control to the operator. A 37th attempt would re-derive the same
wall against a branch that is now 548 commits behind; the two prerequisites above are
both outside this loop and neither is satisfiable by an editor working on this branch.
