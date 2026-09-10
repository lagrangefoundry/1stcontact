---
uid: report-89cba15c
id: REPORT-3709
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T09:47:19.226094+00:00'
updated_at: '2026-09-10T09:47:19.226094+00:00'
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

**Cascade note.** The story-level cycle for this capability ran ~10 minutes
before this check and **PASSED** — REPORT-E9695D41 (`report-e9695d41`,
2026-09-10T09:39Z, 0 violations, 0 needs_review), after REPORT-12605DBA
(`report-12605dba`, 3 violations) was repaired by `report-f037e464`. The
STORY-99 body and the CAP-85 body are therefore clean working references for
this check, and were used as such. Intent history was consulted only where an
AC's premise appeared to contradict the story body (finding 1).

**Attempt note.** `previous_attempt_count` = 3. The last check at *this* level
was REPORT-5A4CF7A4 (`report-5a4cf7a4`, 2026-08-16T09:43Z, 3 violations, 4
warnings) and **no `fix_structural_validation` report at level=ac exists after
2026-08-07** — that report's findings were never routed to an ac-level fix
loop. Two of its three violations have since been dissolved by work done at the
story level (see Findings 4 and 5, info). The third has not, and is finding 1
below, re-derived independently against today's ticket state rather than
carried forward on trust.

## Cumulative Intent Considered

Chronological ledger of intents that have touched this capability's tree.
Ordered by `created_at`; `merged_at_commit` given where the bundle carries one.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-115 | `request-a6740b4a` | free_and_reconciled | 2026-07-31 → 08-07 | Builder shell: webui consumption, `site` tab, multi-mode display panel, toolbar. Origin of AC-959…AC-979 | YES |
| REQ-117 | `request-395b67e6` | free_and_reconciled | 2026-07-31 → 08-07 | Copy editing end-to-end. Lands here only as *bytes and operations reachable on this origin*; semantics deferred to CAP-86/CAP-87 (see findings 4, 5) | YES |
| REQ-119 | `request-64864801` | free_and_reconciled | 2026-07-31 → 08-10 | **Request-time draft and edit renders.** One production, writer + reader, *no rendered artifact for the workspace to serve*, reuse keyed on the definition, invalid draft surfaced, `published` untouched. Origin of AC-1031…AC-1036 | YES |
| REQ-44 | — | free_and_reconciled | 2026-08-07 | Install preflight; builder explicitly ungated — no ask lands here | YES (no ask) |
| BUNDLE-16 | `bundle-15c1f647` | free_and_reconciled | 2026-08-07 (`1741ee5d`) | REQ-117 + REQ-115 + REQ-44; the `intent_uid` of STORY-99 | YES |
| BUG-32 | `bug-5cabb340` | merged | 2026-08-05 | Component scope rename in lockstep; one definition site; browser-source exception; consumption evidence made unconditional. Window in which AC-1030 was authored | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | 2026-08-08 | Toolbar re-derives on mode **and** site; a replaced control is a detached, inert survivor. Origin of AC-1110 | YES |
| REQ-122 | `request-58b6a329` | free_and_reconciled | 2026-08-07 | Builder chat panel — the *content* of the secondary pane. Owned elsewhere; AC-973 correctly excludes it | YES (elsewhere) |
| REQ-145 | `request-b474390f` | **free_and_reconciled** | 2026-08-15 | control-app becomes the builder: client/components/bridges as build artifacts, one route table, L1 render in workerd, proxy deleted. Origin of AC-1399…AC-1403. *(Was `draft` at the last ac-level check; it has since landed — the "origin runs outside the edge Worker" clause that check protected is now correctly gone from STORY-99.)* | YES |
| REQ-147 | `request-23fd6e61` | free_and_reconciled | 2026-08-15 | Access on `app.1stcontact.io`. Qualifies every criterion here ("an admitted caller"); the gate's own shape is CAP-8x's | YES (qualifier) |
| REQ-149 | `request-554ac441` | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions, history, rendered output with no filesystem. Retires the 501 deferral; `published` redirects | YES |
| BUG-36 | `bug-db356ff8` | free_and_reconciled | 2026-08-23 | Fresh deployment 503s: two store openers collapsed to one; cold-start registers the configured account. Origin of AC-1449; narrows AC-965; adds the single-opener clause of AC-1402 | YES |
| BUG-37 | `bug-6612c4b7` | free_and_reconciled | 2026-08-24 | Render cache dead at the deployed origin — measured, and **deliberately not fixed**. Withdraws the "equivalent there" claim; reuse re-described where it is real | YES |
| BUG-38 | `bug-a98fb3b0` | free_and_reconciled | 2026-08-24 | Builder chat turn failures — CAP for the assistant pane, not this one | YES (elsewhere) |
| BUNDLE-20 | `bundle-b3b7c399` | free_and_reconciled | 2026-08-31 | The relocation bundle; reconciled into STORY-99's first Reconciliation Decisions block | YES |
| BUNDLE-21 | `bundle-78f4e2fe` | free_and_reconciled | 2026-08-26 → 08-31 (`96a76934`) | BUG-36 + BUG-37 + BUG-38; the `updated_by` of STORY-99 | YES |
| REQ-154 | `request-b88b79fe` | **bundled** | 2026-08-20 | Browser Rendering driver. Touches this origin only as a *consumer* of the exported preview renderer (`router.ts:121`); asks nothing of this matrix | imminent (no ask) |
| REQ-112 | — | **abandoned** | 2026-08-08 | — | NO |

**Provenance caveat, repeated from both prior checks and still true.** Neither
CAP-85 nor any of its 36 ACs carries an `intent_uid`; `updated_by` on STORY-99
is a scalar holding only the most recent updater (`bundle-78f4e2fe`). Every
per-element intent attribution in the ledger below was reconstructed from AC
creation timestamps correlated against intent completion windows and from the
story's own Reconciliation Decisions blocks — **not read from the matrix**.

## Alignment Ledger

All 36 ACs are `status: active`, `kind: behavior`, `regression_only: false`.
Grouped by the STORY-99 in-scope bullet they answer to.

| Element(s) | Intents aligned to | Outcome |
|---|---|---|
| AC-959, AC-975, AC-976 — one tab, filling the window, whole tab declaration honoured | REQ-115 | aligned |
| AC-960 — one definition site for every shown name, and for the component scope | REQ-115, BUG-32 | aligned |
| AC-961, AC-962, AC-963 — components consumed not copied; missing one names its install command; referenced through declared entry points | REQ-115, BUG-32, REQ-145 (moment moved to build time, folded not duplicated) | aligned |
| AC-1030 — resolution anchored at the main checkout; same installed copy from any working tree | BUG-32 | aligned |
| AC-964 — one origin, nothing reinterpreted, unadmitted caller gets none of it | REQ-115, REQ-145, REQ-147 | aligned (see finding 5, info — the former proxy clause is correctly gone) |
| AC-965 — no account named / account deactivated are distinct explanatory failures | REQ-115, **narrowed by BUG-36** | aligned; the third case was correctly removed and re-homed to AC-1449 |
| AC-1449 — schema-only store serves, registering exactly the configured account | BUG-36 | aligned |
| AC-966 — view mode byte-identical **to the rendered artifact** | REQ-115, **superseded by REQ-119** | **stale: asserts an artifact-serving model REQ-119 replaced, and excludes the shipped mechanism by name** — violation 1, warning 2 |
| AC-967, AC-1029 — selector lists exactly the store; editable mode registered and composes with site | REQ-115, REQ-119 | aligned |
| AC-968, AC-969 — mode switch preserves the pane; a never-heard-of mode works end to end | REQ-115 | aligned |
| AC-970, AC-1110 — strip is derived state on mode *and* site; a replaced control is inert | REQ-115, BUG-33 | aligned |
| AC-971, AC-972 — open-in-new-tab targets the displayed document; publish through the existing path | REQ-115, REQ-149 | aligned |
| AC-973, AC-974 — split geometry, collapse-to-rail, namespaced persistence | REQ-115, REQ-122 (content excluded) | aligned |
| AC-977 — non-cacheable stamped by the route table, through every front door | REQ-119, REQ-145 | aligned |
| AC-978, AC-979 — confinement on every served tree; unknown channel/component is not found | REQ-115 | aligned |
| AC-1031, AC-1032 — channels answer with no artifact on disk and write nothing back; one render backs both the written artifact and the served bytes | REQ-119 | aligned (and jointly own what AC-966 mis-states) |
| AC-1033 — a definition changed anywhere shows on the next request; two workspaces never share a rendering | REQ-119, **amended by BUG-37 today** | aligned — the reuse paragraph now distinguishes the local front door from the deployed origin; verified byte-identical Verification section |
| AC-1034, AC-1035 — invalid draft reported in the pane; `published` from publish time only | REQ-119, REQ-149 | aligned |
| AC-1036 — a channel address resolves the same addresses and never leaves its channel | REQ-119 | aligned; confinement half re-runs AC-978's probe — warning 3 |
| AC-1399 — no local process: the deployed workspace serves, lists and renders | REQ-145 | aligned |
| AC-1400 — client, components and bridges are build artifacts, behind the gate, never resolved per request | REQ-145, REQ-147 | aligned |
| AC-1401 — the builder command is a transport over the one route table, local store by default | REQ-145 | aligned |
| AC-1402 — copy-up is idempotent, whole-or-nothing, through the one opener, with no privilege | REQ-145, BUG-36 | aligned |
| AC-1403 — inline boot guard names the cause and a fix; never overwrites a slow success | REQ-145 | aligned |

**Coverage of the STORY-99 body is complete.** Every in-scope bullet maps to at
least one AC: single origin → AC-964, AC-971, AC-1399; admitted caller only →
AC-964, AC-1400; components consumed/build artifacts → AC-961, AC-962, AC-963,
AC-1030, AC-1400; scope written once → AC-960; one tab filling the window →
AC-959, AC-975, AC-976; panel modes → AC-968, AC-969, AC-1029; toolbar →
AC-970, AC-967, AC-971, AC-972, AC-1110; request-time channels → AC-1031…
AC-1036; two front doors → AC-1401; copy-up → AC-1402; split + persistence →
AC-973, AC-974; freshness → AC-977; confinement → AC-978, AC-979, AC-1036; boot
guard → AC-1403; configuration failures → AC-965, AC-1449. The Technical
Context passages stated as criteria of their own — the checkout anchoring and
the two origin failure modes — are AC-1030 and AC-965/AC-1449 respectively.
**No coverage gap was found at this level.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-966 (`acceptance_criterion-6fb2bebc`) | ac-edit | **AC-966 asserts the model REQ-119 replaced, and excludes the shipped mechanism by name.** Its criterion reads: *"The bytes served for the displayed page are identical to **the rendered artifact the platform produced** for that site and channel — not a placeholder, **a re-generation**, or a differently-serialised copy."* Both halves are false of what ships. (a) The premise that an artifact exists to be served is contradicted by its own sibling AC-1031 (`acceptance_criterion-e9a9ba3b`), *"With no rendered output anywhere on disk for a site, the workspace origin still answers for both of that site's draft-side channels"*, and by the STORY-99 body: *"The draft-side channels are produced on request, not fetched off a shelf … **There is no rendered artifact for the workspace to serve**"*. (b) The exclusion "a re-generation" names the mechanism the origin actually uses: `apps/control-app/src/router.ts:576-578` — *"`draft` and `edit` render **ON REQUEST** from the stored definition, now in workerd"* — reached via `servePreview(await openStore(), …)` at `router.ts:599`. The served bytes **are** a re-generation; they are byte-equal to what the render command writes by construction, which is AC-1032's claim, not an artifact-serving claim. The evidence follows the stale wording verbatim: `tests/reconciliation-builder-workspace-origin.test.ts:121-147` repeats the exclusion as a comment at :122-124 and asserts against `storage/dist/sites/alpha/draft/index.html` on disk, which exists only because the suite's `makeWorkspace` pre-renders it (:88-96). AC-966 was authored 2026-08-07 under REQ-115 and its criterion prose has **never been revised** (`last_field_updated: uat_coverage`, content unchanged since 2026-08-07T01:44). REQ-119 (`request-64864801`, free_and_reconciled, merged 2026-08-10) superseded it and the seven ACs authored that day were written correctly against the new model. First raised as violation 1 of REPORT-5A4CF7A4 (2026-08-16); no ac-level fix loop has run since | Rewrite AC-966 to the one claim that is both true and unique to it — *with a site selected, the display panel displays that site's rendering in the active mode* — and **delete the exclusion list**, which names the shipped mechanism. Move the byte-identity claim out entirely: AC-1032 (`acceptance_criterion-46534535`) already owns it, for **both** channels and **every** artifact including `theme.css`; move the asset clause to AC-1031, which already reads the stylesheet href out of the document. Re-point the Verification the same way. **Acceptable alternative:** if the editor concludes nothing unique survives the fold — AC-967 (`acceptance_criterion-92c52943`) already asserts *"Choosing a different option changes the document the pane displays to that site's rendering in the current mode"*, and AC-1029 asserts mode × site composition — then `ac-deprecate` AC-966 instead, naming AC-967, AC-1029, AC-1031 and AC-1032 as its successors. Do **not** leave the exclusion standing under either route |
| 2 | warning | exclusivity | AC-966 vs AC-1032 (`acceptance_criterion-46534535`) and AC-1031 (`acceptance_criterion-e9a9ba3b`) | ac-edit | The same repair as finding 1, seen from the exclusivity side. AC-966's evidence is a **strict subset of AC-1032's, in the same test shape**: AC-966 fetches one page of one channel and compares it to one file, then globs `.css`/`.js` siblings out of the output directory (`tests/reconciliation-builder-workspace-origin.test.ts:126-146`); AC-1032 iterates **both** draft-side channels, asserts the artifact set exceeds the pages alone and contains `theme.css`, compares **every** artifact byte-for-byte, and asserts the channel root equals `index.html`'s bytes (`tests/reconciliation-builder-request-time-render.test.ts:218-266`). AC-966's asset clause is the second assertion of AC-1031, which additionally resolves the stylesheet from the document's own `href` rather than from a directory listing | Fold as in finding 1. This warning closes with it and needs no separate action |
| 3 | warning | exclusivity | AC-1036 (`acceptance_criterion-46e9debf`) vs AC-978 (`acceptance_criterion-53c66f17`) | ac-edit | AC-1036's second paragraph — *"An address that walks out of the site's own assets, in plain or percent-encoded form, is not satisfied and returns none of the targeted file's contents"* — re-states, for the rendered-channels tree, exactly what AC-978 already asserts for **all three** served trees: same traversal forms including percent-encoded, same non-delivery guarantee, same wording ("none of the targeted file's contents"). Same scenario in the same shape, which the level's exclusivity rule distinguishes from acceptable multi-shape coverage. AC-1036's genuinely distinct content is its *addressing* claim (directory address → home page, extensionless → page, the two panel addresses unchanged) plus the unknown-page and unknown-site probes AC-978 does not make. Carried forward from warning 5 of REPORT-5A4CF7A4, still unrepaired | Narrow AC-1036's second paragraph to the claims AC-978 does not make — a page the channel does not contain, and a site the store does not hold, answered as not found rather than from a neighbour — and defer the traversal probes to AC-978. **Or**, if the re-run is deliberate, say so in AC-1036: its opening sentence already frames the AC as invariance across the relocation (*"Where a channel's bytes are decided does not change which addresses resolve"*), and extending that framing explicitly to the confinement paragraph would make the duplication a stated choice rather than an accident |
| 4 | info | coverage | CAP-85 body / STORY-99 ACs — the editing client and the write-path transport | — | Violations 2 and 3 of REPORT-5A4CF7A4 (`ac-add`: no AC asserts the origin serves `/framework/edit-client.js` from the renderer's own source, and no AC asserts `/api/copy` as a semantics-free transport) are **dissolved, correctly**. `report-f037e464` resolved them today in the "narrow the capability body" direction that both prior reports identified as the only non-duplicating option: the CAP-85 body now reads *"That the editing client is built from the same source the renderer is built from … is CAP-87's property (AC-1006); that what the write path reads, writes and refuses is unchanged when it is reached over this origin … is CAP-86's (AC-992)."* **No AC must be authored here** — doing so would convert two closed coverage findings into two exclusivity violations against AC-1006 (`acceptance_criterion-a5d4eb9c`) and AC-992 (`acceptance_criterion-9561711e`). Recorded so a future check does not re-open them | none |
| 5 | info | consistency | AC-964 (`acceptance_criterion-46d5804e`), AC-965 (`acceptance_criterion-5286c04b`) | — | Warnings 6 and 7 of REPORT-5A4CF7A4 are resolved by work that landed since. **AC-964:** its Verification omitted the browser source from the route list; REQ-145 made the browser source a *build artifact*, and AC-964's Verification now names *"a component or build artifact"* as a route class and asserts it explicitly against an unadmitted caller — the omission is closed by reclassification rather than by enumeration. Its former proxy clause is gone and it now states why it survived the move. **AC-965:** it had no anchor in the STORY-99 body; the body now expresses both failure modes in Technical Context (*"A store that cannot be constructed is a configuration failure and keeps its own status"*, and *"it resolves not yet, never no: a deactivated account … is refused explicitly"*) and in the 2026-08-31 Reconciliation Decisions block that narrowed it. The story-level cycle passed on that body today | none |
| 6 | info | exclusivity | AC-1402 (`acceptance_criterion-d541fbe9`) vs AC-1449 (`acceptance_criterion-2180afc8`) | — | Their Verifications overlap: AC-1402 says *"Copy a site up to a deployment whose store holds only the schema and no account … Then assert a plain read of an equally fresh deployment lands too"*, and AC-1449 says *"Repeat the cold start against a second, equally fresh account name, driving a route that copies a site up rather than one that reads"*. Judged **not** a duplicate: STORY-99's Reconciliation Decisions block explicitly reconciles this — *"The cold start is stated as a criterion of its own rather than folded into the narrowed one … they are opposite outcomes with different evidence"* and *"The single opener is stated on the copy-up criterion rather than left as an accident"*. The subjects are distinct (AC-1402 owns the copy route's idempotency, atomicity and lack of privilege; AC-1449 owns the registration's four bounds), and each needs the other's probe as a control. Recorded so the overlap is on the record as deliberate | none |
| 7 | info | exclusivity | AC-960 (`acceptance_criterion-13d252a9`) vs AC-963 (`acceptance_criterion-78436279`) | — | Both assert scope-correctness of component references and read as duplication on a first pass. They are not: AC-960 sweeps every **tracked** text file, and the workspace document is generated and never committed — AC-963 says so explicitly, *"the one produced now, never a copy of it committed to the repository"*. Disjoint surfaces; both needed. Re-verified against current bodies; unchanged from the same note in REPORT-5A4CF7A4 | none |
| 8 | info | consistency | AC-1033 (`acceptance_criterion-ae33f0ab`) | — | Verified the BUG-37 amendment landed correctly and did not overreach. The criterion's reuse paragraph now reads *"That key is chosen for isolation, not for cost"* and a new paragraph states the deployed origin builds a fresh store per request so *"the reuse is never hit and no rendering is reused there"*, deferring the deployed origin's cheapness to the store port. The negative guarantee (*"two workspaces never share a rendering"*) and the entire Verification section are unchanged, as REPORT-12605DBA finding 1 required. Confirmed against `apps/control-app/src/router.ts:82` (`PREVIEWS` keyed on `TenantSiteStore`) and `apps/control-app/src/store.ts:79-96` (`storeFor` constructs per request) | none |

## Notes for the Editor

- **There is one repair to make.** Findings 1 and 2 are the same edit to AC-966
  seen twice. Nothing else at this level requires action to reach a pass;
  finding 3 is a warning and may be taken opportunistically in the same pass,
  since it is also a one-AC prose edit and has now stood through two checks.

- **AC-966 is the last surviving element of the pre-REQ-119 matrix.** Every
  other AC in this capability has been revised at least once since 2026-08-07;
  AC-966's criterion prose has not. The seven ACs authored on 2026-08-10 under
  REQ-119 (AC-1029…AC-1036) were written correctly against the request-time
  model and collectively absorbed AC-966's content — which is why the fold is
  clean and why no coverage is lost by narrowing or deprecating it. Check the
  editor does not "repair" it by weakening AC-1032 to match.

- **The evidence will move with the AC, and should.** `tests/reconciliation-builder-workspace-origin.test.ts:121-147`
  currently repeats AC-966's stale exclusion as a comment and asserts against a
  pre-rendered file on disk. If AC-966 is narrowed to the display-panel binding,
  that test is asserting something the AC no longer claims and belongs to the
  `uat` cycle as a `uat-edit`; if AC-966 is deprecated, the test's assertions
  are already made more strongly by
  `tests/reconciliation-builder-request-time-render.test.ts:218-266`. Either way
  this is a **downstream** consequence — flagging it so the uat-level cycle is
  not surprised, not asking for a test change here.

- **This check did not re-open the two capability-body deferrals** (finding 4).
  They were resolved at the story level today in the direction both prior
  ac-level and story-level reports converged on. Re-raising them as `ac-add`
  would be a regression of that decision.

- **Method note, still applicable.** `tools/generate/src/cli/builder.ts`
  contains NUL bytes and is treated as binary by `grep`; a plain recursive grep
  over the origin's routes returns nothing from it. Use `grep -a`. The routes
  read for this check were in `apps/control-app/src/router.ts`, which is plain
  text, but the older builder front door is not.

- **Provenance remains the standing cost of checking this capability.** No
  `intent_uid` on the capability or on any of its 36 ACs, and a scalar
  `updated_by` on the story. The ledger above was reconstructed for the third
  time from creation windows and the story's own Reconciliation Decisions
  blocks. Backfilling those fields would make the next check at any level
  materially cheaper and would have made finding 1 — a 2026-08-07 AC under a
  2026-08-10 intent — mechanically visible instead of requiring the
  reconstruction.
