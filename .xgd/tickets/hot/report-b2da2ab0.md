---
uid: report-b2da2ab0
id: REPORT-2299
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-20T01:31:15.112297+00:00'
updated_at: '2026-08-20T01:31:15.112297+00:00'
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

Anchor report: report-2485c83c. Capability: capability-a994b8f3 (CAP-85).
Story tree at this level: one story — STORY-99 (`story-e674c60a`, kind=upgrade).

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (ordered by
`merged_at_commit` where present, else `created_at`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 (`request-a6740b4a`, in BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | The whole chrome: webui consumed from the shared artifact store through each package's own `exports`, missing-install diagnostic, `site` tab with one definition site for its label, multi-mode display panel, mode-declared toolbar, split + persistence, open-in-new-tab, publish through the existing path, the Node origin with `control-app` as a verbatim front, shared `resolveStaticFile` confinement over three trees | YES |
| REQ-117 (`request-395b67e6`, BUNDLE-16) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | Copy-edit loop (owned by CAP-88/STORY-101) **plus two workspace-side asks**: (a) the origin's edit seam — `/api/copy` GET/POST as a thin transport over `editCopyGet`/`editCopySet` returning **400** carrying the validator's own `code`/`path`/`hint`, and `/framework/edit-client.js` served by type-stripping the renderer's own TypeScript source so bridge and markup cannot drift; (b) the viewport-fill follow-up — `fill: true` on the tab spec and the `TABS` entry reaching the shell **unnarrowed** (the mount was silently dropping `fill`) | YES |
| REQ-44 (`request-3b78151f`, BUNDLE-16) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | `1c` dependency preflight. Not a workspace surface — expressed in STORY-79 (CAP `capability-aa030c83`) | YES (elsewhere, correctly) |
| BUG-32 (`bug-5cabb340`) | merged | merged 2026-08-08 (`125f1dcc`) | Scope rename `@gendevlabs` → `@lagrangefoundry` in lockstep: one definition site for the scope, everything that generates a reference composes it, legacy scope literal nowhere (incl. the checked-in generated `index.html`, deleted), the browser-source exception held in step against the document's import map, and evidence made **unconditional** so a one-sided rename cannot skip green | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | merged 2026-08-10 (`f1664c55`) | Test-side only. Matrix effect: a control the strip replaces is a detached survivor — inert by design; the behaviour under test is always the control presently in the strip | YES |
| REQ-119 (`request-64864801`, in BUNDLE-17 `bundle-e59210c5`) | free_and_reconciled | 2026-08-10 | Draft-side channels rendered at **request time**, one render implementation behind writer and reader, no artifact on disk, out-of-band definition changes visible on the next request, an invalid draft reported where the operator looks, `published` still the publish-time artifact, iframe source contract unchanged. Carries its own declared deviation from its AC-1 (render inside the edge Worker not attempted — needs the storage migration its non-goals forbid) | YES |
| REQ-122 (`request-58b6a329`, BUNDLE-17) | free_and_reconciled | 2026-08-10 | Chat panel (owned by CAP `capability-44a04848`/STORY-104). Workspace-side residue: shared artifacts resolve through the one resolution point in `webui.ts`, "a bare specifier would find the shared store from the main checkout and nothing from a linked worktree" — the concern AC-1030 turns into a criterion | YES |
| REQ-144 (`request-7bef34e0`) | bundled | 2026-08-15 | Records the front's unconfigured-origin 503 (`BUILDER_ORIGIN is not configured. Start the builder origin with '1c builder'`) as observed production behaviour | imminent |
| REQ-145 (`request-b474390f`) | ready_to_reconcile | 2026-08-15 | `control-app` **becomes** the origin: client/webui/framework bridges as build artifacts, route table and request-time L1 render in workerd, `no-store` as a response wrapper, `1c builder` reduced to a launcher, and the proxy + `BUILDER_ORIGIN` + dead Node routes **deleted**; `/api/publish` and `/api/ai/*` answer 501 in the interim | imminent |
| REQ-147 (`request-23fd6e61`) | ready_to_reconcile | 2026-08-15 | Cloudflare Access in front of the builder; explicitly re-runs `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures`, so AC-965 is live intent, not legacy | imminent |
| REQ-146 (`request-0cdfdc5b`) | free_coded | 2026-08-15 | AI host into workerd — assistant capability, not this one; not yet reconciled | not yet |
| REQ-112 (`request-3ef7727c`) | abandoned | 2026-07-31 | — | NO |

Verified against this branch's tree (regression cut from main): REQ-145/147 have
**not** landed here — `apps/control-app/src/index.ts:31-52` still holds the proxy
with its 503/502 split, and `tools/generate/src/cli/builder.ts` still serves
`/api/assets`, `/api/copy` and the type-stripped `/framework/*.js`. The imminent
intents are therefore correctly *not* claimed by the matrix yet.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-85 (`capability-a994b8f3`) body | REQ-115, REQ-117, BUG-32, BUG-33, REQ-119, REQ-122 | aligned — scope statement covers the transport seam and the origin's failure reporting |
| STORY-99 (`story-e674c60a`) — one origin, components consumed not copied, scope written once | REQ-115, BUG-32 | aligned |
| STORY-99 — one tab / fills the window / one definition site per name | REQ-115, REQ-117 (viewport-fill follow-up) | **gap**: the fill *behaviour* is described; the tab-declaration pass-through REQ-117 fixed (AC-976) is not (finding 2) |
| STORY-99 — display panel with modes, toolbar re-derived, detached survivor inert | REQ-115, BUG-33 | aligned |
| STORY-99 — split, persistence, namespacing | REQ-115 | aligned; STORY-104 explicitly defers the divider/rail/persistence back to CAP-85, so no exclusivity conflict |
| STORY-99 — draft-side channels produced on request, invalid draft surfaced, published immutable, declared deviation from REQ-119 AC-1 | REQ-119 | aligned, deviation declared in both directions (intent body and story body agree) |
| STORY-99 — component resolution anchored at the main checkout, four checkout shapes | BUG-32, REQ-122 | aligned |
| STORY-99 — confinement clamps rather than detects | REQ-115 | aligned |
| STORY-99 — the origin's edit seam (`/api/copy` transport, `/framework/edit-client.js`) | REQ-117 | **gap**: asked by intent, claimed by the capability body, delegated here by STORY-100 and STORY-101 — described in no story body (finding 1) |
| STORY-99 — the origin's own failure reporting (unconfigured vs unreachable; unknown channel/component) | REQ-115 (the front), REQ-144/REQ-147 (imminent, both rely on it) | **gap**: capability body and AC-965/AC-979 carry it; story body does not (findings 3, 5) |
| STORY-99 `fields.updated_by` = `bug-ede1fb8c` | actually also BUG-32 and BUNDLE-17 | **stale chain** (finding 4) |
| STORY-99 — "Freshness over caching" (non-cacheable everywhere) | no intent asks for it literally; REQ-119 closes the staleness class it serves, REQ-145 carries it forward structurally as a response wrapper | aligned (info) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-99 (`story-e674c60a`) | story-body-edit | The workspace origin's **edit seam** is expressed in no story body. REQ-117 (free_and_reconciled, merged `1741ee5d`) built `/api/copy` GET/POST on the builder origin as "a thin transport over `editCopyGet`/`editCopySet`, the *same* functions `1c copy get\|set` dispatch to", returning 400 carrying the validator's own `code`/`path`/`hint`, and `/framework/edit-client.js` type-stripped from the renderer's own source so the two cannot drift. CAP-85's body claims exactly this ("carrying the write path's read/apply operations as a thin transport that adds no semantics of its own… this one owns only that those bytes are served from this origin"); STORY-100 says "The builder workspace (CAP-85 / STORY-99) exposes this same surface over its origin as a thin transport"; STORY-101 defers to STORY-99 for "the single origin". But STORY-99's in-scope origin bullet lists only the document, the components, its own browser code and the renderings, and its out-of-scope bullet reads "Editing of any kind: … the write path behind it are separate stories", which excludes the transport rather than carving it in. Shipped and unclaimed: `tools/generate/src/cli/builder.ts:371` (`/api/copy`), `:351` (`/api/assets`), `:468` (`edit-client.ts` type-strip) | Add an in-scope bullet mirroring the capability body: the origin carries the write path's read/apply operations as a transport that adds no semantics (a refusal arrives as the write path's own refusal, not a server failure), and serves the editing gesture's client bytes from the same source the renderer is built from. Narrow the out-of-scope bullet to *edit semantics and the gesture*, not the transport |
| 2 | violation | coverage | STORY-99 (`story-e674c60a`) | story-body-edit | REQ-117's viewport-fill follow-up asked for two things and the story body carries only one. The body's "One tab, filling the window" bullet covers height tracking, live resize and no page-level scrollbar, but nothing in it covers the second, load-bearing half: the mount was rebuilding each tab as `{id, label}` and **silently dropping `fill`**, which REQ-117 fixed by passing the `TABS` entry through whole and guarding with `test_UAT_FC_REQ-117_tab_spec_reaches_the_shell_unnarrowed` ("asserting on *every* declared tab key so the next option added cannot be dropped the same silent way"). AC-976 (`acceptance_criterion-922c2d11`, active, UAT at `tests/reconciliation-builder-workspace-chrome.test.ts:129`) asserts it with no supporting sentence in its story | Extend the "One tab, filling the window" bullet: a tab is declared once and whole, every declared option reaches the chrome intact, and adding an option requires no change to the mounting step — a silently narrowed tab spec is the failure this exists to prevent |
| 3 | violation | coverage | STORY-99 (`story-e674c60a`) | story-body-edit | The origin's own failure reporting is absent from the story body. CAP-85's scope states "An unconfigured origin and an unreachable one are distinct, self-explanatory failures rather than a blank page"; AC-965 (`acceptance_criterion-5286c04b`, active) asserts it; it ships at `apps/control-app/src/index.ts:31-36` (503 naming `1c builder`) and `:52` (502 naming the attempted address); REQ-144 (bundled) documents the 503 verbatim and REQ-147 (ready_to_reconcile) names the AC-965 UAT in its own evidence list. The word "unconfigured" does not occur anywhere in STORY-99's body | Add to the origin bullet: the two ways the origin can fail to answer are reported distinctly and self-explanatorily — unconfigured names the command that starts it, unreachable names the address tried — and neither is a blank page or a success |
| 4 | warning | consistency | STORY-99 (`story-e674c60a`) `fields.updated_by` | story-body-edit (metadata) | The chain records only `bug-ede1fb8c` (BUG-33), but two further reconciled intents demonstrably updated this story: BUG-32 (`bug-5cabb340`, merged 2026-08-08) — the whole "scope written once" in-scope bullet and the second half of AC-960/AC-961 — and BUNDLE-17 (`bundle-e59210c5`, free_and_reconciled 2026-08-10, carrying REQ-119 + REQ-122) — the request-time bullet, three Technical Context paragraphs, and AC-1030 through AC-1036 (created 2026-08-08/2026-08-10). A future alignment check reading only `updated_by` would not see them | Record `bug-5cabb340` and `bundle-e59210c5` in STORY-99's `updated_by` |
| 5 | warning | coverage | STORY-99 (`story-e674c60a`) | story-body-edit | AC-979 (`acceptance_criterion-a54bfee4`, active; UAT at `tests/reconciliation-builder-workspace-origin.test.ts:153`) asserts that an unknown rendering channel or an unconsumed component is answered as not found and never satisfied from a neighbour. The story body's confinement bullet covers only *escaping* requests; nothing covers *unknown* ones (AC-1036 carries the same claim for a missing page or site) | Extend the confinement bullet, or add a sentence beside it: a channel, page, site or component the origin does not serve is answered as not found rather than from a neighbour |
| 6 | info | consistency | STORY-99 — "Deviation, declared: the render still runs at the origin" | — | Correctly declared and matched on both sides: REQ-119's own body records the identical deviation from its AC-1 and the identical reason (a Worker cannot reach the store; the storage migration is that ticket's non-goal). The matrix claims only what landed | none |
| 7 | info | coverage | STORY-99 — Node origin + verbatim front, type-stripped `/framework` route, publish over the origin | — | REQ-145 (ready_to_reconcile) retires all three: build artifacts, route table in workerd, proxy and `BUILDER_ORIGIN` deleted, `/api/publish` to 501. Not yet enforced — REQ-145 has not landed on this branch — and STORY-99's Technical Context already anticipates it ("deliberate and temporary… a later phase… deletes the front"), so no repair is due now. Recorded so the next check does not read the Node-origin paragraphs as fresh drift, and so REQ-145's reconcile knows AC-965's proxy-shaped failure modes move with it | none (REQ-145's reconcile) |
| 8 | info | consistency | STORY-99 — "Freshness over caching" | — | No intent asks for the `no-store` directive literally; it serves the staleness class REQ-119 closed, the story flags its own out-of-scope side effect on STORY-95/96's preview server, and REQ-145 carries it forward structurally as a response wrapper. Treated as active, not as unsupported text | none |
| 9 | info | exclusivity | STORY-99 vs STORY-104 (`capability-44a04848`) | — | No overlap: STORY-104 states "The split, the divider, the rail collapse and drag-to-resize belong to CAP-85", and AC-973 states the reciprocal ("the criterion is about the split's two halves, not about what fills the second"). The seam is clean in both directions | none |

## Notes for the Editor

**The three violations are one pattern, not three unrelated edits.** STORY-99's
body is exhaustive about what the workspace *shows* and comparatively thin about
what its origin *answers*. Every gap sits on the same seam: the origin's
non-display surface — the edit transport, the served client bytes, the
tab-declaration pass-through, and the two shapes of "cannot answer". The
capability body already states the first and the last of those correctly, so in
each case the repair is to bring the story body up to the scope its own
capability declares, not to invent new intent. Lifting the capability body's own
sentences is the safest wording.

**Downstream consequence, for the ac-level cycle.** Finding 1 will surface again
as an `ac-add`: no AC asserts the transport's defining properties — that it adds
no semantics, that a refused edit arrives carrying the write path's own
`code`/`path`/`hint` rather than a generic failure, and that the served bridge is
type-stripped from the renderer's own source rather than a hand-written copy.
Today those routes appear in the AC tree **only** as entries in AC-977's
cache-header sweep (`tests/reconciliation-builder-workspace-origin.test.ts:311`
for `/api/copy`, `:349-350` for `/framework/*.js`), which asserts a header and
nothing about what the route is for. Findings 3 and 5 do **not** need new ACs —
AC-965 and AC-979 already exist and pass; only their story-body support is
missing.

**Ordering note.** Findings 3 and 7 touch the same text. Repair finding 3 now
(AC-965 is live: REQ-147, an imminent intent, re-runs its UAT), but write it
about *the origin's failure to answer* rather than about the proxy, in the same
style AC-964 already uses ("stated about one origin and what an operator
observes, not about a proxy"), so REQ-145's reconcile does not have to unpick it.

**Not flagged, deliberately.** REQ-44 rides in BUNDLE-16 with REQ-115/REQ-117 but
asks for a `1c` dependency preflight; it is expressed in STORY-79 under
`capability-aa030c83` and correctly absent here. REQ-122's chat routes live on
this origin but belong to `capability-44a04848`; the story's out-of-scope bullet
draws that line already.
