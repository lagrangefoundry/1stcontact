---
uid: report-dcfe6d0a
id: REPORT-3711
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T09:59:13.123170+00:00'
updated_at: '2026-09-10T09:59:13.123170+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Attempt 5. The two repairs `report-863a9c80` (fix attempt 4) claimed were
verified as landed — see the Alignment Ledger, findings 4 and 5. Neither is
re-raised. The violation below is a **new** finding, of the same shape as the
AC-966 one just closed: an AC last revised 2026-08-16 that still describes the
arrangement REQ-145 (free_and_reconciled, 2026-08-15) replaced.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Statuses read from
the ticket store this run; the ordering is by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-07-31 | Request-time draft and edit renders inside control-app; the draft-side channels stop being artifacts read off a shelf | YES |
| BUNDLE-16 (`bundle-15c1f647`) = REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07 | Originating intent: the workspace chrome, the display panel, the component-consumption route, the edit loop it hosts | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-08 | Toolbar re-derivation: a replaced control is a detached survivor (→ AC-1110) | YES |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | **control-app becomes the builder.** Proxy deleted; the Worker *is* the origin. `/builder/*`, `/webui/*` and `/framework/*.js` "all three become build-time artifacts served from Workers Static Assets" (body §36–48) | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd; `/api/ai/*` graduates from its 501 | YES |
| REQ-147 (`request-23fd6e61`) | free_and_reconciled | 2026-08-15 | Cloudflare Access in front of the deployed origin — the admission qualifier on every criterion here | YES |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions and rendered output without a filesystem | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) = BUG-36 + BUG-37 + BUG-38 | free_and_reconciled | 2026-08-26 | BUG-36: one store opener, cold-start registration (→ AC-1449, narrowed AC-965, AC-1402). BUG-37: render cache dead at the deployed origin, recorded as an accepted trade (→ AC-1033). BUG-38: chat host per isolate | YES |

**Provenance caveat, fourth time recorded.** Neither CAP-85 nor any of its 36
ACs carries an `intent_uid`; `updated_by` on STORY-99 is a scalar holding only
`bundle-78f4e2fe`. This ledger was reconstructed from creation/update windows,
the story's own Reconciliation Decisions blocks, and the intent bodies. That
reconstruction is what surfaces findings of the form "an AC frozen at date X
under an intent from date Y" — see finding 1 — and it costs a full re-derivation
every cycle.

## Alignment Ledger

Story-level alignment is assumed (`report-e9695d41` passed today); the STORY-99
body is the working reference below. Intent history was consulted only for
finding 1, where the AC's own text is inconsistent with what the story body and
the shipped routes say.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-959, AC-975, AC-976 — one tab, filling the window, every declared tab option honoured | REQ-115 | aligned |
| AC-960 — one definition site per shown name, and for the component scope | REQ-115, REQ-145 | aligned |
| AC-961, AC-962, AC-963 — components consumed not copied; missing one names the install command; references through declared entry points | REQ-115, REQ-145 | aligned |
| AC-964 — one origin for an admitted caller, nothing reinterpreted | REQ-115, REQ-145, REQ-147 | aligned; artifact-behind-the-gate probe re-states AC-1400 — warning 2 |
| AC-965 — no account named / account deactivated, as distinct failures | REQ-145, BUG-36 (narrowed) | aligned |
| AC-966 — the ordinary mode displays the selected site's own rendering | REQ-115, **repaired today** | aligned — see finding 4 |
| AC-967, AC-968, AC-969, AC-1029 — selector, mode switching, mode registration, the editable mode | REQ-115, REQ-117 | aligned |
| AC-970, AC-1110 — the strip is derived state; a replaced control is inert | REQ-115, BUG-33 | aligned |
| AC-971 — open-in-a-new-tab targets the displayed document | REQ-115 | aligned |
| AC-972 — publish through the existing path, for the displayed site | REQ-115, REQ-149 | aligned; its serving clause re-states AC-1035 — warning 3 |
| AC-973, AC-974 — the split, and what it remembers | REQ-115 | aligned |
| AC-977 — every response non-cacheable, stamped by the route table | REQ-119, REQ-145 | aligned; **its own route-class list names "the client code served for the editing gesture"**, which is the class AC-978 omits |
| AC-978 — no request escapes any served tree | REQ-115 | **gap: enumerates the pre-REQ-145 topology and omits the `/framework/*.js` artifacts — violation 1** |
| AC-979 — unknown channel / unknown component answered as not found | REQ-115 | aligned; disjoint from AC-1036 after today's narrowing |
| AC-1030 — the components consumed are the repository's own, from any working tree | REQ-115 (anchoring correction) | aligned |
| AC-1031, AC-1032 — channels answer with no artifact on disk; one render backs both writer and reader | REQ-119 | aligned |
| AC-1033 — a definition changed outside shows on the next request; two workspaces never share a rendering | REQ-119, amended by BUG-37 | aligned |
| AC-1034, AC-1035 — invalid draft reported in the pane; `published` from publish time only | REQ-119, REQ-149 | aligned |
| AC-1036 — the same addresses resolve; nothing outside the channel | REQ-119, **repaired today** | aligned — see finding 5 |
| AC-1399, AC-1400, AC-1401, AC-1402, AC-1403 — no local process; build artifacts behind the gate; the transport; copy-up; the boot guard | REQ-145, REQ-147, BUG-36 | aligned |
| AC-1449 — cold start registers the one configured account | BUG-36 | aligned |

**Coverage of the STORY-99 body was re-checked bullet by bullet and is
complete.** Single origin → AC-964, AC-971, AC-1399; admitted caller only →
AC-964, AC-1400; components consumed / build artifacts → AC-961, AC-962,
AC-963, AC-1030, AC-1400; scope written once → AC-960; one tab filling the
window → AC-959, AC-975, AC-976; panel modes → AC-968, AC-969, AC-1029;
toolbar → AC-970, AC-967, AC-971, AC-972, AC-1110; request-time channels →
AC-1031…AC-1036; two front doors → AC-1401; copy-up → AC-1402; split and
persistence → AC-973, AC-974; freshness → AC-977; boot guard → AC-1403;
configuration failures → AC-965, AC-1449; checkout anchoring → AC-1030.
**Confinement is the one bullet whose AC does not cover the whole class the
story names** — that is violation 1, recorded as `ac-edit` rather than `ac-add`
because AC-978 is the criterion that exists to make the claim and simply has
the wrong list in it.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-978 (`acceptance_criterion-53c66f17`) | ac-edit | **AC-978 enumerates the pre-REQ-145 served-tree topology, and the list it asserts over is not the list of trees the workspace serves.** Its criterion opens: *"Each file tree the workspace origin serves — **the rendered channels, the installed components, and the workspace's own browser source** — never satisfies a request that resolves outside it … The outcome is identical across **all three trees**; no tree lacks the confinement."* Two things are wrong with that list as of REQ-145 (`request-b474390f`, free_and_reconciled, 2026-08-15). **(a) A served class is missing.** REQ-145's body: *"`/builder/*`, `/webui/*` and `/framework/*.js` … All three become build-time artifacts served from Workers Static Assets"* (body §36–48), which `apps/control-app/src/router.ts:45-47` restates verbatim and `tools/generate/src/cli/assets.ts:36-38` implements (`dist-assets/builder/**`, `dist-assets/webui/<pkg>/**`, `dist-assets/framework/*.js`). `/framework/*.js` is the tree carrying `edit-client.js` — the *"shared client code the editing gesture runs in the displayed page"* the CAP-85 body names as served from this origin — and it is reachable: `tests/reconciliation-builder-workspace-origin.test.ts:416-418` drives `/framework/edit-client.js`, `/framework/site-schema-edit.js` and `/framework/site-schema-shade.js` as a route class of its own. AC-978 names it nowhere, so no criterion asserts that an escaping request under `/framework/` is refused. **(b) The remaining two are no longer two trees.** Components and browser source are now sub-prefixes of one built directory confined at one point — `tools/generate/src/cli/builder.ts:149,159` resolves `/builder`, `/webui` and `/framework` alike through a single `resolveStaticFile(dir, url.pathname)` over `assetsDirOf(ctx)`, and `apps/control-app/wrangler.toml:56` serves the same `./dist-assets` at the deployed origin. So AC-978's load-bearing clause — *"the confinement cannot be present on one tree and missing on another"* — is asserted across two probes of the same code path plus the channels, while the one prefix that could genuinely differ is unlisted. The STORY-99 body names the class correctly: *"Everything a channel address can still reach — a site's own assets, **the built artifacts**, the workspace's own browser source — is confined … and every tree behaves identically"*. AC-978 says "the installed components" where the story says "the built artifacts". AC-977, revised under REQ-145 on 2026-08-31, already uses the current vocabulary and lists *"the client code served for the editing gesture"* among its response classes — so the matrix contradicts itself on what is served. AC-978 was created 2026-08-07 and last updated 2026-08-16; the REQ-145 reconciliation batch is the 2026-08-31 ACs (AC-1399…AC-1403), and AC-978 was not among them | Rewrite AC-978's enumeration to the served classes as they now are: **the rendered channels**, and **the built-artifact tree** — naming its three prefixes (`/builder/*` the browser source, `/webui/*` the components, `/framework/*.js` the bridges and the edit client) so the framework prefix is covered by name rather than by implication. Keep the identical-outcome clause but re-point what it guarantees: it now says every *prefix* of the artifact tree and the channels behave alike, which is the claim that still has teeth. Update the Verification to add a `/framework/` traversal probe (plain and percent-encoded) alongside the existing `/builder/` and `/webui/` ones. Do **not** weaken AC-977 or AC-1400 to match — both are already correct; AC-978 is the element that did not move |
| 2 | warning | exclusivity | AC-964 (`acceptance_criterion-46d5804e`) vs AC-1400 (`acceptance_criterion-2131e298`) | ac-edit | The unadmitted-build-artifact probe is asserted twice, in the same shape, with the same rationale and no cross-reference. AC-964: *"Include the build artifact explicitly: an artifact served ahead of the gate would be served to anyone, so it is the assertion that distinguishes 'the origin runs first' from 'the asset layer answers first'."* AC-1400: *"The artifacts are served behind the gate, never ahead of it … Served ahead of the origin they would be served to anyone"*, verified as *"request the same artifact as an unadmitted one and assert it is refused and that the refusal carries none of the artifact's bytes."* Both were touched in the 2026-08-31 REQ-145/REQ-147 batch, so the overlap is plausibly deliberate — but unlike AC-1029 (*"AC-969 proves that a mode contributed from outside the panel works end to end … both are deliberately mode-agnostic"*) and unlike AC-1036 after today's repair, neither says so, which is why it reads as duplication on every pass | Add a one-paragraph deferral to **AC-964**, in the shape AC-1036 now uses for AC-978: the artifact-ahead-of-the-gate property is AC-1400's in full (it owns the fall-through ordering and the no-account case); AC-964 exercises the artifact only as one member of its route-class sweep and asserts nothing about ordering. Leave AC-1400 untouched |
| 3 | warning | exclusivity | AC-972 (`acceptance_criterion-285b8c08`) vs AC-1035 (`acceptance_criterion-4d519076`) | ac-edit | *"Request the published channel over the origin and get back what publishing produced"* is asserted by both, in the same shape. AC-972: *"the published channel's rendered output exists, and requesting the published channel over the origin returns it."* AC-1035: *"Publish a site, then request its published channel over the origin and assert the response equals the artifact publishing produced"* — the stronger form, and the one whose subject it actually is. AC-972's own subject is that **invoking publish from the workspace reaches the platform's existing path for the displayed site**; its serving clause adds nothing AC-1035 does not make more strongly, and it sits against the STORY-99 out-of-scope line *"What publishing does, and **how published bytes are served** … are the two halves of the delivery capability and are owned there"* | Narrow AC-972 to what it owns — publish is invoked for the *displayed* site, a revision is appended and locked in the same form a command-line publish produces, and no publish semantics exist only in the workspace — and defer the "and the origin then serves it" clause to AC-1035 with an explicit sentence. The title should lose *"and the published result is served"* with it |
| 4 | info | consistency | AC-966 (`acceptance_criterion-6fb2bebc`) | — | **Violation 1 + warning 2 of `report-89cba15c` are confirmed repaired.** AC-966 (updated 2026-09-10T09:49:32) no longer premises a rendered artifact and no longer excludes *"a re-generation"* — the mechanism `apps/control-app/src/router.ts:576-578,599` actually uses. It is now the display-panel binding only, with byte-identity deferred to AC-1032 and no-artifact-on-disk to AC-1031 by name, and its Verification explicitly forbids re-introducing the on-disk comparison. The title was corrected with it. AC-1032 and AC-1031 were **not** weakened, as `report-89cba15c` warned against. Residual overlap with AC-967 (*"the pane is displaying that site's rendered page"*) was checked and judged acceptable: the three now partition as selector / ordinary mode / editable mode, and AC-966 states that partition in its own body | none |
| 5 | info | exclusivity | AC-1036 (`acceptance_criterion-46e9debf`) | — | **Warning 3 of `report-89cba15c`, standing through three checks, is confirmed repaired.** AC-1036 (updated 2026-09-10T09:49:37) no longer re-states AC-978's traversal guarantee; it now carries an explicit deferral (*"AC-978 asserts that once, in both plain and percent-encoded form, across all three trees … This criterion covers the addresses that stay inside the tree"*) and its Verification ends *"Traversal probes are AC-978's; they are not repeated here."* Its surviving content — unknown page, unknown site — was checked against AC-979 (unknown *channel*, unknown *component*) and is disjoint. Note the deferral text inherits AC-978's stale "all three trees" phrasing; fixing finding 1 should carry through to this sentence | none |
| 6 | info | coverage | CAP-85 body / STORY-99 ACs — the editing client and the write-path transport | — | Not re-opened. `report-89cba15c` finding 4 recorded that the two `ac-add` findings of REPORT-5A4CF7A4 were dissolved in the "narrow the capability body" direction, and the CAP-85 body read this run confirms it (*"is CAP-87's property (AC-1006)"*, *"is CAP-86's (AC-992)"*). Re-verified that the reachability half CAP-85 still claims is covered: AC-977 names the editing client among its response classes and AC-1399 asserts a write through the workspace's own operation lands in the shared store and reads back. Authoring ACs here would convert two closed findings into exclusivity violations against AC-992 and AC-1006 | none |
| 7 | info | exclusivity | AC-1402 (`acceptance_criterion-d541fbe9`) vs AC-1449 (`acceptance_criterion-2180afc8`) | — | Their Verifications overlap on the cold-start-plus-copy-up probe. Re-confirmed **not** a duplicate: STORY-99's 2026-08-31 Reconciliation Decisions block reconciles this explicitly (*"The cold start is stated as a criterion of its own … they are opposite outcomes with different evidence"*; *"The single opener is stated on the copy-up criterion rather than left as an accident"*). Each needs the other's probe as a control. Recorded so the overlap stays on the record as deliberate | none |
| 8 | info | exclusivity | AC-960 (`acceptance_criterion-13d252a9`) vs AC-963 (`acceptance_criterion-78436279`) | — | Both assert scope-correctness of component references and read as duplication on a first pass; they are not. AC-960 sweeps every **tracked** text file, and the workspace document is generated and never committed — AC-963 says so (*"the one produced now, never a copy of it committed to the repository"*). Disjoint surfaces. Unchanged from the same note in two prior reports | none |

## Notes for the Editor

- **There is one repair to make: AC-978.** Findings 2 and 3 are warnings and do
  not gate the level; both are one-paragraph deferrals of the kind the AC-1036
  repair just demonstrated, and can be taken in the same pass. Nothing else
  requires action.

- **AC-978 is now the oldest unrevised element in this capability**, in exactly
  the position AC-966 occupied before today. AC-966 was an AC frozen at
  2026-08-07 under REQ-119 (2026-07-31); AC-978 is an AC frozen at 2026-08-16
  under REQ-145 (2026-08-15), whose reconciliation batch landed on 2026-08-31 as
  AC-1399…AC-1403 and passed AC-978 by. It is worth checking whether any *other*
  2026-08-16-stamped AC describes a served-route topology; AC-979 was checked
  this run and is fine (it speaks of channels and components as *request
  targets*, not as trees, so REQ-145 did not invalidate it).

- **Do not repair finding 1 by deleting the identical-outcome clause.** The
  clause is the reason the criterion exists — confinement present on one prefix
  and absent on another is the failure it rules out. The repair is to make the
  list match what is served, not to drop the guarantee because the list shrank.

- **Downstream consequence for the uat cycle, flagged not fixed.**
  `tests/reconciliation-builder-workspace-origin.test.ts:202-235` is AC-978's
  evidence. It probes exactly the two trees the stale criterion names plus the
  channels, and gates the components probe on `WEBUI_INSTALLED` with an
  `unverified(...)` report. When AC-978 gains the `/framework/` prefix, that
  test needs a third probe group — a `uat-edit`, not an ac-level change.
  Separately and independently: AC-964's Verification demands *"Include the
  build artifact explicitly"* as an unadmitted probe, and its evidence
  (`tests/reconciliation-builder-workspace-origin.test.ts:688-748`) makes the
  unadmitted probe against `/preview/...` only, never against an artifact. That
  is a `uat-edit` for the uat cycle and is **not** counted as an ac-level
  finding here.

- **Method note, still applicable.** `tools/generate/src/cli/builder.ts`
  contains NUL bytes and is treated as binary by `grep`; use `grep -a`. The
  serving path cited in finding 1 (`:149`, `:159`, `:181-185`) was read
  directly rather than grepped for that reason.

- **Provenance, fourth time raised.** No `intent_uid` on the capability or on
  any of its 36 ACs, and a scalar `updated_by` on STORY-99. Finding 1 — like
  finding 1 of the previous report — is mechanically an AC whose last revision
  predates the intent that superseded it, and would be visible in one query with
  those fields populated instead of costing a fourth reconstruction of the
  ledger. This is an operator decision (a backfill), not an ac-level fix.
