---
uid: report-da8d1618
id: REPORT-3718
type: report
title: 'UAT Coverage: Builder Workspace: Chrome, Origin & Display Panel'
created_by: xgd
created_at: '2026-09-10T11:10:03.215345+00:00'
updated_at: '2026-09-10T11:10:03.215345+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a994b8f3
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Builder Workspace: Chrome, Origin & Display Panel

**Result**: PASS
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Attempt 4. The previous coverage cycle ran on 2026-08-16 (`report-97969c20`) and
graded 30 ACs. **Six ACs have been created since and had never been graded** —
AC-1399, AC-1400, AC-1401, AC-1402, AC-1403 (2026-08-31, REQ-145/BUG-36 work) and
AC-1449 (2026-08-31, BUG-36) — which is the whole of why CAP-85 has been carrying
`uat_coverage: fail`. Their evidence was read in full this run and all six are
substantively covered. Seven further ACs whose bodies were rewritten today
(AC-964, AC-966, AC-972, AC-977, AC-978, AC-1033, AC-1036) were re-read against
their current test source rather than carried forward from the August verdict.

## Cumulative Intent Considered

Statuses re-read this run from the ticket store; all eight count. No intent in
the ledger retires any behaviour this capability's matrix describes.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft and edit renders; the draft-side channels stop being artifacts read off a shelf | YES |
| BUNDLE-16 (`bundle-15c1f647`) = REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07 | Originating intent: workspace chrome, display panel, component-consumption route | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-08 | Toolbar re-derivation on mode *and* site; a replaced control is a detached survivor (→ AC-1110) | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; proxy deleted, the Worker *is* the origin; `/builder/*`, `/webui/*`, `/framework/*.js` become build artifacts (→ AC-1399…AC-1403) | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd; `/api/ai/*` graduates from its 501 | YES |
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15 | Cloudflare Access in front of the deployed origin — the admission qualifier on AC-964 | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions and rendered output without a filesystem | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) = BUG-36 + BUG-37 + BUG-38 | free_and_reconciled | 2026-08-26 | One store opener and cold-start registration (→ AC-1449, narrowed AC-965, AC-1402); the render cache dead at the deployed origin as an accepted trade (→ AC-1033) | YES |

**Checked for later retirement, and there is none.** Every intent created after
BUNDLE-21 that could plausibly touch this surface — REQ-158 (knowledge surface on
the builder), REQ-159, REQ-160, REQ-161 (the Library tab), REQ-163 — is
`draft`, so by the status table it does **not** count toward cumulative intent
yet. This matters most for AC-959 ("exactly one tab"): REQ-161 would add a
second tab and retire it, but it has not been reconciled, and
`apps/control-app/src/builder/config.js:50` still declares `TABS = [SITE_TAB]`.
AC-959 therefore stands. REQ-162 is reconciled but is the product ticket store's
D1 schema, not builder chrome.

**Provenance caveat, carried forward.** Neither CAP-85 nor any of its 36 ACs
carries an `intent_uid`; STORY-99's `updated_by` is a scalar holding only
`bundle-78f4e2fe`. The ledger above is reconstructed from creation/update
windows, STORY-99's own `## Reconciliation Decisions` blocks, and the intent
bodies. Backfilling those fields is an operator decision, not a coverage fix.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-99 | REQ-119, BUNDLE-16, BUG-33, REQ-145, REQ-146, REQ-147, REQ-149, BUNDLE-21 | aligned | Every behaviour the body describes maps to an active AC, and every behaviour the ledger asked for is in the body. The three intent-silent points — the 501-shaped deferral rule, the re-pointed origin-failure criterion, and the render cache being dead at the deployed origin — are each recorded under `## Reconciliation Decisions` (2026-08-31 ×2, 2026-09-10), so they are decided, not gaps. |

Story-body → AC mapping checked clause by clause: one origin / admitted caller
→ AC-964, AC-1399; cold start → AC-1449, AC-965; shared components → AC-961–963,
AC-1030; build artifacts → AC-1400; one scope name → AC-960; one tab filling the
window → AC-959, AC-975, AC-976; display panel modes → AC-966, AC-968, AC-969,
AC-1029; toolbar → AC-970, AC-1110, AC-967, AC-971, AC-972; request-time channels
→ AC-1031–AC-1035; two front doors → AC-1401; copy-up → AC-1402; split and
persistence → AC-973, AC-974; freshness → AC-977; confinement → AC-978, AC-979,
AC-1036; boot guard → AC-1403. No clause is unclaimed.

## AC Evidence

All 36 active ACs resolve to at least one `test_UAT_AC<n>_*` function; the index
was rebuilt by scanning `tests/` directly, because `.xgd/uat_index.json` is empty
on this branch (`acs: {}` — its anchored `^test_UAT_` extraction does not match
these suite-prefixed vitest names). Every test drives real entry points: a live
`startBuilder` origin over HTTP, the deployed Worker's own `fetch` under
`workerd` with real D1 and R2, a real jsdom mount over the actually-installed
`webui-*` components, a real Cloudflare Access team minting RS256 tokens, real
`1c` command functions, and a real Chromium for the layout criterion. **No AC is
covered by a structural/AST check alone, and none is over-mocked** — the only
doubles in the whole set are the external process boundary (`npx` → `wrangler
dev`, a shell script that exits 0) and, where the question is *which layer
answered* rather than *what it contained*, a marker assets binding.

The six never-before-graded ACs were read end to end:

| AC | Test | Why it is substantive |
|---|---|---|
| AC-1399 | `reconciliation-workspace-edge-origin.workers.test.ts:116` | Real Worker `fetch` in workerd over real D1/R2. Document, listing, both draft-side channels, the two channels asserted to *differ*, the referenced `theme.css` asserted non-empty, and a palette write read back in a **separate** request so the claim cannot pass on a composed response. |
| AC-1400 | `reconciliation-workspace-build-artifacts.test.ts:128` | Import map recomposed from each component's own `exports` and compared to the served document; every served artifact compared byte-for-byte with the installed file; `composeModuleAssets` re-run and its bytes compared; admitted/unadmitted split against a real Access team with a body check; a no-account request against **throwing** D1/R2 proxies so "the store stayed shut" is a failable claim; fall-through-stays-last; and a comment-stripped source scan of the five request-path files for `createRequire`/`transpileModule`/`node:fs`. |
| AC-1401 | `reconciliation-workspace-transport.test.ts:104` + `…-transport.workers.test.ts:76` | Both front doors driven against one shared declaration (`tests/support/transport-contract.ts`) spanning document/read/write/render, with each leg additionally asserting the contract still spans all four classes, so a sweep quietly reduced to one class fails twice rather than passing twice. The default-target half runs the real CLI `run(['builder', …])` with only `npx` shimmed. |
| AC-1402 | `reconciliation-workspace-edge-origin.workers.test.ts:185` | Real `pushSite` from a real second-tenant `SiteStore` through the Worker's own `fetch`. Reported counts checked against what the local store held; idempotence; serves-after on both channels; gated-refusal legibility asserted on the *credential named* rather than a flag spelling; the no-privilege half proven on two independently virgin deployments (one written, one read); corrupt-asset refusal arranged by deleting the R2 object the listing still names, with nothing landed afterwards. |
| AC-1403 | `reconciliation-workspace-boot-guard.test.ts:86` | The real `BOOT_GUARD` source `eval`'d into a real jsdom document, three faults arranged separately, per-cause named fixes asserted mutually exclusive, the slow-mount race driven by mounting *between* the deadline firing and the guard writing, the healthy-load zero-cost check asserted non-vacuously against the broken loads' call counts, and inline-before-the-client ordering asserted on `chromeHtml()`. **Executed this run: passes.** |
| AC-1449 | `reconciliation-workspace-tenant-bootstrap.workers.test.ts:119` | All four bounding properties against the real D1 binding, including "costs nothing once done" asserted on the SQL SQLite actually executed via a forwarding `Proxy` (not a double) — the one property invisible from a response body. Each case takes its own fresh account name, which is what the criterion's closing paragraph demands. |

## Execution

Run this session, all green:

- `reconciliation-builder-workspace-chrome.test.ts` — 9 tests passed (so
  `WEBUI_INSTALLED` is **true** on this checkout: the `describe.skipIf` mount
  suites genuinely ran rather than skipping).
- `reconciliation-builder-toolbar-lifetime.test.ts`,
  `reconciliation-component-resolution-anchor.test.ts`,
  `bug32-webui-scope-rebrand.test.ts` — 9 tests passed.
- `reconciliation-workspace-boot-guard.test.ts` — 1 test passed.

**Not executable in this session, for an environmental reason and not a defect.**
The sandbox denies binding a listening socket. Every suite that stands up
`startBuilder` fails in `beforeAll` with `Error: listen EPERM: operation not
permitted 0.0.0.0` at `tools/generate/src/cli/builder.ts:363`, and every
`*.workers.test.ts` fails the same way at `listen EPERM 127.0.0.1` when miniflare
starts. That covers `…-origin`, `…-mounted`, `…-request-time-render`,
`…-transport`, `…-build-artifacts`, `…-edge-origin.workers`,
`…-transport.workers`, `…-admission.workers` and `…-tenant-bootstrap.workers`.
The same restriction was recorded by the alignment cycle earlier today
(`report-820c26e6`); the fix loop ran these files successfully and quoted their
output. For those suites the verdicts below rest on a full read of the test
source against the AC body, which is what this check grades.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-972 | uat-edit | `tests/reconciliation-builder-workspace-mounted.test.ts:274-278` and `:319-323` request `/preview/beta/published/` and assert `302` + `location === 'https://1stcontact.io/site/beta/'`. AC-972's Verification (rewritten today) closes: *"Do not restate the serving assertion — requesting the published channel over the origin and comparing what comes back is AC-1035's probe and is not repeated here."* `test_UAT_AC1035_…` (`…-request-time-render.test.ts:464-467`) makes the identical request with the identical assertions. Duplication, not an evidence gap: every claim AC-972 owns is asserted correctly and none of it depends on these two probes. Pre-existing, and independently raised as warning 1 by `report-820c26e6` today | Drop the two `/preview/beta/published/` requests and their status/location assertions, keeping the artifact-on-disk checks at `:274-275` and `:319-321`. Optionally leave a one-line comment pointing at AC-1035, in the style the file already uses |
| 2 | warning | uat | AC-977 | uat-edit | AC-977's Verification says explicitly: *"Assert it through **both** front doors, not only the deployed one."* `test_UAT_AC977_…` (`…-origin.test.ts:281-509`) is exhaustive but drives **only the local door** — it reads the route table out of both doors' sources for its coverage check, then probes every route through `startBuilder` alone. The deployed door's freshness is asserted, but incidentally: `tests/support/transport-contract.ts:163` folds `cache-control` into the compared answer, so `…-transport.workers.test.ts` covers it for four route classes under AC-1401. Nothing in AC-977's own test records that dependency, so a change to the transport contract could silently remove the deployed half of AC-977's evidence | Either add a deployed-door leg to `test_UAT_AC977_…` (the Worker's own `fetch` over the probes it can reach), or add an explicit comment naming `transport-contract.ts`'s `FRESHNESS` field as where the deployed half is asserted, so the split is deliberate and legible rather than incidental |
| 3 | warning | uat | AC-1400 | uat-edit | AC-1400 closes: *"A build that has not been run says so, naming the command that runs it, rather than answering as though the artifact simply did not exist."* The leg for it (`…-build-artifacts.test.ts:250-265`) is conditional — `expect(res.status).not.toBe(404)` unconditionally, then the `503` + `'1c assets'` assertions only `if (res.status !== 200)`. On any checkout that has a build (which the test's own first assertion at `:131-134` requires) the fallback resolves to that build, `res.status === 200`, and the named-fix clause is never asserted. The test says so honestly in its comment. AC-1403's boot-guard test asserts `'1c assets'` in the *browser* diagnostic, which is a different claim | Reach the branch rather than guarding it: start the unbuilt `startBuilder` against a root with the checkout fallback disabled, or point it at an isolated mirror root the way `reconciliation-1c-launcher-bootstrap.test.ts:312` does, and assert `503` + `'1c assets'` unconditionally. If the fallback makes that structurally unreachable, record it under `## Reconciliation Decisions` instead of leaving a conditional assertion |

Zero violations. Zero blocking `needs_review` — no AC or story behaviour in this
capability was found unreviewed: every intent-silent point already carries a
`## Reconciliation Decisions` entry, so the BUG-1306 impact screen was never
reached for any finding.

## Notes for the Editor

**Why this passes.** The capability's `fail` was not a live evidence gap — it was
six ACs created on 2026-08-31 that no coverage cycle had ever visited, because
the last one ran on 2026-08-16. All six turn out to carry among the strongest
evidence in the capability: they were authored alongside the BUG-36/37/38 fixes
and drive the deployed runtime rather than a node-side stand-in of it. Reading
them was the work; grading them was not close.

**All three warnings are one shape: a claim asserted somewhere other than where
its AC says it lives.** AC-972 asserts a neighbour's claim it was told not to;
AC-977 relies on a neighbour to assert half of its own; AC-1400 guards its own
last clause behind a condition a built checkout never satisfies. None of them
costs the capability evidence today, and none should be fixed by moving an
assertion around blindly — the previous cycle's *Notes for the Editor* warned
that repairing overlaps independently produces a second round of overlap, and it
was right. Fix 1 by deletion (AC-1035 already has it), fix 2 by a comment or an
added leg — never by deleting AC-1401's freshness field, which is load-bearing
there — and fix 3 by reaching the branch rather than by weakening the assertion.

**The empty UAT index is worth a separate look.** `.xgd/uat_index.json` on this
branch is `{"updated_at": …, "acs": {}}`. Every step that reads it to find an
AC's tests will conclude there are none. That is a tooling issue rather than a
matrix one — the tests exist and are named correctly — but it will keep costing
every downstream check a manual scan until the extraction is fixed to match
suite-prefixed vitest names.

**`WEBUI_INSTALLED` is true here.** Worth recording, because nine of this story's
criteria lose their mount evidence when it is false, and `describe.skipIf`
reports that as a silent skip rather than as a stated reason. It ran green this
session, so the conditional evidence is real evidence on this branch.
