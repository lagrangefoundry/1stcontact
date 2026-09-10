---
uid: report-820c26e6
id: REPORT-3717
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T10:58:21.129706+00:00'
updated_at: '2026-09-10T10:58:21.129706+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 5. The previous uat cycle (`report-718c7ce2`, 2026-09-10T10:18) raised
five violations and one warning; the fix loop closed them across two calls
(`report-339c06fc`, `report-ebd04b23`). **All six were re-verified against the
current test source this run rather than accepted from those reports, and all
six are genuinely closed.** One new warning is raised — an exclusivity overlap
on AC-972 that the previous cycle recorded as `aligned` on a reading of the test
that its source does not support.

Story level passed today (`report-e9695d41`) and ac level passed today
(`report-9c834330`), so per the level cascade the AC bodies are the working
reference below and intent history was consulted only to confirm statuses.

**Every AC has at least one substantive UAT.** All 36 active ACs on STORY-99
resolve to at least one `test_UAT_AC<n>_*` function across 16 test files, and
every one drives real entry points — a live `startBuilder` origin over HTTP, the
deployed Worker's own `fetch` (in-process and under `workerd` with real D1/R2),
a real jsdom mount over the actually-installed `webui-*` components, a real
Cloudflare Access team minting RS256 tokens, real `1c` command functions, and a
real Chromium for the layout criterion. No AC is covered by a structural/AST
check alone.

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

**Provenance caveat, carried forward (seventh time recorded).** Neither CAP-85
nor any of its 36 ACs carries an `intent_uid`; `updated_by` on STORY-99 is a
scalar holding only `bundle-78f4e2fe`. The ledger above is reconstructed from
creation/update windows, STORY-99's own Reconciliation Decisions blocks, and the
intent bodies. Backfilling those fields is an operator decision, not a uat-level
fix.

## Verification of the previous cycle's six findings

Each was re-read at the source rather than taken on the fix reports' word.

| Prior finding | Element | Verdict this run | Evidence |
|---|---|---|---|
| 1 (violation) | AC-978 | **closed** | `tests/reconciliation-builder-workspace-origin.test.ts:202-241` — `trees` now carries four entries; the `/framework/` group is present at `:232-240` with plain, percent-encoded and encoded-separator probes and secret `"packageManager"`. Unconditional (the bridges are written by `1c assets`, not installed out of band), so it joins the shared `statuses` set at `:272` and the "one refusal, every tree alike" assertion at `:278` now spans the prefix the criterion names. The fix additionally added a per-tree **liveness probe** (`:262-264`) — an improvement the finding did not ask for and that closes the way its own repair could have been self-defeating: a prefix that quietly stopped being served would otherwise have reported as *confined* rather than as broken |
| 2 (violation) | AC-964 | **closed** | New `tests/reconciliation-workspace-admission.workers.test.ts:103-160` sweeps all four classes the AC names — document `/`, build artifact `/builder/main.js`, operation `/api/sites`, rendered channel `/preview/<slug>/draft/` — admitted and unadmitted over real D1/R2, asserting `401` specifically (`:130`) and `refusedBody).not.toContain(fingerprint)` per class (`:138`). Non-vacuity is built in twice: the four admitted bodies must be mutually distinct (`:157`), and the seeded slug must never appear in a refusal (`:147-149`). The token-fidelity leg at `…-origin.test.ts:742-824` retains the same split against a real Access team, and the side-by-side host/origin comparison the AC forbids is deleted |
| 3 (violation) | AC-966 | **closed** | The forbidden disk byte-comparison is gone from the origin suite; the new `…-mounted.test.ts:389-497` never renders the site (`cmdNew` + a definition edit only), asserts the pane's own `getSrc()` address answers with a marker present only in that site's stored definition (`:477-480`), and drives the binding both ways via `setSite('alpha')` (`:489-497`). The stand-in detector is derived from the shipped `starterHomePage` and checked in both directions (`:441-450`) |
| 4 (violation) | AC-1033 | **closed** | New `…-request-time-render.test.ts:308-394` opens two workspaces concurrently over two stores, **same slug on purpose**, primes the first before the second is asked, and asserts each serves its own marker and neither picks up the other's. The "same account identifier" premise is established off the shipped source rather than assumed (`:327-335`), and isolation is re-asserted after a write invalidates the reuse once (`:385-391`) |
| 5 (violation) | AC-1401 | **closed** | New `tests/support/transport-contract.ts` declares status, content type, freshness directive and a door-independent body descriptor per route across all four classes the AC names. `…-transport.test.ts:120-131` asserts the local door against it; new `…-transport.workers.test.ts:96-108` asserts the deployed Worker's own `fetch` over real D1/R2 against the *same* declaration. Both legs additionally assert the contract still spans `document, read, render, write` (`:131`, `:108`), so a sweep quietly reduced to one class fails twice rather than passing twice |
| 6 (warning) | AC-1036 | **closed** | The three `etc/passwd` traversal probes are gone from `…-request-time-render.test.ts:533-544`; `probes` now holds only the two in-channel cases the criterion owns, with a comment recording that traversal is AC-978's single assertion |

## Alignment Ledger

36 active ACs, 46 UAT functions across 16 test files. Every AC → at least one
test; every test → an active AC.

| Element | Test(s) | Outcome |
|---|---|---|
| AC-959 | `…-chrome.test.ts:108` | aligned — asserts the tab *count* (not merely presence), the stable id `site`, and panel containment |
| AC-960 | `…-chrome.test.ts:193`, `bug32-webui-scope-rebrand.test.ts:179`, `:225` | aligned — both names covered; the tracked-tree scan is unconditional, and the browser-source ↔ generated-document coupling is asserted against a freshly composed document |
| AC-961 | `…-origin.test.ts:512` | aligned — per-component identity against the resolved package's own declared name, superseded-scope rejection, out-of-repo location, byte equality, and `WEBUI_INSTALLED` asserted as an *outcome* at `:565` rather than used as a gate — which is exactly what the AC's "asserted, not skipped" paragraph requires |
| AC-962 | `…-origin.test.ts:631` | aligned — names component + install command, and asserts the single resolution point by comparing two consumers' messages |
| AC-963 | `…-origin.test.ts:569` | aligned — entry points derived from each package's `exports`, no undeclared `/webui/` path, scope checks on the freshly fetched document |
| AC-964 | `…-admission.workers.test.ts:103`, `:162`; `…-origin.test.ts:742` | aligned — **repaired this cycle**; see the verification table above. The two-file split (breadth over a real store / token fidelity against a real Access team) has a documented reason and neither leg restates the other |
| AC-965 | `…-origin.test.ts:845`, `…-tenant-bootstrap.workers.test.ts:224` | aligned — unnamed and deactivated cases both asserted and told apart from each other, re-asserted from a route that opens the store deep in its handling |
| AC-966 | `…-mounted.test.ts:389` | aligned — **repaired this cycle** |
| AC-967 | `…-mounted.test.ts:332` | aligned — expected set read off the store, listing obtained via the app's own `fetchSites`, a site created after boot is included |
| AC-968 | `…-chrome.test.ts:238` | aligned — pane and surface identity across two switches, with a non-vacuity check on the src actually moving |
| AC-969 | `…-chrome.test.ts:268` | aligned — mode defined entirely in the test, offered, displayed, and its declared control set rendered |
| AC-970 | `…-chrome.test.ts:303`, `…-toolbar-lifetime.test.ts:209` | aligned — mode half + unknown-action report in one file; the site half (element-identity freshness, selector value, selector-driven / restored / programmatic triggers) in the other |
| AC-971 | `…-chrome.test.ts:351` | aligned — compared directly against the displayed src at four states |
| AC-972 | `…-mounted.test.ts:234` | **overlap — warning 1**: the invocation, revision and displayed-site halves are all asserted correctly, but the test also performs AC-1035's serving probe, which AC-972's Verification (rewritten today) explicitly says not to repeat |
| AC-973 | `…-chrome.test.ts:384` | aligned — both panes, a real divider, ratio changes, rail, and restore-to-previous-not-default |
| AC-974 | `…-chrome.test.ts:415` | aligned — all four values restored across a discard/remount, every written key namespace-checked |
| AC-975 | `…-origin.test.ts:909` | aligned — real Chromium, three viewport heights, growth/shrink tracking, page scroll-height assertion; where no browser can launch it warns loudly rather than skipping silently, which is what the AC's closing sentence asks for |
| AC-976 | `…-chrome.test.ts:129` | aligned — iterates the declaration's own keys, plus a mutation check that the `fill` option is load-bearing |
| AC-977 | `…-origin.test.ts:281` | aligned — route table read out of both front doors' sources plus the built asset directory, bidirectional declared↔probed coverage check, refusal and redirect shapes included, exact directive asserted |
| AC-978 | `…-origin.test.ts:184` | aligned — **repaired this cycle**; four trees, each with a liveness probe, one shared status set |
| AC-979 | `…-origin.test.ts:155` | aligned — unknown channel and unknown component, with neighbour-content negative assertions |
| AC-1029 | `…-mounted.test.ts:168` | aligned — the mode used is the workspace's own registration, and mode × site composition is driven both ways |
| AC-1030 | `…-component-resolution-anchor.test.ts:208, 233, 276, 306, 333` | aligned — all four checkout shapes reproduced as fixtures running the byte-copied shipped resolver in a real `node`, plus the real-installation equality with a decoy inside the working tree |
| AC-1031 | `…-request-time-render.test.ts:168` | aligned — dist removed first, both channels whole, and the no-materialisation re-check |
| AC-1032 | `…-request-time-render.test.ts:218` | aligned — full artifact set per channel, stylesheet asserted present, ≥2 pages, module render path and channel-root address covered |
| AC-1033 | `…-request-time-render.test.ts:271`, `:309` | aligned — **repaired this cycle**; both halves now covered |
| AC-1034 | `…-request-time-render.test.ts:397` | aligned — HTML failure page naming the field, last-good rendering not served, and recovery |
| AC-1035 | `…-request-time-render.test.ts:444` | aligned — redirect shape, draft moves, published artifact does not |
| AC-1036 | `…-request-time-render.test.ts:492` | aligned — **warning 6 repaired this cycle**; the probe set is now the two in-channel cases only |
| AC-1110 | `…-toolbar-lifetime.test.ts:128` | aligned — frozen replaced control, 20 re-derivations with subscriber count taken *at the panel*, teardown and remount |
| AC-1399 | `…-edge-origin.workers.test.ts:116` | aligned — document, listing, both channels, they differ, presentation file non-empty, and a write read back in a separate request |
| AC-1400 | `…-build-artifacts.test.ts:128` | aligned — derived map, rebuilt-bytes equality, admitted/unadmitted artifact with body check, no-account artifact against throwing store bindings, fall-through-stays-last, and request-path source scan |
| AC-1401 | `…-transport.test.ts:104`, `…-transport.workers.test.ts:76` | aligned — **repaired this cycle**; both doors now driven against one shared declaration |
| AC-1402 | `…-edge-origin.workers.test.ts:185` | aligned — counts match the local store, idempotence, serves after, gated-refusal legibility, no-privilege on two virgin deployments, corrupt-asset refusal with nothing landed |
| AC-1403 | `…-boot-guard.test.ts:86` | aligned — three faults executed in a real document environment, per-cause named fixes, the slow-mount race, the healthy-load zero-cost check, and inline-before-the-client ordering |
| AC-1449 | `…-tenant-bootstrap.workers.test.ts:119` | aligned — all four bounding properties, including the SQL-level "costs nothing once done" against the real D1 binding |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-972 / `tests/reconciliation-builder-workspace-mounted.test.ts:276-278, 322-323` | uat-edit | AC-972 was rewritten by the ac cycle today (`updated_at` 2026-09-10T10:01:40) to stop at the invocation: *"That the published channel is then served from the origin, and that what comes back is what publishing produced, is not asserted here. AC-1035 owns it"*, and its Verification closes *"Do not restate the serving assertion — requesting the published channel over the origin and comparing what comes back is AC-1035's probe and is not repeated here."* The test requests it twice — `:276` `get('/preview/beta/published/', { redirect: 'manual' })` asserting `302` and `location === 'https://1stcontact.io/site/beta/'`, and again at `:322-323` after the toolbar click. `test_UAT_AC1035_…` (`…-request-time-render.test.ts:464-467`) makes the identical request with the identical two assertions. Same claim, same shape, same layer — a duplicate rather than a second test shape. This is the same pattern the previous cycle raised and closed as warning 6 for AC-1036 vs AC-978, and is graded identically here. It is pre-existing rather than introduced by the fix loop: the probe is present in `…-mounted.test.ts` at commit `c9551c6a34`, i.e. it was already there when `report-718c7ce2` recorded AC-972 as *"aligned — the invocation half only; the serving assertion is correctly left to AC-1035"*. That row was a misreading, not a regression | Drop the two `/preview/beta/published/` requests and their status/location assertions from `test_UAT_AC972_…`, leaving the artifact-on-disk checks at `:274-275` and `:319-321` (which evidence that publishing *rendered*, not that the origin *serves* it). Optionally replace them with a one-line comment pointing at AC-1035, in the style the file already uses for the deleted AC-966 test |

## Notes for the Editor

**Why this passes with a warning rather than failing.** Warnings do not affect
pass/fail, and this one is a duplication-hygiene issue rather than an evidence
gap: every substantive claim AC-972 owns — the invocation reaching the
platform's own publish path, a revision appended to *that* site's history and not
the previously selected one, the revision locked in the same form a command-line
publish produces, and the slug reaching the publish path being the one the pane
is displaying — is asserted, correctly, and none of it depends on the two
redundant probes. Grading it a warning is also what keeps this check
deterministic: the previous cycle graded the structurally identical overlap
(AC-1036 restating AC-978's traversal probes) as a warning, and the same pattern
must get the same severity.

**The cross-wiring pattern the previous cycle warned about did not recur.** Its
*Notes for the Editor* predicted that fixing findings 2, 3 and 5 independently
would produce a second round of overlap, and prescribed an ordering. The fix loop
followed it: AC-966's disk byte-comparison is gone (not moved), the
worker-vs-builder side-by-side comparison moved out of AC-964's test into
AC-1401's contract exactly once, and AC-964's test was rebuilt around the
admitted/unadmitted sweep. I checked specifically for the predicted recurrence —
AC-964's and AC-1401's workers-pool tests do both drive `/`, `/api/sites` and
`/preview/<slug>/draft/`, but for different subjects (the admission split vs.
the two doors agreeing) with no shared assertion, which the guidance on test
shapes treats as acceptable rather than duplicate.

**Nothing was executed, and one attempt is worth recording.** This is a read-only
alignment check; no ticket, test or source file was modified. I did attempt to
run the newly authored evidence rather than accept the fix reports' claim that it
passes, and could not: **this session's sandbox denies binding a listening
socket**. `npm test -- tests/reconciliation-workspace-transport.test.ts` fails in
`beforeAll` with `Error: listen EPERM: operation not permitted 0.0.0.0` at
`tools/generate/src/cli/builder.ts:363` (`startBuilder`), and the workers-pool
files fail the same way at `listen EPERM 127.0.0.1` when miniflare starts. Both
are restrictions of the assessor session, **not defects in the tests or the
repository** — the fix loop ran these same files successfully and quoted their
output. The consequence for this report is that its findings are derived from the
AC bodies as they stand at 2026-09-10T10:01 and the test sources as they stand on
`regression-800a17f7`, as the previous cycle's were. Whether the suites pass is
`check_uat_coverage`'s question, not this one's.

**`uat_coverage` field state, recorded not acted on.** AC-1401 still carries no
`uat_coverage` value; the other 35 carry `pass` and CAP-85 itself carries `fail`.
That field belongs to check/fix_uat_coverage and nothing in this cycle should set
it. It is noted only so a downstream reader does not read the mismatch as the two
cycles disagreeing — AC-1401 is among the *aligned* rows above, and its evidence
was rebuilt this cycle.

**Evidence that is conditional, and why it is not a finding.** Five assertions
across `…-origin.test.ts` and `…-mounted.test.ts` call `unverified(...)` and
return early when `WEBUI_INSTALLED` is false, and AC-975's Chromium leg reports
loudly where no browser can launch. That split is STORY-99's declared and
deliberate design — consumption evidence unconditional, *mounting* evidence
skipping with a stated and reported reason — and AC-961, the one criterion that
forbids the gate, correctly asserts `WEBUI_INSTALLED` as an outcome at
`…-origin.test.ts:565` rather than gating on it.
