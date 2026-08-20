---
uid: report-3b8546fa
id: REPORT-2528
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 27'
created_by: xgd
created_at: '2026-08-20T20:52:23.801610+00:00'
updated_at: '2026-08-20T20:52:23.801610+00:00'
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

**Attempt**: 27 (self-loop budget was 20 — already exceeded)
**Fixes applied this call**: 0
**Violations remaining**: 1 violation + 1 warning, both unrepairable on this branch
**Needs more work**: true (blocked — see below)
**Progress made**: false

## Verdict

No mutation was applied. Every actionable finding is blocked by finding 3's
`needs_review`, and I re-derived that conclusion from source this call rather than
inheriting it from `report-9504d165`.

This is a **terminal failure** under CLAUDE.md's failure/error taxonomy: an expected
dead-end warranting a graceful halt, not a recoverable failure to retry. Declaring
`progress_made: false` is the correct and deliberate exit — it hands control to the
operator instead of spending a 28th identical iteration.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | uat-add | AC-1354 (`acceptance_criterion-56798f01`) | **Not applied.** Blocked — required modules absent at HEAD |
| — | uat-edit | AC-1353 (`acceptance_criterion-003caa07`) | **Not applied.** Blocked — target test file absent at HEAD |
| — | needs_review | capability-c4c7a854 on `regression-cb0dad9c` | Forwarded to operator (below) |

## Independent Verification Performed This Call

Re-derived from git rather than trusting the anchor report's table.

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `9aadc73d1`, `632253197`, `3f57bcf17` — workflow/ticket/report commits only; no source change |
| Cut point | `git log -1 --format='%cI %s' $(git merge-base HEAD main)` | `0f44ef1ba`, `2026-08-19T17:43:02-07:00` |
| Port tests @ HEAD | `git ls-files tests \| grep -E 'site-storage-port\|workers\.test\|REQ-14'` | **empty** (exit 1) |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | 8 pre-port modules only: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree -r --name-only main -- tools/generate/src/store` | 14 modules — adds `assemble`, `fs-store`, `journal`, `journal-model`, `memory-store`, `site-store` |
| Port tests @ `main` | `git ls-tree -r --name-only main -- tests` | `reconciliation-site-storage-port.test.ts`, `…​.workers.test.ts`, `support/site-factory.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| Sizes @ `main` | `git grep -c "" main -- …` | `memory-store.ts` 192 lines, `site-store.ts` 150, `site-factory.ts` 199 |

### New evidence not present in prior passes

`git grep -n "store" HEAD -- tools/generate/src/cli/ai/toolbox.ts` returns **three matches, all
prose in doc comments** (`:91`, `:393`, `:396`). There is no `store` option on `L1Toolbox` at
HEAD at all.

This sharpens the finding. `report-9504d165` suggested AC-1354's UAT could be authored without
production change because "`L1Toolbox` accepts `store` on its options" — that is true **on
`main`** (`toolbox.ts:505`, `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`),
and false at HEAD. So on this branch the suggested repair is not merely missing its imports; the
injection seam the AC exists to verify has not been built here.

Authoring `test_UAT_AC1354_*` in this worktree would therefore require writing ~540 lines of
absent production and fixture code plus a new `L1Toolbox` option — REQ-142's implementation,
re-done on a regression branch. That is outside the editor role, outside `uat-add`, and would
leave the regression suite with a test importing modules that do not resolve. Strictly worse
than the current state.

Finding 2 is blocked more simply: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` does not
exist at HEAD, so its two tests cannot be renamed here.

## Code Edits

None this call. No code edit is justifiable: the divergence is branch topology, not a
disagreement between code and intent.

## Fields Deliberately Not Touched

`uat_coverage` on AC-1353 / AC-1354 was left unchanged. That field is owned by the
check/fix_uat_coverage cycle, and setting it here would fabricate progress in place of the
real repair — explicitly warned against in `report-9504d165`'s Notes for the Editor.

AC bodies were left unchanged. The ac-level cycle passed clean (`report-2927090b`, 0/0/0), so
the eleven AC bodies are authoritative at this level; editing them would regress a clean level
to simulate motion here.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` on `regression-cb0dad9c` | Finding 1 is real but unrepairable on this branch; 27 passes, 0 cumulative fixes; attempts 24–27 all `progress_made: false` | **Choose one of two routes.** (a) Re-cut the regression branch from current `main` so the port and its UATs are present, then let this level re-run and repair AC-1354 where the code lives. (b) Route findings 1–2 to `main` / `xgd-working` and let this branch's uat level pass on the evidence as it stands on `main` — the capability matrix is global, so UAT evidence on `main` **is** evidence regardless of which worktree the check executes in. |

### Supporting context for the decision

The real, durable gap is one test: **AC-1354 has no UAT anywhere**, on this branch or on `main`.
It is a genuine coverage hole, not a branch-visibility artifact — and it is a one-test repair on
a branch that has the code.

Its provenance explains why it was missed: AC-1353 (created 2026-08-20T15:43:36Z) and AC-1354
(15:59:43Z) were authored by the ac-level fix cycle *after* the UAT-generation workflow ran at
2026-08-20T12:21:06Z, so neither was ever in scope for a UAT author. AC-1353 was retroactively
satisfied by the free-coded REQ-142 file (modulo the naming issue in finding 2); AC-1354 was not.

AC-1354's own Verification section names exactly what the missing test must do: assert each of
the three entry points constructs its store in one place with injection beneath, then drive the
tool adapter against an injected store for the copy-edit/change-count, asset-bytes, and
not-found-envelope trio. Route (a) or (b) both make that authorable; neither is available from
inside this worktree.

## Loop Semantics

Declaring `needs_more_work: true, progress_made: false` to **exit the loop** and surface the
operator decision. Re-invoking would produce this same report a 28th time.
