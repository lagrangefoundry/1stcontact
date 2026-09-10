---
uid: report-e9695d41
id: REPORT-3708
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-09-10T09:39:47.810204+00:00'
updated_at: '2026-09-10T09:39:47.810204+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 8. The three violations and two warnings of REPORT-3706
(`report-12605dba`, 2026-09-10 09:27) were repaired by attempt 7 at 09:30
(CAP-85 `updated_at` 09:30:14, STORY-99 09:30:54) and every one is verified
closed below — against the ticket bodies *and* against the code the new prose
describes, not against the fix report's own account of itself.

The capability has exactly one story (STORY-99, `story-e674c60a`, `story_kind:
upgrade`, 36 ACs), so intra-capability exclusivity is trivially satisfied and
every coverage question reduces to "does this one story body express it";
exclusivity was checked *across* capabilities instead.

One new warning: a sentence attempt 7 introduced asserts as a property of the
whole deployed origin something the code deliberately excepts on two routes,
and that exception is recorded in the matrix under the capability that owns it
(CAP-90 / STORY-103). It is prose, no AC asserts it, and the conclusion it
supports is correct — hence a warning, not a violation.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Neither the
capability nor any of its 36 ACs carries an `intent_uid`, and STORY-99's
`fields.updated_by` holds only the latest updater (`bundle-78f4e2fe`), so the
ledger is reconstructed from bundle membership, AC creation windows and the
story's own "Reconciliation Decisions" provenance headers. Bundle and bug lists
were read complete (21 bundles, 38 bugs, neither truncated); the request list
truncates at 50 and was filtered from 2026-08-15 forward, which covers every
intent postdating the story's last substantive rewrite.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-32 (`bug-5cabb340`) | merged | 2026-08-05 | `@gendevlabs` → `@lagrangefoundry` in lockstep; scope gets one definition site; browser-source declared exception; consumption evidence unconditional | YES |
| BUNDLE-16 (`bundle-15c1f647`) = REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | 2026-08-07 (`1741ee5d`) | Origin, chrome, display panel, toolbar, split, publish, confinement. STORY-99's `intent_uid` | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-08 | Toolbar re-derives on mode **and** site; a replaced control is a detached, inert survivor | YES |
| REQ-119 (BUNDLE-17 `bundle-e59210c5`) | free_and_reconciled | 2026-08-10 | Request-time draft/edit renders; one render implementation; no artifact on disk; reuse keyed on the definition; invalid draft surfaced; `published` untouched | YES |
| REQ-122 (BUNDLE-17) | free_and_reconciled | 2026-08-10 | Builder chat panel — the secondary pane's *content*; owned by CAP-91, correctly excluded here | YES (elsewhere) |
| BUNDLE-20 (`bundle-b3b7c399`) = REQ-147 + REQ-143 + REQ-145 + REQ-146 + REQ-148 + 5 more | free_and_reconciled | 2026-08-24, merged | REQ-145: control-app *becomes* the builder — client/components/bridges as build artifacts, routes and L1 render in workerd, **proxy deleted**. REQ-147: Cloudflare Access in front of the deployed origin. REQ-149: publish graduates from its 501. REQ-146: the AI host moves into workerd (per-isolate chat host — see warning 1). REQ-148: behaviour modules are plain functions | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) = BUG-36 + BUG-37 + BUG-38 | free_and_reconciled | 2026-08-26 (`96a76934`) | BUG-36 (item 1): one opener, register-if-absent on `unknown` only, cold-start serves. BUG-37 (item 2): assembled-definition memo in the D1 adapter; the `PREVIEWS` render cache is dead in the Worker and deliberately left so. BUG-38: chat sessions. STORY-99's `updated_by` | YES |
| BUNDLE-22 (`bundle-8eef3846`) = BUG-39 + REQ-154 | free_and_reconciled | 2026-08-31 | REQ-154 lands the Browser Rendering capability and its proof but **no route**: `apps/control-app/src/shot.ts:11` — *"NO ROUTE ANSWERS THIS YET, on purpose"* — deferring the surface to REQ-157. Verified against the router's route inventory: no screenshot route exists. BUG-39 is chat-host test doubles | YES (no ask here) |
| REQ-162 (`request-13a5e206`) | free_and_reconciled | 2026-08-31 | Product ticket store. `apps/control-app/src/tickets.ts` is typed but unrouted — verified: no `/api/tickets` in the route inventory | YES (no ask here) |
| REQ-155–161, REQ-163–166 | **draft** | 2026-08-20 … 08-31 | Capture/fidelity/KB/ingestion; REQ-158 + REQ-161 would add a KB surface and a second ("Library") tab | NO — not yet active. STORY-99's single-tab claim and `TABS = [SITE_TAB]` (`apps/control-app/src/builder/config.js:50`) are therefore still current |
| REQ-112, REQ-134, BUNDLE-12, BUNDLE-15 | **abandoned** | 2026-08-06/08/12 | — | NO |

**No reconciled intent has landed since 2026-08-31**, and the story was last
rewritten 2026-08-31 (absorbing BUNDLE-20 and BUNDLE-21) with today's attempt-7
corrections on top. BUNDLE-22 is the most recent reconciled bundle and asks
nothing of this capability. The cumulative picture has not moved under the
story.

## Alignment Ledger

Rows marked *(re-verified)* were confirmed this attempt against the named source
file, not carried forward from REPORT-3706.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — one origin, the deployed edge runtime; proxy deleted | REQ-145 | aligned *(re-verified: no `BUILDER_ORIGIN` or forwarding handler survives anywhere under `apps/control-app/` or `bin/`)* |
| STORY-99 — admitted-caller qualification; the gate itself out of scope | REQ-147 | aligned *(re-verified: `index.ts:79-82` runs `guardAccess` before `route`, so before any path examination, store handle or asset delivery)* |
| STORY-99 — component consumption: installed copy, declared entry points, never vendored, install diagnostic | REQ-115, BUG-32 | aligned |
| STORY-99 — scope written once; browser-source declared exception | BUG-32 | aligned |
| STORY-99 — working-tree anchoring, four checkout shapes, directory equality | BUG-32 window | aligned |
| STORY-99 — client, components and bridges are build artifacts, served behind the gate by falling through last | REQ-145 | aligned (AC-1400) |
| STORY-99 — one tab, viewport fill, page never scrolls | REQ-115, REQ-117 | aligned *(re-verified: `builder/config.js:50` = `[SITE_TAB]`)* |
| STORY-99 — display panel modes; registration is an added entry; mode switch preserves the pane | REQ-115 | aligned |
| STORY-99 — toolbar derived from mode **and** site; replaced control inert | REQ-115, BUG-33 | aligned *(re-verified: `builder/toolbar.js:101` subscribes to both)* |
| STORY-99 — split geometry and persistence, namespaced storage | REQ-115 | aligned |
| STORY-99 — request-time draft/edit channels, one render, no artifact, invalid draft surfaced, `published` from publish time | REQ-119 | aligned |
| STORY-99 — two front doors, one route table; local default store | REQ-145 | aligned *(re-verified: `tools/generate/src/cli/builder.ts:358` is an `http.createServer` over the same route table; it is the only surviving local front door)* |
| STORY-99 — copy-up through the one opener; no privilege the other routes lack | BUG-36 | aligned (AC-1402) |
| STORY-99 — cold start: schema-only store serves, registers, lists empty | BUG-36 | aligned *(re-verified: `store.ts:85-96` — one opener, register only when `err.reason === 'unknown'`)* |
| STORY-99 — configuration failure narrowed to two cases (no account named; account deactivated) | BUG-36 | aligned *(re-verified: `store.ts:87` throws `TenantNotConfiguredError` on empty `TENANT_ID`; `store.ts:92` rethrows every non-`unknown` reason, so `inactive` is refused explicitly)* |
| STORY-99 — inline boot guard, registered before the client it watches | REQ-145 | aligned *(re-verified: `chrome.ts:45` emits `<script>${BOOT_GUARD}</script>` immediately ahead of `<script type="module" src="/builder/main.js">` at line 46)* |
| STORY-99 — confinement clamps rather than detects; refusal reads as not-found; the resolver's `forbidden` branch is unreachable for URL-derived paths | REQ-115 | aligned *(re-verified: `tools/generate/src/cli/serve.ts:66-67` — `path.normalize(rel)` drops leading traversal from a root-relative path, so `abs.startsWith(rootDir)` holds and line 67's `'forbidden'` cannot be reached that way)* |
| STORY-99 — freshness / non-cacheable stamped by the route table | REQ-119 | aligned (`router.ts:224` `NO_STORE`; AC-977) |
| STORY-99 — publish invoked, semantics owned elsewhere; the 501 deferral retired to a design rule | REQ-149 | aligned |
| STORY-99 — reuse held against the store handle; **no rendering reused at the deployed origin**; cost closed a layer lower | REQ-119, **BUG-37** | **aligned — repaired this cycle** (was REPORT-3706 finding 1). Verified: `store.ts:79-83` documents the per-request handle and its rationale, `store.ts:88-90` builds a fresh `d1r2SiteStore` per call, `router.ts:82` keys `PREVIEWS` on the store object. The withdrawn "equivalent there" claim survives in the story only as a quoted stale comment and as an explicitly withdrawn claim in the BUG-37 decision block. Cited AC-1447 / AC-1448 confirmed to exist (`acceptance_criterion-316e92c7`, `-89fefdc5`, both active under `story-fde7370b`) |
| STORY-99 — divergence note for `router.ts:76-77` | BUG-37 | **aligned — added this cycle** (was REPORT-3706 finding 4). Verified: the stale comment is still at `router.ts:76-79` verbatim, and the story records it in the form it already used for `toolbar.js:100` |
| STORY-99 — Reconciliation Decisions provenance | BUNDLE-21 | **aligned — repaired this cycle** (was REPORT-3706 finding 5). The header now reads "item 1 (BUG-36)" and a dated "item 2 (BUG-37)" block exists beneath it |
| STORY-99 — "the deployed origin builds a fresh handle on every request" | REQ-119, BUG-37, **qualified by REQ-146** | **warning 1: unqualified.** True of every route except `/api/ai/session` and `/api/ai/prompt`, which `router.ts:84-111` holds per isolate on purpose |
| CAP-85 body — the editing client's bytes | REQ-117 → **CAP-87 (AC-1006)** | **aligned — repaired this cycle** (was REPORT-3706 finding 2). The one-source/no-drift parenthetical is replaced by an explicit deferral naming CAP-87 and AC-1006; AC-1006 confirmed active (`acceptance_criterion-a5d4eb9c`, under `story-3bf94bd4`) |
| CAP-85 body — the write path's read/apply operations | REQ-117 → **CAP-86 (AC-992)** | **aligned — repaired this cycle** (was REPORT-3706 finding 3). "thin transport … adds no semantics of its own" and "as a transport that changes none of it" are both gone from the scope and out-of-scope bullets, replaced by "hosting the write path's read and apply operations" with semantics deferred to CAP-86 / AC-992; AC-992 confirmed active (`acceptance_criterion-9561711e`, under `story-37a3921b`) |
| CAP-90 / STORY-103 — one conversation host per isolate | REQ-146 | aligned **elsewhere**, and it is the counterpart to warning 1: STORY-103 says *"Every other route on that origin builds its store per request so the tenant check is never stale; the conversation routes cannot … Recorded as the intent's own stated deviation"* |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-99 (`story-e674c60a`) Technical Context, "The staleness rule went with the artifact, and the reuse key moved" — second paragraph | story-body-edit | The passage attempt 7 added states without qualification that *"The deployed origin builds a fresh handle on every request — deliberately, because a handle held across requests carries an account check made before the request, and refusing a deactivated account is worth more than the saving."* The code documents a deliberate exception on this same origin: `apps/control-app/src/router.ts:84-100` — *"The chat host, ONE PER ISOLATE, and deliberately not per request (REQ-146). Every other route builds its store per request … The chat routes cannot do that … what is given up is re-checking a deactivation mid-isolate, on these two routes only"* — implemented at `router.ts:102-111`, where `chatHost` memoises a `Promise<WorkerHost>` in module scope. This is not undocumented drift: REQ-146 (`request-0cdfdc5b`, free_and_reconciled, BUNDLE-20) owns it, and CAP-90's STORY-103 (`story-a58a0974`) already records it as *"One conversation host per isolate in the edge runtime, deliberately. Every other route on that origin builds its store per request so the tenant check is never stale; the conversation routes cannot … Recorded as the intent's own stated deviation."* So the matrix is complete; only CAP-85's phrasing is over-broad, and the two capabilities now state complementary claims about the same origin in mutually contradictory absolutes. **Not a violation**: no AC of CAP-85 asserts it (AC-965 is about the two configuration failures, not handle lifetime), the passage's subject is the `PREVIEWS` render cache — which the chat routes do not use, so the conclusion *"no rendering is reused at the deployed origin at all"* stays exactly true — and the exception is expressed where it is owned | Qualify the clause to match STORY-103's own wording: the deployed origin builds a fresh handle on every request **except the two conversation routes**, whose per-isolate host is REQ-146's stated deviation and CAP-90's to assert (STORY-103). One subordinate clause; do not restate the deviation's rationale here, and do not add an AC — STORY-103 already carries it and a second copy would be an exclusivity violation of the kind findings 2 and 3 of REPORT-3706 were repaired to avoid |
| 2 | info | coverage | CAP-85 (`capability-a994b8f3`) body, "The workspace origin" scope bullet | — | The bullet enumerates the operations the origin performs as "listing the store, publishing, and hosting the write path's read and apply operations", but the route table hosts four more families: `/api/palette` (`router.ts:436`, REQ-133 → CAP-98, "thin transports over the same `editPalette*` functions `1c palette` dispatches to"), `/api/assets` (`router.ts:421` → CAP-88), `/api/revisions` (`router.ts:415` → CAP-82) and `/api/ai/*` (`router.ts:487,503` → CAP-90). Recorded deliberately as `info`, not as a coverage gap: the bullet's job is to scope *ownership*, and it already says this capability owns only that operations are "reachable here" with semantics deferred to their owners. Under-enumeration carries none of the over-claim risk that findings 2 and 3 of REPORT-3706 were about, and adding an inventory of routes owned elsewhere would invite exactly the duplication those repairs removed | none — logged so a later cycle does not read the short enumeration as drift |
| 3 | info | consistency | STORY-99 "Divergence noted, in commentary only" (both entries) | — | Both re-verified accurate this attempt. `builder/toolbar.js:100` still reads "Re-render on every mode change" while line 101 is `[panel.on('mode', render), panel.on('site', render)]` and the docstring at line 42 says "on every mode and site change". `router.ts:76-79` still reads "The Worker has one store per tenant per isolate, so the two are equivalent there" while `store.ts:79-83` documents the opposite decision | none |
| 4 | info | coverage | STORY-99 single-tab claim vs REQ-158 / REQ-161 | — | REQ-161 ("The Library tab") and REQ-158 (KB surface on the builder) would retire the single-tab claim, but both are `draft` and count toward nothing. `TABS = [SITE_TAB]` is still what ships. Flagged as the one predictable future source of story-level drift for this capability | none — revisit when either leaves `draft` |

## Notes for the Editor

- **Warning 1 is the only open item, and it is one subordinate clause.** It does
  not block this level: PASS requires zero violations and zero `needs_review`,
  and there are none of either. It is worth taking opportunistically because the
  two capabilities currently state contradictory absolutes about the same
  origin, which is a ready-made false positive for whichever of CAP-85's or
  CAP-90's next cycle reads the other's body.

- **Every REPORT-3706 finding is closed, and closed the way it was categorised.**
  Three violations and two warnings, all resolved as matrix prose with no code
  and no test touched. I re-derived each against the source rather than trusting
  the fix report: the two capability-body over-claims (standing since
  REPORT-2100, 2026-08-16) are gone and now cite CAP-86/AC-992 and
  CAP-87/AC-1006, both confirmed to exist and be active; the BUG-37 reuse
  passage now matches `store.ts` and `router.ts` exactly; the provenance header
  names BUG-36 as item 1 with a new BUG-37 block for item 2.

- **The `uat_coverage: fail` on both CAP-85 and STORY-99 is not this check's
  subject** and was left untouched. It is owned by the UAT-coverage cycle;
  nothing in this report bears on it, and a story-level alignment pass should not
  be read as evidence either way about test coverage.

- **Provenance is still thin, and attempt 7 was right not to guess.** Neither the
  capability nor any of its 36 ACs carries an `intent_uid`, and `updated_by` on
  the story holds only the most recent updater, so every ledger row above is
  reconstructed from bundle membership, AC creation windows and the story's own
  provenance headers. Attempt 7 declined to backfill because every candidate
  value would be reconstruction rather than recorded fact — that was the correct
  call, and it stays an operator decision. Until it is sourced authoritatively,
  each check at any level pays this reconstruction cost again.

- **Carried forward once more, still out of this check's subject:** AC-992
  (CAP-86, `acceptance_criterion-9561711e`) verifies "both the editable and plain
  rendered outputs **on disk**" and says a save "re-renders both … before
  reporting success", but REQ-119 removed the on-disk draft-side artifact
  entirely — CAP-85's own AC-1031 asserts the channels answer "with no rendered
  artifact on disk". AC-992 appears to describe the pre-REQ-119 arrangement.
  REPORT-3706 flagged it, attempt 7 correctly declined to edit another
  capability's AC from this scope, and it has now survived two cycles unrouted.
  It needs CAP-86's own validation cycle to pick it up; noting it here a second
  time so the trail does not go cold.
