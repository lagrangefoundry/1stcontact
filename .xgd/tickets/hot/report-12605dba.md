---
uid: report-12605dba
id: REPORT-3706
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-09-10T09:27:11.514951+00:00'
updated_at: '2026-09-10T09:27:11.514951+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 3
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 2
**Needs review**: 0

The capability has exactly one story (STORY-99, `story-e674c60a`, `story_kind:
upgrade`, 36 ACs). Intra-capability exclusivity is therefore trivially satisfied
and every coverage question reduces to "does this one story body express it";
exclusivity was checked *across* capabilities instead.

The story was substantially rewritten on 2026-08-31 to absorb BUNDLE-20 and
BUNDLE-21, and that rewrite is largely sound — the workerd relocation, the
deleted proxy, the build artifacts, the Access qualification, the cold-start
bootstrap and the narrowed configuration-failure criterion are all correctly
reflected. The three violations below are (a) two capability-body over-claims
first reported on 2026-08-16 (REPORT-2100, `report-4d9be4ea`) that no fix loop
ever ran against — there is no `fix_structural_validation` report for this
capability after 2026-08-07 — and (b) one item of BUNDLE-21 that the 2026-08-31
reconciliation missed.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Neither the
capability nor any of its 36 ACs carries an `intent_uid`, and STORY-99's
`fields.updated_by` holds only the latest updater (`bundle-78f4e2fe`), so the
ledger was reconstructed from bundle membership, AC creation windows and the
story's own "Reconciliation Decisions" provenance headers.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-32 (`bug-5cabb340`) | merged | 2026-08-05 | `@gendevlabs` → `@lagrangefoundry` in lockstep; scope gets one definition site; browser-source declared exception; consumption evidence unconditional | YES |
| BUNDLE-16 (`bundle-15c1f647`) = REQ-115 + REQ-117 + REQ-44 | free_and_reconciled | 2026-08-07 (`1741ee5d`) | Origin, chrome, display panel, toolbar, split, publish, confinement. REQ-117 also built `/api/copy` and `/framework/edit-client.js`; REQ-44 leaves `builder` ungated | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-08 | Toolbar re-derives on mode **and** site; a replaced control is a detached, inert survivor | YES |
| REQ-119 (BUNDLE-17 `bundle-e59210c5`) | free_and_reconciled | 2026-08-10 | Request-time draft/edit renders; one render implementation; no artifact on disk; reuse memoised on the definition; invalid draft surfaced; `published` untouched | YES |
| REQ-122 (BUNDLE-17) | free_and_reconciled | 2026-08-10 | Builder chat panel — the secondary pane's *content*; owned by CAP-91, correctly excluded here | YES (elsewhere) |
| BUNDLE-20 (`bundle-b3b7c399`) = REQ-147 + REQ-143 + REQ-145 + REQ-146 + REQ-148 + REQ-149 + REQ-150 + REQ-151 + REQ-152 + REQ-153 | free_and_reconciled | merged `eef7a8b4`, completed 2026-08-31 | REQ-145: control-app *becomes* the builder — client/components/bridges as build artifacts, routes and L1 render in workerd, **proxy deleted**. REQ-147: Cloudflare Access in front of the deployed origin. REQ-149: publish graduates from its 501. REQ-148: behaviour modules are plain functions. REQ-143/146/150/151/152/153 touch other capabilities | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) = BUG-36 + BUG-37 + BUG-38 | free_and_reconciled | merged `96a76934`, 2026-08-26 | BUG-36: one opener, register-if-absent, cold-start serves. **BUG-37: assembled-definition memo keyed `(tenantId, slug)` in the D1 adapter, and the `PREVIEWS` render cache is dead in the Worker — deliberately left unfixed.** BUG-38: chat sessions | YES |
| BUNDLE-22 (`bundle-8eef3846`) = BUG-39 + REQ-154 | free_and_reconciled | 2026-08-31 | REQ-154 resolved by request *interception* inside the Worker — "No HTTP route answers the screenshot capability". BUG-39 is chat-host test doubles | YES (no ask here) |
| REQ-162 (`request-13a5e206`) | free_and_reconciled | 2026-08-31 | Product ticket store; `1c assets` emits a ticketing shim; `tickets.ts` is typed but "no route reaches them yet" | YES (no ask here) |
| REQ-158, REQ-161 | **draft** | 2026-08-28 / 08-31 | KB surface on the builder; a second ("Library") tab | NO — not yet active. STORY-99's single-tab claim and `TABS = [SITE_TAB]` (`apps/control-app/src/builder/config.js:50`) are therefore still current |
| REQ-155, 156, 157, 159, 160, 163–166 | **draft** | 2026-08-20 … 08-31 | Capture/fidelity/KB/ingestion | NO |
| REQ-112, REQ-134, BUNDLE-12, BUNDLE-15 | **abandoned** | 2026-08-06/08/12 | — | NO |

**No reconciled intent has landed since the story's last update (2026-08-31).**
The cumulative picture has not moved under the story; the gaps below are gaps in
what the 2026-08-31 rewrite absorbed, not staleness accrued since.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — one origin, the deployed edge runtime; proxy deleted | REQ-145 | aligned (verified: no `BUILDER_ORIGIN`/forwarding handler survives in `apps/control-app`) |
| STORY-99 — admitted-caller qualification, gate itself out of scope | REQ-147 | aligned |
| STORY-99 — component consumption: installed copy, declared entry points, never vendored, install diagnostic | REQ-115, BUG-32 | aligned |
| STORY-99 — scope written once, browser-source declared exception | BUG-32 | aligned |
| STORY-99 — working-tree anchoring, four checkout shapes, directory equality | BUG-32 window | aligned |
| STORY-99 — client, components and bridges are build artifacts, served behind the gate by falling through last | REQ-145 | aligned (AC-1400) |
| STORY-99 — one tab, viewport fill, page never scrolls | REQ-115, REQ-117 | aligned (`TABS = [SITE_TAB]`) |
| STORY-99 — display panel modes; registration is an added entry; mode switch preserves the pane | REQ-115 | aligned |
| STORY-99 — toolbar derived from mode **and** site; replaced control inert | REQ-115, BUG-33 | aligned (`toolbar.js:101` subscribes to both) |
| STORY-99 — split geometry and persistence, namespaced storage | REQ-115 | aligned |
| STORY-99 — request-time draft/edit channels, one render, no artifact, invalid draft surfaced, `published` from publish time | REQ-119 | aligned |
| STORY-99 — two front doors, one route table; local default store | REQ-145 | aligned (AC-1401) |
| STORY-99 — copy-up through the one opener; no privilege the other routes lack | BUG-36 | aligned (AC-1402) |
| STORY-99 — cold start: schema-only store serves, registers, lists empty | BUG-36 | aligned (AC-1449) |
| STORY-99 — configuration failure narrowed to two cases | BUG-36 | aligned (AC-965) |
| STORY-99 — inline boot guard | REQ-145 | aligned (AC-1403) |
| STORY-99 — confinement clamps; refusal reads as not-found | REQ-115 | aligned |
| STORY-99 — freshness / non-cacheable stamped by the route table | REQ-119 | aligned |
| STORY-99 — publish invoked, semantics owned elsewhere; 501 deferral retired as a design rule | REQ-149 | aligned |
| STORY-99 — **"the reuse is now held against the store handle … the deployed origin has one store per account, so the two are equivalent there"** | REQ-119, **contradicted by BUG-37** | **gap: BUG-37 measured and recorded the opposite, and declined to fix it** |
| CAP-85 body — **"the shared client code the editing gesture runs in the displayed page (served from the same source the renderer is built from, so the two cannot drift)"** | REQ-117 | **gap: owned and proven under CAP-87 (AC-1006); STORY-99 and all 36 ACs correctly omit it, so the capability body over-claims** |
| CAP-85 body — **"carrying the write path's read/apply operations as a thin transport … so that a refused edit arrives as an expected refusal in the write path's own terms"** | REQ-117 | **gap: owned and proven under CAP-86 (AC-992); STORY-99 and all 36 ACs correctly omit it, so the capability body over-claims** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-99 (`story-e674c60a`) Technical Context, "The staleness rule went with the artifact, and the reuse key moved" + AC-1033 (`acceptance_criterion-ae33f0ab`) | story-body-edit + ac-edit | Both assert that a rendering is reused between requests, held against the store the request reads through, and that "the deployed origin has one store per account, so the two are equivalent there". BUG-37 (`bug-6612c4b7`, free_and_reconciled, BUNDLE-21 `96a76934`) states the opposite as a measured, confirmed finding: *"The `PREVIEWS` WeakMap render cache is dead in the Worker — NOT fixed here, deliberately. `apps/control-app/src/router.ts` keys the cache on the store OBJECT, and `storeFor` builds a fresh handle per request, so the key is new every time. Confirmed empirically: five consecutive `/preview/xgd/draft/` requests at ~77 ms with no amortisation."* The code agrees with BUG-37, not with the story: `apps/control-app/src/store.ts:79-83` documents `storeFor` as *"Constructed per request rather than memoised per isolate"* and `storeFor` (`store.ts:85-96`) builds a new `d1r2SiteStore` on every call. So cross-request render reuse exists only behind the Node front door; at the deployed origin — where the story's own "wasteful" rationale is meant to bite — it never happens, and BUG-37 recorded that as an accepted trade (re-keying would carry a tenant check that predates the request). The story's 2026-08-31 "Reconciliation Decisions" block absorbed BUG-36 in detail and BUG-37 not at all | Rewrite the passage so the reuse is described where it is real: the reuse is keyed on the store the request reads through, which the local front door holds for a workspace's life and which the deployed origin rebuilds per request, so at the deployed origin no rendering is reused and the cost is instead avoided by the store adapter memoising the *assembled definition* against the site's write version (BUG-37, expressed under CAP-101 as AC-1447/AC-1448). Record BUG-37's deliberate non-fix — re-keying would trade the per-request tenant check — as a Reconciliation Decision. Amend AC-1033's criterion prose the same way; its negative guarantee ("two workspaces never share a rendering") and its two-local-workspace verification remain correct and should not change |
| 2 | violation | coverage | CAP-85 (`capability-a994b8f3`) capability body, "The workspace origin" scope bullet | story-body-edit (capability body) | The body scopes to this capability "the shared client code the editing gesture runs in the displayed page (served from the same source the renderer is built from, so the two cannot drift)", and its Out-of-scope section reinforces "this one owns only that those bytes are served from this origin". Neither STORY-99's body nor any of its 36 ACs expresses it. Applying Step 2.5: the behaviour **is** implemented and substantively tested — it is owned by CAP-87 (`capability-12fee326`) as AC-1006 (`acceptance_criterion-a5d4eb9c`), *"The browser runs one implementation of the click-to-address resolution, delivered from the same source the rendering's stamping is defined against … delivered as a runnable browser module by the workspace's origin"*, proven by `test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source` (`tests/reconciliation-copy-edit-gesture.test.ts:844`). So the citation of ownership is wrong, not the behaviour. Within CAP-85, `/framework/edit-client.js` appears only incidentally, as a row in AC-977's non-cacheable sweep and AC-979's not-found sweep. This was violation #1 of REPORT-2100 (`report-4d9be4ea`, 2026-08-16) and has stood unrepaired through two reconciliation rounds because no fix loop ran against it | Narrow the capability body: replace the parenthetical with a deferral naming CAP-87 — this capability owns that the bytes are *served from this origin*, and the one-source/no-drift property is CAP-87's (AC-1006). **Do NOT add an AC to STORY-99**: AC-1006 already asserts and proves it, and a second copy would be an exclusivity violation |
| 3 | violation | coverage | CAP-85 (`capability-a994b8f3`) capability body, "The workspace origin" scope bullet and "Edit semantics" out-of-scope bullet | story-body-edit (capability body) | The body scopes here "carrying the write path's read/apply operations as a thin transport that adds no semantics of its own, so that a refused edit arrives as an expected refusal in the write path's own terms", and Out-of-scope reinforces "this one owns only that those operations are reachable over the workspace origin, as a transport that changes none of it". Neither STORY-99's body nor any of its 36 ACs expresses it; STORY-99's Out-of-scope pushes "the write path behind it" away without retaining the transport claim. Applying Step 2.5: the route exists (`apps/control-app/src/router.ts:516-573`, `/api/copy` GET/POST as "thin transports over `editCopyGet`/`editCopySet` — the same functions `1c copy get\|set` dispatches to"), and the behaviour is owned by CAP-86 (`capability-f753cecd`) as AC-992 (`acceptance_criterion-9561711e`, *"Editing through the builder's origin is the same surface: a rejected edit returns the validator's own fault"* — "answered as a client fault … carrying the same code, path and hint the command line reports"), proven by `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (`tests/reconciliation-copy-edit-write-path.test.ts:727`) and `test_UAT_AC992_the_origin_is_the_same_surface_for_words_and_for_images_alike` (`tests/reconciliation-copy-edit-image-selection.test.ts:712`). This was violation #2 of REPORT-2100 and is likewise unrepaired | Narrow the capability body: state that the workspace origin *hosts* the write path's operations and that what they read, write and refuse — including the shape of a refusal — is CAP-86's (AC-992). **Do NOT add an AC to STORY-99** for the same exclusivity reason as finding 2 |
| 4 | warning | consistency | STORY-99 Technical Context / `apps/control-app/src/router.ts:76-77` | story-body-edit | The router's own comment on `PREVIEWS` repeats the claim finding 1 refutes — *"The Worker has one store per tenant per isolate, so the two are equivalent there"* — while `store.ts:79` documents the opposite decision. No behaviour differs (the cache is simply never hit in the Worker), and reconciliation changes no runtime code | Add a "Divergence noted, in commentary only" entry, in the same form the story already uses for `toolbar.js:100`, so the stale comment is on the record rather than read as a second opinion about the cache's lifetime |
| 5 | warning | consistency | STORY-99 "Reconciliation Decisions" provenance header | story-body-edit | The header reads *"Recorded 2026-08-31, reconciling BUNDLE-21 (`bundle-78f4e2fe`), item 2"*, but every decision beneath it addresses BUG-36 — the bundle's **item 1** (the bundle body opens with "## BUG-36"). Item 2 is BUG-37, which has no entry at all; the mislabel is what makes finding 1 look already-reconciled at a glance | Correct the header to name BUG-36, and add the BUG-37 entry finding 1 calls for |
| 6 | info | exclusivity | AC-962 (CAP-85) vs AC-1330 (CAP-102, `capability-5d07b533`) | — | Both end in "names the command that installs it". They are not duplicates: AC-962 is about the single resolution point raising one diagnostic naming the missing component; AC-1330 is the environment preflight reporting *every* component and package with counts and an environment-specific exit code. Different subjects, different shapes | none |
| 7 | info | exclusivity | AC-1402 (CAP-85) vs AC-1394 (CAP-101, `capability-c4c7a854`) | — | AC-1402 is the origin's copy-up route (idempotent, whole-or-nothing, no privilege the other routes lack); AC-1394 is the store port's whole-draft copy between any two stores. Consumer and port — acceptable layering, not a duplicate | none |
| 8 | info | consistency | STORY-99 "Divergence noted, in commentary only" | — | Verified still accurate: `apps/control-app/src/builder/toolbar.js:100` reads "Re-render on every mode change" while line 101 is `[panel.on('mode', render), panel.on('site', render)]` and the docstring at line 42 says "on every mode and site change" | none |

## Notes for the Editor

- **Findings 2 and 3 are one edit to one ticket** — the CAP-85 capability body's
  "The workspace origin" bullet. Both prior attempts at this level (REPORT-1617
  → REPORT-1623 in the 2026-08-07 loop, then REPORT-2100 standalone) left them
  standing, and REPORT-2100 offered an either/or ("add the AC **or** narrow the
  capability body") that nothing resolved. The either/or is now resolved: both
  properties are implemented *and* substantively tested under CAP-86 and CAP-87,
  so narrowing the capability body is the only repair that does not create a
  duplicate. Adding ACs to STORY-99 would convert two coverage violations into
  two exclusivity violations.

- **Finding 1 is the only genuinely new drift** and the only one whose root
  cause is a reconciliation miss rather than a stale scope sentence. It is worth
  handling first, because it is the one place where the matrix currently
  describes a performance property the deployed product does not have.

- **Out of this check's subject, but flag it to CAP-86's own cycle:** AC-992's
  verification ends *"Post a valid edit of each kind and assert both the editable
  and plain rendered outputs **on disk** reflect it"*, and its criterion says a
  save "re-renders both … before reporting success". REQ-119 removed the
  on-disk draft-side artifact entirely — CAP-85's own AC-1031 asserts the
  channels answer "with no rendered artifact on disk", and `router.ts:559-563`
  records that no re-render follows a write because the next fetch renders the
  definition the write produced. AC-992 appears to be describing the
  pre-REQ-119 arrangement.

- **Provenance is thin throughout this capability.** Neither the capability nor
  any of its 36 ACs carries an `intent_uid`, and `updated_by` on the story holds
  only the most recent updater. Every ledger row above was reconstructed from
  bundle membership and AC creation windows. If the field chain can be
  backfilled for this capability, the next check at any level gets materially
  cheaper and less error-prone.
