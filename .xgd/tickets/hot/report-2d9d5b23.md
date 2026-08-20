---
uid: report-2d9d5b23
id: REPORT-2556
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 39'
created_by: xgd
created_at: '2026-08-20T22:31:27.968405+00:00'
updated_at: '2026-08-20T22:31:27.968405+00:00'
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

**Attempt**: 39
**Fixes applied this call**: 0
**Violations remaining**: 1 (AC-1354) + 3 warnings
**Needs more work**: true — but **not by me**. See "Why this call mutated nothing".

## What I re-derived at source this call

I did not inherit attempt 38's conclusions. Every fact below was re-checked from git, from the
ticket store, and by reading the production and test sources directly. All five findings in
`report-ea39ab18` reproduce.

| Check | Result |
|---|---|
| Branch / HEAD | `regression-cb0dad9c` @ `ad01a717f` |
| merge-base with `main` | `0f44ef1ba` — 2026-08-19T17:43:02-07:00 |
| Divergence `HEAD..main` | **551** (was 549 last pass — still growing) |
| Store modules @HEAD | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | **14** — the 8 above plus `assemble`, `fs-store`, `journal`, `journal-model`, `memory-store`, `site-store` |
| Capability UATs @HEAD (`test_UAT_AC13(2[1-9]|5[34])`) | **0 of 11 ACs** |
| Capability UATs @`main` | **9** — AC-1321…AC-1329, none for AC-1353 / AC-1354 |
| `*.workers.test.ts` @HEAD | none — AC-1328's routing convention has no carrier here |
| `main` advanced since attempt 38 | `15d6b9ee7` → `1a897c5eb`, **2 commits, both `xgd(ticket): update comment comment-2c16318b`** — one ticket file, 64 insertions. Closes nothing. |

**Findings re-confirmed individually:**

- **Finding 1 (violation, AC-1354).** Ticket read: `Status: active`, `kind: behavior`,
  `regression_only: False`. AC-named grep returns nothing on either ref. Read
  `main:tools/generate/src/cli/ai/toolbox.ts:505` directly — it is
  `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`. The spread precedes the
  key, so an injected store **is** silently overridden: the false-green route AC-1354's
  Verification warns against is real. Construction sites on `main` are exactly one per entry
  point (`cli/index.ts:1313`, `cli/builder.ts:628`, `cli/ai/toolbox.ts:505`) plus the definition
  at `store/fs-store.ts:45` — so the structural claim already holds; only the assertion is absent.
- **Finding 3 (warning, AC-1327).** Confirmed both halves. AC-1327's body disclaims freshness in
  terms and assigns it to CAP-85 / REQ-119 / AC-1033. `main:tests/reconciliation-site-storage-port.test.ts:585–590`
  asserts precisely that freshness property ("A change made to the draft outside the builder is
  picked up on the next request, with no restart"). The AC's own three bullets are fully covered
  at `:568–583`, so this is over-reach, not a gap.
- **Finding 4 (warning, AC-1329).** Confirmed. `test_UAT_AC1329_*` runs `595–655` and ends at the
  clean-partition assertion. Nothing scans the routed sources for behavioural assertions that
  branch on the runtime. The property holds — the only three hits for
  `navigator.userAgent` / `Cloudflare-Workers` across `main:tests` are
  `…-port.workers.test.ts:32`, `REQ-141_workers_runtime.workers.test.ts:19`,
  `REQ-141_project_routing.test.ts:25`, all inside AC-1328's declared exception — so it is an
  unguarded invariant, not a false claim.
- **Finding 5 (needs_review).** Confirmed: the port (`site-store.ts`), both adapters
  (`fs-store.ts`, `memory-store.ts`), the assembly path and the journal are all absent at HEAD,
  and `vitest.config.mts` is still the single-runtime pre-split configuration.

## Why this call mutated nothing

**Every actionable finding targets files that exist only on `main`.** Findings 1–4 name
`tests/reconciliation-site-storage-port.test.ts`, `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`
and `tools/generate/src/store/*` — none of which are in this worktree. The two mutations
technically reachable from here are both fabrications, and I declined both deliberately:

1. **Authoring `test_UAT_AC1354_*` on this branch** would assert against `site-store.ts`,
   `memory-store.ts` and `makeMemorySite()`, none of which exist at HEAD. It could not run,
   let alone pass.
2. **Setting `uat_coverage` on AC-1353 / AC-1354** would manufacture a passing signal for
   evidence that is not present — the exact failure mode this check exists to catch. That field
   is also owned by the uat-coverage check/fix pair, not by this one.

**I also considered, and rejected, doing the work directly in the `main` worktree**
(`…/worktrees/…/main`, present and checked out at `1a897c5eb`). It is readable and writable from
here, so this was a real option, not a hypothetical one. I did not take it:

- This workflow's mutations are supposed to land on the branch under check and be proven by this
  regression run. A file written into another branch's worktree is outside that evidence chain
  entirely — unrun, unreviewed, uncommitted.
- Per the branch topology in `CLAUDE.md`, work reaches `main` through reconcile branches, never
  by direct write. A test authored here with no scope ticket is exactly the unscoped commit the
  next sync is specified to detect and revert.
- That worktree is shared and live — `reconcile-REQ-147`, `free-REQ-149` and `free-REQ-150` are
  all checked out concurrently. Leaving dirty files in `main` risks breaking a run this task
  does not own.

So `fixes_applied: 0` is the honest count, for the fifth consecutive pass, and for the same
structural reason each time.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** No non-fabricated mutation is reachable from this worktree. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs | The branch predates the code the ACs describe. Cut at `0f44ef1ba` (2026-08-19 17:43); REQ-142 completed 2026-08-20 12:49 and REQ-141 2026-08-20 21:02, both carried by BUNDLE-19 whose merge commit `b18b859d7` is not an ancestor of HEAD. | **(a)** re-cut or refresh `regression-cb0dad9c` from current `main`, or **(b)** exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1, 3 or 4 — those are `main`-side test work that exists nowhere yet. |

## Recommendation: route to the terminal-failure path, not a fortieth iteration

Per the failure/error taxonomy in `CLAUDE.md`, a **failure** has a defined recovery path and a
**terminal failure** does not. This has none. The branch cannot grow REQ-141/REQ-142's feature
code without that being feature work on a regression branch, and the check cannot pass without
it. Thirty-nine passes have now re-derived the same facts; a fortieth will re-derive them again.

I am declaring `progress_made: false` with `needs_more_work: true` so the loop exits to the
assessor rather than spending a fortieth iteration. This is the designed escape, and I am using
it deliberately rather than fabricating a mutation to satisfy the letter of the "one mutation per
call" rule.

## Queue for whoever picks this up on `main` (survives a re-cut)

Findings 1–4 are all `main`-side test work and none is caused by the branch. Ideally one pass over
`tests/reconciliation-site-storage-port.test.ts` and `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`:

1. **AC-1354 — author `test_UAT_AC1354_*`** (the only violation). Structural half: assert exactly
   one `fsSiteStore(` in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts`, and zero
   in every module beneath. Behavioural half: bind the exported edit operations directly to a
   `makeMemorySite()` store — **not** through `createL1Toolbox`, which overrides an injected store
   at `toolbox.ts:505` — then apply a copy edit and assert the change count advanced, add an asset
   from a real source file and assert the bytes land under the given name, and re-invoke with a
   missing source path asserting the same `NOT_FOUND` code, path and hint the CLI produces
   (`…-port.test.ts:526–533` is the CLI-side reference).
2. **AC-1353 — rename only.** The evidence is correct and complete at
   `test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115`; it just carries no AC-traceable
   name, which is why coverage reads zero. Rename both to `test_UAT_AC1353_*` in place. No
   assertion change.
3. **AC-1327 — delete `…-port.test.ts:585–590`**, the freshness block AC-1327's body assigns to
   CAP-85/AC-1033 (itself asserted at `reconciliation-builder-request-time-render.test.ts:271`).
   If the coupling is wanted, leave a comment saying it is a redundant guard on AC-1033's
   property, not AC-1327's claim.
4. **AC-1329 — extend `test_UAT_AC1329_*`** with a source scan over `tests/**/*.test.ts`
   asserting no file outside an explicit routing-probe allowlist branches a behavioural
   expectation on `navigator.userAgent` or a Workers-only global. Keep the allowlist explicit so
   AC-1328's three probes stay legible as the deliberate exception.

**Two survey hazards on `main`.** Force text mode (`grep -a` / `--binary-files=text`): two heavy
consumers of the editing surface carry NUL bytes as cache-key separators and are skipped as binary
otherwise. And locate the port by **path**, not by symbol — `SiteStore` resolves to two unrelated
types: this editing port (`tools/generate/src/store/site-store.ts`) and the public-serving
`apps/public-site/src/site-store.ts` under CAP-82, which is the only one this branch has.

**The divergence is not shrinking**: 531 → 536 → 546 → 548 → 549 → 549 → 549 → **551**. Deferring
the re-cut makes it larger, not smaller.
