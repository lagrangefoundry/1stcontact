---
uid: report-718c7ce2
id: REPORT-3714
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T10:18:21.375205+00:00'
updated_at: '2026-09-10T10:18:21.375205+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 5
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: FAIL
**Violations**: 5
**Warnings**: 1
**Needs review**: 0

Attempt 4 (three prior fix attempts across this anchor: one at story level, two
at ac level; no uat-level cycle has run today). Story level passed today
(`report-e9695d41`) and ac level passed today (`report-9c834330`), so per the
level cascade the AC bodies are the working reference below and intent history
was consulted only to confirm statuses.

**Every AC has at least one UAT.** All 36 active ACs on STORY-99 resolve to at
least one `test_UAT_AC<n>_*` function, and every one of those tests drives real
entry points — a live `startBuilder` origin over HTTP, the Worker's own `fetch`
under `workerd`/`unstable_dev`, a real jsdom mount over the actually-installed
`webui-*` components, real `1c` command functions. No AC is covered by a
structural/AST check alone. The findings below are all **consistency** failures
— a test that does not exercise what its AC now claims — not coverage voids.

Two of the five were forwarded to this cycle in writing by the ac-level fix
(`report-c47daafa`, "Carried Forward to the uat Cycle"): AC-978's missing
`/framework/` probe group and AC-964's artifact-free unadmitted sweep. Both were
re-verified against the current test source rather than accepted from that
claim, and both are still open. The other three are new.

## Cumulative Intent Considered

Statuses re-read this run; all eight count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft and edit renders; the draft-side channels stop being artifacts read off a shelf | YES |
| BUNDLE-16 (`bundle-15c1f647`) = REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07 | Originating intent: workspace chrome, display panel, component-consumption route | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-08 | Toolbar re-derivation on mode *and* site; a replaced control is a detached survivor (→ AC-1110) | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder. Proxy deleted; the Worker *is* the origin. `/builder/*`, `/webui/*`, `/framework/*.js` become build artifacts | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd; `/api/ai/*` graduates from its 501 | YES |
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15 | Cloudflare Access in front of the deployed origin — the admission qualifier on AC-964 | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions and rendered output without a filesystem | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) = BUG-36 + BUG-37 + BUG-38 | free_and_reconciled | 2026-08-26 | One store opener and cold-start registration (→ AC-1449, narrowed AC-965, AC-1402); render cache dead at the deployed origin as an accepted trade (→ AC-1033) | YES |

**Provenance caveat, carried forward (sixth time recorded).** Neither CAP-85 nor
any of its 36 ACs carries an `intent_uid`; `updated_by` on STORY-99 is a scalar
holding only `bundle-78f4e2fe`. The ledger above is reconstructed from
creation/update windows, STORY-99's own Reconciliation Decisions blocks, and the
intent bodies. Backfilling those fields is an operator decision, not a
uat-level fix.

## Alignment Ledger

36 active ACs, 45 UAT functions across 12 test files. Every AC → at least one
test; every test → an active AC.

| Element | Test(s) | Outcome |
|---|---|---|
| AC-959 | `reconciliation-builder-workspace-chrome.test.ts:108` | aligned — asserts the tab *count*, the stable id `site`, and panel containment |
| AC-960 | `…-chrome.test.ts:193`, `bug32-webui-scope-rebrand.test.ts:179`, `:225` | aligned — both names covered; the tracked-tree scan is unconditional and non-vacuity-guarded, and the browser-source ↔ generated-document coupling is asserted against a freshly composed document |
| AC-961 | `…-workspace-origin.test.ts:485` | aligned — per-component identity, out-of-repo location, byte equality, `WEBUI_INSTALLED` asserted as an *outcome* |
| AC-962 | `…-workspace-origin.test.ts:604` | aligned — names component + install command, and asserts the single resolution point by comparing two consumers' messages |
| AC-963 | `…-workspace-origin.test.ts:542` | aligned — entry points derived from each package's `exports`, no undeclared `/webui/` path, scope checks on the freshly fetched document |
| AC-964 | `…-workspace-origin.test.ts:688` | **gap — finding 2**: the unadmitted half of the sweep is one route, status-only, and excludes the build artifact the AC names explicitly |
| AC-965 | `…-workspace-origin.test.ts:768`, `…-workspace-tenant-bootstrap.workers.test.ts:224` | aligned — unnamed and deactivated cases both asserted, told apart from each other, and re-asserted from a route that opens the store deep in its handling. The two files are different shapes (`unstable_dev` vs `workerd` + real D1) with a documented reason, not duplicates |
| AC-966 | `…-workspace-origin.test.ts:121` | **gap — finding 3**: the test performs the byte-equality-against-disk assertion the AC now explicitly forbids, and performs none of the evidence the AC now requires |
| AC-967 | `…-workspace-mounted.test.ts:331` | aligned — expected set read off the store, listing obtained via the app's own `fetchSites`, a site created after boot is included |
| AC-968 | `…-chrome.test.ts:238` | aligned — pane and surface identity across two switches, with a non-vacuity check on the src actually moving |
| AC-969 | `…-chrome.test.ts:268` | aligned — mode defined entirely in the test, offered, displayed, and its declared control set rendered |
| AC-970 | `…-chrome.test.ts:303`, `…-toolbar-lifetime.test.ts:209` | aligned — mode half + unknown-action report in one file; the site half (element-identity freshness, selector value, selector-driven / restored / programmatic triggers, and the no-op-on-same-site case) in the other |
| AC-971 | `…-chrome.test.ts:351` | aligned — compared directly against the displayed src at four states |
| AC-972 | `…-mounted.test.ts:233` | aligned — the invocation half only; the serving assertion is correctly left to AC-1035 |
| AC-973 | `…-chrome.test.ts:384` | aligned — both panes, a real divider, ratio changes, rail, and restore-to-previous-not-default |
| AC-974 | `…-chrome.test.ts:415` | aligned — all four values restored across a discard/remount, every written key namespace-checked |
| AC-975 | `…-workspace-origin.test.ts:832` | aligned — real Chromium, three viewport heights, growth/shrink tracking, page scroll-height assertion; where no browser can launch it warns loudly rather than skipping silently, which is what the AC asks for |
| AC-976 | `…-chrome.test.ts:129` | aligned — iterates the declaration's own keys, plus a mutation check that the `fill` option is load-bearing |
| AC-977 | `…-workspace-origin.test.ts:254` | aligned — route table read out of *both* front doors' sources plus the built asset directory, bidirectional declared↔probed coverage check, refusal and redirect shapes included, exact directive asserted |
| AC-978 | `…-workspace-origin.test.ts:189` | **gap — finding 1**: the `trees` table has no `/framework/` group, which the AC's rewritten enumeration and Verification now require by name |
| AC-979 | `…-workspace-origin.test.ts:160` | aligned — unknown channel and unknown component, with neighbour-content negative assertions |
| AC-1029 | `…-mounted.test.ts:167` | aligned — the mode used is the workspace's own registration, and mode × site composition is driven both ways |
| AC-1030 | `…-component-resolution-anchor.test.ts:208, 233, 276, 306, 333` | aligned — all four checkout shapes reproduced as fixtures running the byte-copied shipped resolver in a real `node`, plus the real-installation equality with a decoy inside the working tree |
| AC-1031 | `…-request-time-render.test.ts:168` | aligned — dist removed first, both channels whole (document + referenced stylesheet + asset), and the no-materialisation re-check |
| AC-1032 | `…-request-time-render.test.ts:218` | aligned — full artifact set per channel, stylesheet asserted present, ≥2 pages, module render path and channel-root address covered |
| AC-1033 | `…-request-time-render.test.ts:270` | **gap — finding 4**: the change-outside/revert half is asserted well; the two-workspaces-never-share-a-rendering half has no test anywhere in the suite |
| AC-1034 | `…-request-time-render.test.ts:308` | aligned — HTML failure page naming the field, last-good rendering not served, and recovery |
| AC-1035 | `…-request-time-render.test.ts:355` | aligned — redirect shape, draft moves, published artifact does not |
| AC-1036 | `…-request-time-render.test.ts:403` | aligned in substance; **warning 1** — it repeats AC-978's traversal probes, which its own Verification says not to |
| AC-1110 | `…-toolbar-lifetime.test.ts:128` | aligned — frozen replaced control, 20 re-derivations with subscriber count taken *at the panel*, teardown and remount |
| AC-1399 | `…-workspace-edge-origin.workers.test.ts:116` | aligned — document, listing, both channels, they differ, presentation file non-empty, and a write read back in a separate request |
| AC-1400 | `…-workspace-build-artifacts.test.ts:128` | aligned — derived map, rebuilt-bytes equality, admitted/unadmitted artifact with body check, no-account artifact against throwing store bindings, fall-through-stays-last, and request-path source scan |
| AC-1401 | `…-workspace-transport.test.ts:99` | **gap — finding 5**: the read/write/render sweep is driven through the local front door only; the AC requires the same requests through the deployed runtime and a comparison of the two |
| AC-1402 | `…-workspace-edge-origin.workers.test.ts:185` | aligned — counts match the local store, idempotence, serves after, gated-refusal legibility, no-privilege on two virgin deployments, corrupt-asset refusal with nothing landed |
| AC-1403 | `…-workspace-boot-guard.test.ts:86` | aligned — three faults executed in a real document environment, per-cause named fixes, the slow-mount race, the healthy-load zero-cost check, and inline-before-the-client ordering |
| AC-1449 | `…-workspace-tenant-bootstrap.workers.test.ts:119` | aligned — all four bounding properties, including the SQL-level "costs nothing once done" against the real D1 binding |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-978 / `tests/reconciliation-builder-workspace-origin.test.ts:202` | uat-edit | The AC's enumeration and Verification were rewritten by the ac cycle (`report-c47daafa`, 2026-09-10) to name three artifact prefixes — `/builder/`, `/webui/` and `/framework/` — and to require a traversal probe for each, plain and percent-encoded, with the outcome identical across all of them. The `trees` table probes only the rendered channels and `/builder/`, with `/webui/` gated on `WEBUI_INSTALLED`. There is **no `/framework/` group at all**, and `/framework/*.js` is the prefix the AC singles out as worth naming because it carries the edit client. The identical-status assertion at `:251` therefore reports "one refusal, every tree alike" over a set that omits a prefix the criterion is explicitly about | Add a fourth entry to `trees` for `/framework/` — e.g. `/framework/../../../package.json`, `/framework/%2e%2e/%2e%2e/%2e%2e/package.json`, `/framework/..%2f..%2f..%2fpackage.json` with secret `"packageManager"` — so the prefix joins the shared `statuses` set |
| 2 | violation | consistency | AC-964 / `tests/reconciliation-builder-workspace-origin.test.ts:688` | uat-edit | The AC's Verification requires repeating **at least one route of each class** as an unadmitted caller, asserting it is refused **and that the refusal body does not contain what the admitted response contained**, and says of the build artifact: "Include the build artifact explicitly: it is the member of the sweep whose refusal would otherwise go unprobed". The test's only unadmitted probe is `worker.fetch(previewUrl('alpha','draft'))` at `:746`, asserted on status `401` alone. No artifact, no document, no operation is probed unadmitted, and no refusal body is compared against an admitted body anywhere in the test. (`AC-1400`'s test does probe the artifact unadmitted with a body check — but AC-964 states in its own body that it exercises the artifact as a member of *its* sweep, which is the assertion that is missing) | Extend the unadmitted pass to one route per class already swept — `/`, the component/artifact URL, `/api/sites` and the preview URL — asserting refusal and `expect(refusedBody).not.toContain(admittedBody.slice(0, N))` for each |
| 3 | violation | consistency | AC-966 / `tests/reconciliation-builder-workspace-origin.test.ts:121` | uat-edit | The AC (rewritten today, `updated_at` 2026-09-10T09:49) now owns only the *binding* — "whatever site is selected, the ordinary mode's pane is showing *that* site" — and instructs: "Do not assert byte-equality against a rendered file on disk: that claim is AC-1032's, and asserting it here would require a pre-rendered artifact whose absence AC-1031 exists to guarantee." The test `test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical` does exactly the forbidden thing: `makeWorkspace()` pre-renders both channels with `cmdRender`, then `:129-133` reads `storage/dist/sites/alpha/draft/index.html` and asserts the response equals it byte-for-byte, and `:137-147` repeats the comparison for every css/js artifact. It also performs **none** of the evidence the AC now requires: nothing is mounted, no pane or displayed document is inspected, and — because the fixture site comes from `cmdNew`, i.e. the starter scaffold — there is no "string present in the definition and in no starter or placeholder" for a stand-in to fail on. As written the test cannot distinguish a pane wired to a stand-in from a correct one, which is the criterion's whole subject | Move the test to the mounted suite (`reconciliation-builder-workspace-mounted.test.ts`, which already has both a real origin and a jsdom mount): seed the site's definition with a distinctive marker string, `mountBuilder` with that site selected and mode `view`, assert `app.panel.getSrc()` is that site's ordinary channel address and that fetching it returns a body containing the marker. Delete the disk byte-comparison and the artifact loop — both are already asserted by `test_UAT_AC1032_…` |
| 4 | violation | coverage | AC-1033 / `tests/reconciliation-builder-request-time-render.test.ts:270` | uat-add | The AC carries two halves. The first — a definition changed outside the workspace shows on the next request, in both directions — is asserted well. The second is the BUG-37 reconciliation: "Then open two workspaces over two different stores at the same time, holding sites whose renderings are distinguishable, and assert each serves its own — the second must not be answered out of the first's reuse. Drive them under the same account identifier, since that is the case the account-keyed reuse got wrong and a two-account probe would pass either way." **No test in the repository opens two workspaces**; `openWorkspace()` is called exactly once per test at `:176, :226, :277, :315, :364, :409`, and a repo-wide search for the isolation claim returns nothing. The reuse key (store handle, not account id) is the load-bearing property the AC exists to pin, and it is currently unproven | Add a UAT that calls `openWorkspace()` twice with distinguishable home-page copy, drives both origins under the same notional account, and asserts each returns its own marker — the fixture already supports concurrent workspaces via the `OPEN` array and its `afterEach` teardown |
| 5 | violation | coverage | AC-1401 / `tests/reconciliation-workspace-transport.test.ts:99` | uat-edit | The AC's Verification opens: "Drive a representative set of routes through the local front door **and through the deployed runtime**, and assert the same request produces the same status, content type and shape of answer from both — including at least one route that reads the store, one that writes, and one that renders." The test drives `/api/sites` (read, `:111`), `/api/palette` (write, `:118`), `/preview/…/draft/` (render, `:132`) and `/` — all through `startBuilder` only. There is no `worker.fetch`, no `unstable_dev`, and no comparison against the deployed runtime anywhere in the file. What *is* asserted well is the second half (no route table of its own, one hand-over, the default/`--remote` target report), so the "one route table" claim currently rests on a source-level absence check rather than on the two doors being observed to agree. (`AC-964`'s test does compare the two hosts, but only for `/` and a component module — neither reads, writes nor renders) | Add a deployed-runtime leg: stand up the Worker (`unstable_dev` as `AC-964`'s suite does, or `worker.fetch` under the workers project as `AC-1400`'s does) and assert matching status, content-type and answer shape for the read, write and render routes against the same requests already issued to the local door |
| 6 | warning | exclusivity | AC-1036 / `tests/reconciliation-builder-request-time-render.test.ts:438` | uat-edit | AC-1036 says in its body "That an address which walks *out* of a served tree is refused is not restated here. AC-978 asserts that once… This criterion covers the addresses that stay inside the tree", and in its Verification "Traversal probes are AC-978's; they are not repeated here." The test's `probes` array nevertheless opens with three traversal probes — `assets/../../../../../../etc/passwd` and its two encoded forms — before the two in-channel probes the criterion actually owns. Same claim, same shape, same layer as `test_UAT_AC978_…`, so this is a duplicate rather than a second test shape | Drop the three `etc/passwd` entries from `probes`, leaving "a page the channel does not contain" and "a site the store does not hold" |

## Notes for the Editor

**A cross-wiring worth seeing as one pattern, not three tickets.** Findings 2, 3
and 5 are all the same shape: the AC was re-scoped and its test was left aimed at
the neighbouring criterion. AC-966's test is now AC-1032's assertion; AC-964's
test is now largely AC-1401's assertion (two front doors compared byte-for-byte);
AC-1401's test asserts only one of the two doors. Fixing them independently risks
producing a second round of overlap. The cheapest ordering is: repoint AC-966
first (it frees the byte-comparison entirely to AC-1032), then move the
worker-vs-builder comparison from AC-964's test into AC-1401's test and rebuild
AC-964's test around the admitted/unadmitted sweep the AC now describes.

**Findings 1 and 2 were pre-announced.** `report-c47daafa`'s "Carried Forward to
the uat Cycle" table names exactly these two, with the same file and the same
line ranges, and deliberately left `uat_coverage` at `pass` rather than writing
another cycle's field. They were re-verified against the current test source this
run and are unchanged; they are not being taken on that report's word.

**`uat_coverage` field state.** Six ACs (AC-1399, AC-1400, AC-1401, AC-1402,
AC-1403, AC-1449) carry no `uat_coverage` value at all, while the other 30 carry
`pass` and CAP-85 itself carries `fail`. That field belongs to
check/fix_uat_coverage and nothing in this cycle should set it; it is recorded
here only because a downstream reader comparing "30 pass, 6 unset" against this
report's five violations would otherwise conclude the two cycles disagree. They
do not — the unset six are among the *aligned* rows above.

**Nothing was run.** This is a read-only alignment check; no test was executed
and no ticket, test or source file was modified. The findings are derived from
the AC bodies as they stand at 2026-09-10T10:01 and the test sources as they
stand on `regression-800a17f7`. Note that four of the twelve test files gate
substantial assertions on `WEBUI_INSTALLED`, so a machine without the
out-of-band component install would report several of the *aligned* rows above
as unverified-with-a-warning rather than proven — that is the story's declared
and deliberate evidence split, not a finding.
