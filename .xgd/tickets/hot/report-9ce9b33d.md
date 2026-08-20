---
uid: report-9ce9b33d
id: REPORT-2301
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-20T01:42:42.829541+00:00'
updated_at: '2026-08-20T01:42:42.829541+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-2485c83c. Capability: capability-a994b8f3 (CAP-85).
Attempt 8 (7 previous). Story tree at this level: one story — STORY-99
(`story-e674c60a`, kind=upgrade, `updated_at` 2026-08-20T01:34:06Z).

**Re-read, not assumed.** The story body was re-read from the ticket store after
attempt 7's fix (report-b7354d67, written 2026-08-20T01:34, three minutes after
the report it repairs). Every one of report-b2da2ab0's three violations and two
warnings was checked against the body as it now stands, not against the fix
report's account of itself. All five are closed — see "Prior Findings, Re-verified"
below. The rest of this report is an independent re-derivation from the intent
ledger, not a re-read of the previous one.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (ordered by
`merged_at_commit` where present, else `created_at`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 (`request-a6740b4a`, BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | The whole chrome: `@…/webui-*` consumed from the shared artifact store through each package's own `exports` map, missing-install diagnostic naming the component and command, `site` tab with one definition site for its label, multi-mode display panel (a mode is a map entry, `setMode` swaps `src` rather than rebuilding), mode-declared toolbar, split with collapse-to-rail + namespaced persistence, open-in-new-tab, publish through the existing path, the Node origin (`1c builder`) with `control-app` as a verbatim same-origin front, `resolveStaticFile` confinement shared across three static trees | YES |
| REQ-117 (`request-395b67e6`, BUNDLE-16) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | Copy-edit loop (owned by CAP-88 / STORY-100 / STORY-101) **plus two workspace-side asks**: (a) the origin's edit seam — `/api/copy` GET/POST as a thin transport over `editCopyGet`/`editCopySet`, the same functions `1c copy get\|set` dispatch to, returning **400** carrying the validator's own `code`/`path`/`hint` ("a 500 would read as 'the builder broke' and throw away the message naming the field"), and `/framework/edit-client.js` served by type-stripping the renderer's own TypeScript source so bridge and markup cannot drift; (b) the viewport-fill follow-up (`94ae6fee`) — `SITE_TAB` declares `fill: true` **and** the mount stops rebuilding each tab as `{id, label}`, guarded by `test_UAT_FC_REQ-117_tab_spec_reaches_the_shell_unnarrowed` "asserting on *every* declared tab key so the next option added cannot be dropped the same silent way" | YES |
| REQ-44 (`request-3b78151f`, BUNDLE-16) | free_and_reconciled | merged 2026-08-07 (`1741ee5d`) | `1c` dependency preflight. Not a workspace surface — expressed in STORY-79 (`capability-aa030c83`) | YES (elsewhere, correctly) |
| BUG-32 (`bug-5cabb340`) | merged | 2026-08-05 → merged 2026-08-08 | Scope rename `@gendevlabs` → `@lagrangefoundry` in lockstep: one definition site for the scope, everything that generates a reference composes it, the legacy literal nowhere (including the checked-in generated `index.html`, **deleted** rather than updated), the browser-source exception held in step against the document's import map, no fallback resolution and no dual-scope detection, and evidence made **unconditional** so a one-sided rename cannot skip green | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | merged 2026-08-10 (`f1664c55`) | Test-side fixes only. Matrix effect: a control the strip replaces is a detached survivor, inert by design because `disposeActions()` released what kept it current; the behaviour under test is always the control presently in the strip | YES |
| REQ-119 (`request-64864801`, BUNDLE-17 `bundle-e59210c5`) | free_and_reconciled | 2026-08-10 (`0198704b`) | Draft-side channels rendered at **request time**; `renderSiteFiles` as the one implementation with `renderSite` a thin writer over it and the origin a reader; no artifact on disk and the save path's double `cmdRender` deleted; out-of-band definition changes visible on the next request; an invalid draft surfaced as a 500 naming the offending field; `published` still the publish-time artifact; the iframe source contract unchanged. Carries its **own declared deviation** from its AC-1 (render inside the edge Worker not attempted — needs the storage migration its own non-goals forbid) | YES |
| REQ-121 (`request-9707484c`, BUNDLE-17) | free_and_reconciled | 2026-08-10 | Copy-edit modal made elegant. Workspace-adjacent residue (themed root, one app typeface via the shell's `font` token, faces self-hosted from the builder origin over the **existing** `/builder/` route) — expressed under CAP-88 / STORY-101 as AC-1037/1038/1041. See info finding 4 | YES (elsewhere) |
| REQ-122 (`request-58b6a329`, BUNDLE-17) | free_and_reconciled | 2026-08-10 | Chat panel (owned by `capability-44a04848` / STORY-104). Workspace-side residue: the AI library resolves through `sharedModuleUrl` in `webui.ts`, the one resolution point — "a bare specifier would find the shared store from the main checkout and nothing from a linked worktree" | YES |
| REQ-126 / REQ-127 / REQ-128 / REQ-129 / REQ-130 (BUNDLE-17) | free_and_reconciled | 2026-08-08 → 2026-08-09 | Control-surface / L1-authoring work. Scanned for workspace residue: REQ-127 touches the chat session panel (assistant capability; STORY-99's out-of-scope bullet draws that line) and REQ-128 notes an origin suite deliberately ungated on `WEBUI_INSTALLED` (already covered by the story's two-kinds-of-evidence paragraph). Nothing else lands on this capability | YES (no residue due here) |
| REQ-144 (`request-7bef34e0`) | bundled | 2026-08-15 | Records the front's unconfigured-origin 503 (`BUILDER_ORIGIN is not configured. Start the builder origin with '1c builder'`) as observed production behaviour | imminent |
| REQ-145 (`request-b474390f`) | ready_to_reconcile | 2026-08-15 | `control-app` **becomes** the origin: client/webui/framework bridges as build artifacts, route table and request-time L1 render in workerd, `no-store` as a response wrapper, `1c builder` reduced to a launcher, proxy + `BUILDER_ORIGIN` + dead Node routes deleted, `/api/publish` and `/api/ai/*` to 501 in the interim | imminent |
| REQ-147 (`request-23fd6e61`) | ready_to_reconcile | 2026-08-15 | Cloudflare Access in front of the builder; explicitly re-runs `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures`, so AC-965 is live intent rather than legacy | imminent |
| REQ-146 (`request-0cdfdc5b`) | free_coded | 2026-08-15 | AI host into workerd — assistant capability, not this one; not yet reconciled | not yet |
| REQ-150 (`request-34dd9049`) | draft | 2026-08-18 | `1c` CLI boots plain Vite SSR rather than Astro's | NO (draft) |
| REQ-112 (`request-3ef7727c`) | abandoned | 2026-07-31 | — | NO |

**Imminent intents verified as genuinely not landed on this branch** (regression
cut from main), so the matrix is correct to claim neither:
`apps/control-app/src/index.ts:31-36` still returns the 503 naming `1c builder`
and `:47-54` the 502 naming the attempted address; `BUILDER_ORIGIN` is still the
Worker's only binding; `tools/generate/src/cli/builder.ts` still serves
`/api/sites` (:267), `/api/publish` (:272), `/api/assets` (:351), `/api/copy`
(:371) and the type-stripped `/framework/(edit-client|site-schema-edit).js`
(:462-468).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-85 (`capability-a994b8f3`) body | REQ-115, REQ-117, BUG-32, BUG-33, REQ-119, REQ-122 | aligned |
| STORY-99 — "A single workspace, at one address" | REQ-115 | aligned |
| STORY-99 — "The origin carries the write path's operations, and adds no semantics to them" | REQ-117 | aligned — **added by attempt 7**; covers the transport, the refusal arriving in the write path's own terms (reason, place, hint), and the gesture's client bytes produced from the renderer's own source |
| STORY-99 — "The two ways the origin can fail to answer are told apart" | REQ-115 (the front), REQ-144 + REQ-147 (imminent, both depend on it) | aligned — **added by attempt 7**; written about the origin's failure to answer rather than about a proxy, so REQ-145's reconcile need not unpick it |
| STORY-99 — "Chrome built from shared components, consumed not copied" | REQ-115 | aligned |
| STORY-99 — "The scope … is one name, written once" | BUG-32 | aligned — carries the declared browser-source exception, the import-map cross-check that holds it in step, and "no second scope to fall back to and nothing detects which one is present" |
| STORY-99 — "One tab, filling the window" | REQ-115, REQ-117 (viewport-fill follow-up) | aligned — **extended by attempt 7** with the tab-declaration pass-through (declared once and whole, every option reaches the chrome intact, adding an option needs no change to the mounting step). Gives AC-976 its supporting sentence |
| STORY-99 — "A display panel with modes, not a preview" | REQ-115, REQ-119 (iframe source contract unchanged) | aligned |
| STORY-99 — "A toolbar the active mode declares, re-derived from what is displayed" | REQ-115, BUG-33 | aligned; the detached-survivor sentence supports AC-1110 |
| STORY-99 — "The draft-side channels are produced on request" | REQ-119 | aligned; the deviation from REQ-119's AC-1 is declared identically on both sides (a Worker cannot reach the store; the storage migration is that ticket's own non-goal) |
| STORY-99 — "A split, and it remembers" | REQ-115 | aligned; STORY-104 defers the divider/rail/persistence back to CAP-85, so no exclusivity conflict |
| STORY-99 — "Freshness over caching" | REQ-119 (the staleness class it serves) | aligned (info finding 3) |
| STORY-99 — "Confinement" | REQ-115 | aligned — **extended by attempt 7** to cover *unknown* requests as well as *escaping* ones, supporting AC-979 and AC-1036 |
| STORY-99 — component resolution anchored at the main checkout, four checkout shapes | BUG-32, REQ-122 | aligned; AC-1030 carries it as a criterion, as the body claims it now does |
| STORY-99 `fields.updated_by` | — | now `["bug-ede1fb8c", "bug-5cabb340", "bundle-e59210c5"]`, a three-element list; BUG-32 and BUNDLE-17 recorded |
| STORY-99 Technical Context — Node origin + verbatim front, type-stripped `/framework` route | REQ-145 (imminent) | aligned; anticipated in the body as "deliberate and temporary" (info finding 1) |
| STORY-99 Technical Context — local preview server's freshness divergence | none (declared out-of-scope side effect) | aligned and **verified true**: `tools/generate/src/cli/serve.ts:113` exports `NO_STORE` and `:133` applies it in the shared send path, which STORY-95/96's server also uses |
| STORY-99 Technical Context — stale inline comment at the toolbar subscription | none (commentary divergence) | aligned and **verified still true**: `apps/control-app/src/builder/toolbar.js:100` reads "on every mode change" while `:101` subscribes `panel.on('mode')` **and** `panel.on('site')`, and the docstring at `:41-42` correctly says "on every mode and site change" |

## Prior Findings, Re-verified

report-b2da2ab0 (attempt 7's input) raised 3 violations and 2 warnings. Each was
checked against the current body text, not against report-b7354d67's claims:

| Prior # | Was | Now |
|---|---|---|
| 1 (violation, coverage) | Edit seam expressed in no story body; out-of-scope bullet read "Editing of any kind" and excluded the transport | **closed** — in-scope bullet "The origin carries the write path's operations, and adds no semantics to them" present; out-of-scope narrowed to "Edit semantics and the editing gesture" and now carves the transport *in* ("This story owns only that those read/apply operations are reachable over this origin as a transport that changes none of it") |
| 2 (violation, coverage) | Tab-declaration pass-through (REQ-117's `fill`-dropping fix, AC-976) unsupported | **closed** — "The tab itself is declared once and whole, and every option that declaration carries reaches the chrome intact … a silently narrowed tab declaration is the failure this exists to prevent" |
| 3 (violation, coverage) | The word "unconfigured" did not occur in the body; AC-965 unsupported | **closed** — "The two ways the origin can fail to answer are told apart … the unconfigured case names the command that starts the origin, and the unreachable case names the address that was tried" |
| 4 (warning, consistency) | `updated_by` recorded only `bug-ede1fb8c` | **closed** — three-element list including `bug-5cabb340` and `bundle-e59210c5` |
| 5 (warning, coverage) | Confinement bullet covered escaping requests only; AC-979/AC-1036 unsupported | **closed** — "A request that names something this origin does not serve at all is answered the same way: a rendering channel that is not one of the site's, a page or a site the store does not hold, or a component the workspace does not consume is reported as not found" |

No repair introduced text the intent ledger does not support: every added passage
mirrors either CAP-85's own scope statement or REQ-117's recorded asks.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | STORY-99 — Node origin, verbatim front, type-stripped `/framework` route, publish over the origin | — | REQ-145 (ready_to_reconcile) retires all of these: build artifacts, route table in workerd, proxy and `BUILDER_ORIGIN` deleted, `/api/publish` to 501. Verified **not landed on this branch** (`apps/control-app/src/index.ts:31-54`; `tools/generate/src/cli/builder.ts:267,272,351,371,462`), so no repair is due, and STORY-99's Technical Context already anticipates it ("deliberate and temporary … a later phase … deletes the front"). Recorded so the next check does not read the Node-origin paragraphs as fresh drift, and so REQ-145's reconcile knows AC-964/AC-965's origin-shaped criteria move with it | none (REQ-145's reconcile) |
| 2 | info | consistency | STORY-99 — declared deviation from REQ-119 AC-1 | — | Matched on both sides: REQ-119's own body records the identical deviation and the identical reason (a Worker has no filesystem and no Vite/Astro transform, so relocating the render needs DOC-12 §7 phase 2, which that ticket's non-goals forbid). The matrix claims only what landed — request-time production, one implementation, no artifact, byte-identical | none |
| 3 | info | consistency | STORY-99 — "Freshness over caching" | — | No intent asks for `no-store` literally; it serves the staleness class REQ-119 closed, and REQ-145 carries it forward structurally as a response wrapper. The story flags its own out-of-scope side effect on STORY-95/96's preview server, which is verifiably real (`serve.ts:113,133`). Treated as active intent, not unsupported text | none |
| 4 | info | exclusivity / coverage | REQ-121's app-typeface residue — AC-1037/AC-1038/AC-1041 under STORY-101 (`story-3bf94bd4`, CAP-88) | — | AC-1038 ("One application typeface, set once through the workspace's own font token and served from the workspace origin") is worded about *the workspace's* themed root and *the workspace origin*, but sits under CAP-88, not CAP-85. Judged correct rather than drift: REQ-121's subject is the copy-edit modal, the three ACs form one coherent trio (themed surface / typeface / the site's own `@font-face` rules crossing into the workspace), and REQ-121 states the faces are "served by the existing `/builder/` route, so no routing change was needed" — the workspace's own browser-source tree, which STORY-99's confinement bullet already names. Splitting AC-1038 out would fragment the trio for no gain. Same disposition as REQ-44 (in STORY-79) and REQ-122's chat routes (in STORY-104) | none |
| 5 | info | coverage | AC-1110 (`acceptance_criterion-8cc0c9f2`) teardown clause | — | AC-1110's second paragraph also covers *chrome teardown* releasing the strip and its own responsiveness, which STORY-99's toolbar bullet does not state explicitly (it states the replacement half: "A control the strip replaces is released with it and stops reacting …"). Not raised as a finding — teardown is the same release mechanism at chrome scope, and a story body is narrative support for its ACs rather than an enumeration of them. Recorded so a future check does not mistake the asymmetry for a gap | none |
| 6 | info | exclusivity | STORY-99 vs STORY-100, STORY-101, STORY-104 | — | Seams clean in all three directions and stated reciprocally. STORY-100: "The builder workspace (CAP-85 / STORY-99) exposes this same surface over its origin as a thin transport — the same operations, not a…". STORY-101: "Depends on the workspace (STORY-99 / CAP-85) for the page on screen, the View/Edit modes and the single origin". STORY-104: the split, divider, rail collapse and drag-to-resize belong to CAP-85. Attempt 7's new transport bullet did **not** create an overlap, because STORY-100 already delegates the transport rather than claiming it | none |

## Notes for the Editor

**Nothing to repair at this level.** Attempt 7 closed all five outstanding items
and the closures survive an independent re-derivation from the intent ledger.
The story body now covers what the origin *answers* as thoroughly as what the
workspace *shows*, which was the single pattern behind all three prior
violations.

**Carried forward to the ac-level cycle, unchanged.** report-b2da2ab0's
downstream note still stands and is *not* a story-level finding: no AC asserts
the edit transport's defining properties — that it adds no semantics, that a
refused edit arrives carrying the write path's own `code`/`path`/`hint` rather
than a generic server failure, and that the served bridge is type-stripped from
the renderer's own source rather than hand-written. Today `/api/copy` and
`/framework/*.js` appear in the AC tree only as entries in AC-977's
cache-header sweep, which asserts a header and nothing about what the route is
for. The story body now states all three properties, so the ac-level cycle has
the text to write against. This is an `ac-add`, and it belongs to level=ac.

**For whoever reconciles REQ-145.** Three of this story's Technical Context
paragraphs describe mechanism that REQ-145 replaces (the Node origin and its
verbatim front, the type-stripped `/framework` route, the client bridge derived
at serve time). All three are already written as mechanism-that-will-move, and
the criteria above them are written about what the origin *answers*. The
reconcile should therefore rewrite those paragraphs and leave AC-964, AC-965,
AC-977 and AC-1031–1036 alone — REQ-147 independently confirms AC-965 is live
intent by re-running its UAT.

**Out of scope for this check, noted only.** `capability-a994b8f3`'s
`fields.uat_coverage` is `fail` (report-97969c20, 2026-08-16). That is the UAT
coverage gate, not story-level intent alignment, and it does not bear on this
verdict.
