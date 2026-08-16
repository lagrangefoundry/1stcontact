---
uid: report-4d9be4ea
id: REPORT-2100
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=story)'
created_by: xgd
created_at: '2026-08-16T09:28:32.647601+00:00'
updated_at: '2026-08-16T09:28:32.647601+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: story
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

The capability has exactly one story (STORY-99, `story-e674c60a`, `story_kind:
upgrade`, 30 ACs). Intra-capability exclusivity is therefore trivially satisfied,
and every coverage question resolves to "does this one story body express it".

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Note that
`fields.updated_by` on STORY-99 holds only the *latest* updater
(`bug-ede1fb8c`), so the ledger below was reconstructed from the AC creation
windows (AC-959…979 on 2026-08-07; AC-1030 on 2026-08-08; AC-1031…1036 and
AC-1110 on 2026-08-10) rather than from the field chain.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-16 (`bundle-15c1f647`) = REQ-115 + REQ-117 + REQ-44 | free_and_reconciled | 2026-08-07 (`1741ee5d`) | Origin, chrome, display panel, toolbar, split, publish, traversal | YES |
| REQ-115 (`request-a6740b4a`) | free_and_reconciled | 2026-08-07 | Builder shell: webui consumption via shared artifact store, `site` tab, multi-mode panel + toolbar, 9 ACs | YES |
| REQ-117 (`request-64864801`… T3) | free_and_reconciled | 2026-08-07 | Copy-edit loop. Contributes to THIS capability: `/api/copy` as a thin transport on the builder origin, `/framework/edit-client.js` served type-stripped from the renderer's own source, and the viewport-fill follow-up (`fill: true`, tab spec unnarrowed) | YES |
| REQ-44 | free_and_reconciled | 2026-08-07 | `1c` install preflight. `builder` explicitly **ungated** — touches this capability only by naming it as offline | YES (no ask here) |
| BUG-32 (`bug-5cabb340`) | merged | 2026-08-08 (`125f1dcc`) | `@gendevlabs` → `@lagrangefoundry` scope rename in lockstep; scope gets exactly one definition site; browser-source declared exception; consumption evidence made unconditional so a rename fails loudly instead of skipping green | YES |
| REQ-119 (`request-64864801`) | free_and_reconciled | 2026-08-10 (BUNDLE-17 `0198704b`) | Request-time draft/edit renders; one render implementation (writer+reader); no artifact on disk; memoised on the definition; invalid draft surfaced; `published` untouched; AC-1 (render inside the edge Worker) explicitly **not attempted**, deviation declared | YES |
| BUG-33 (`bug-ede1fb8c`) | free_and_reconciled | 2026-08-10 (`f1664c55`) | Toolbar re-derives on mode *and* site; a replaced control is a detached, inert survivor. Test-side fix only, no product code changed | YES |
| REQ-122 | free_and_reconciled | 2026-08-10 (BUNDLE-17) | Builder chat panel — the secondary pane's *content*; owned by its own capability, correctly excluded here | YES (elsewhere) |
| REQ-145 | **draft** | 2026-08-15 | `control-app` becomes the builder, L1 render in workerd, **proxy deleted**. `depends_on` REQ-141/142/143/144/147 | NO — not yet active |
| REQ-147 | **draft** | 2026-08-15 | Cloudflare Access on `app.1stcontact.io` | NO — not yet active |
| REQ-112 | **abandoned** | 2026-08-08 | Untitled / empty | NO |

**Consequence of REQ-145 being `draft`:** STORY-99's "The origin runs outside the
edge Worker, and that is deliberate and temporary" and the declared AC-1
deviation are **still current, not stale**. No reconciled intent has yet retired
the Node origin + verbatim Worker front. This was the primary staleness
hypothesis going in and it is disconfirmed.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-99 — single origin, chrome, one-definition names | REQ-115, BUG-32 | aligned |
| STORY-99 — component consumption (installed copy, declared entry points, never vendored, install diagnostic) | REQ-115, BUG-32 | aligned |
| STORY-99 — scope written once, browser-source declared exception, unconditional consumption evidence vs skipping mount evidence | BUG-32 | aligned |
| STORY-99 — working-tree anchoring (four checkout shapes, directory equality) | BUG-32 (window), not enumerated in its body | aligned; provenance thin — see info #3 |
| STORY-99 — one tab, viewport fill, page never scrolls, tab spec unnarrowed | REQ-117 (viewport follow-up) | aligned |
| STORY-99 — display panel modes, registration as an entry, mode switch preserves pane | REQ-115 | aligned |
| STORY-99 — toolbar derived from mode **and** site; replaced control inert | REQ-115, BUG-33 | aligned |
| STORY-99 — split geometry + persistence, namespaced storage | REQ-115 | aligned |
| STORY-99 — request-time draft/edit channels, one render, no artifact, invalid draft surfaced, `published` from publish-time | REQ-119 | aligned |
| STORY-99 — AC-1 deviation (render at origin, not edge Worker) | REQ-119 | aligned (REQ-145 still draft) |
| STORY-99 — confinement clamps, refusal reads as not-found | REQ-115 | aligned |
| STORY-99 — freshness / non-cacheable on every response | REQ-119 | aligned |
| STORY-99 — **serving the edit gesture's client code from the renderer's own source** | REQ-117 | **gap: capability scopes it here; story body and all 30 ACs omit it** |
| STORY-99 — **`/api/copy` read/apply as a semantics-free transport** | REQ-117 | **gap: capability scopes it here; story body and all 30 ACs omit it** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-99 (`story-e674c60a`) | story-body-edit + ac-add | The capability body scopes to this capability "the shared client code the editing gesture runs in the displayed page (**served from the same source the renderer is built from, so the two cannot drift**)", and its Out-of-scope section states "this one owns only that those bytes are served from this origin". REQ-117 (free_and_reconciled) built exactly this: `/framework/edit-client.js`, type-stripped from the TypeScript source, kept as **one** implementation. STORY-99's "In scope" bullet 1 enumerates only "The workspace document, the UI components it is built from, its own browser code, and every rendering of every site in the store" — the bridge is not "its own browser code" and is not named. No AC covers it. The property is proven only under the **editing** capability, by `test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source` (`tests/reconciliation-copy-edit-gesture.test.ts:843`). Within this capability `/framework/edit-client.js` appears only as a row in AC-977's non-cacheable sweep and AC-979's not-found sweep (`tests/reconciliation-builder-workspace-origin.test.ts:349`) — incidental, not the "cannot drift" claim | Add the bridge to the story's single-origin enumeration and author an AC asserting the origin serves the editing client code from the same source the renderer is built from; **or** narrow the capability body to defer the property to the editing capability, where AC-1006 already proves it. Do not duplicate AC-1006's assertion — pick one owner |
| 2 | violation | coverage | STORY-99 (`story-e674c60a`) | story-body-edit + ac-add | The capability body scopes here "carrying the write path's read/apply operations as a thin transport that adds no semantics of its own, **so that a refused edit arrives as an expected refusal in the write path's own terms**", and Out-of-scope confirms "this one owns only that those operations are reachable over the workspace origin, as a transport that changes none of it". REQ-117 (free_and_reconciled) built `/api/copy` GET/POST as "a thin transport over `editCopyGet`/`editCopySet`, the *same* functions `1c copy get\|set` dispatch to", returning **400** carrying the validator's own `code`/`path`/`hint` rather than 500. STORY-99's body names publish and the store listing as the origin's operations but never the copy transport; its Out-of-scope pushes "the write path behind it" to other stories without retaining the transport claim. No AC covers it. The refusal shape is proven only under the editing capability (`test_UAT_AC999_a_refused_edit_shows_its_own_reason_and_leaves_page_and_draft_unchanged`, `tests/reconciliation-copy-edit-gesture.test.ts:611`); within this capability `/api/copy` appears only as two rows in AC-977's sweep (`tests/reconciliation-builder-workspace-origin.test.ts:311-314`) | Add the copy read/apply transport to the story's list of operations the origin performs and author an AC asserting it is reachable over the workspace origin and adds no semantics — the refusal arrives in the write path's own terms; **or** narrow the capability body to drop the claim. Keep the *semantics* with the write-path capability either way |
| 3 | warning | consistency | AC-964 | ac-edit | AC-964's evidence enumerates the same four routes the story body does — `/`, a component module, `/preview/alpha/draft/`, `/api/sites` (`tests/reconciliation-builder-workspace-origin.test.ts:609-614`) — while its own criterion text and the story bullet both claim the workspace's "own browser source" is part of the one-origin guarantee. `/builder/main.js` and `/builder/builder.css` are served (they appear in AC-977's and AC-979's sweeps) but are never verbatim-forwarding-compared. The AC's route list mirrors the story's incomplete enumeration, which is why findings 1 and 2 went unnoticed | Widen AC-964's verbatim-forwarding comparison to include the browser-source tree, and whichever of the bridge / copy routes survives the resolution of findings 1–2 |
| 4 | info | — | STORY-99 "Deviation, declared" + "The origin runs outside the edge Worker" | — | Verified **current, not stale**. REQ-145 (proxy deleted, render in workerd) is `draft` with `depends_on: [REQ-141, REQ-142, REQ-143, REQ-144, REQ-147]`; REQ-147 is `draft`. Neither counts toward cumulative intent, so the Node-origin-plus-verbatim-front description and the REQ-119 AC-1 deviation both remain accurate | none |
| 5 | info | — | STORY-99 "Divergence noted, in commentary only" | — | Verified accurate against current code: `apps/control-app/src/builder/toolbar.js:100` still reads "Re-render on every mode change" while line 101 is `[panel.on('mode', render), panel.on('site', render)]`; the docstring at lines 41-42 correctly says "on every mode and site change". The story correctly records this as commentary-only divergence with no behavioural difference | none |
| 6 | info | — | STORY-99 working-tree anchoring / AC-1030 | — | AC-1030 was created 2026-08-08T01:07, inside BUG-32's active window (ready 2026-08-07T22:58, completed 2026-08-08T02:07), and serves BUG-32's stated anti-silent-green goal at the same single resolution point. BUG-32's "What changed" list does **not** enumerate it. The behaviour is unambiguously active (current code, active AC, precondition for nine other criteria) and no intent retires it, so this is **not** `needs_review` — recorded here so the thin provenance is on the record | none |
| 7 | info | — | STORY-99 "Divergence flagged, not absorbed" (local preview server caching) | — | Correctly declared: the non-cacheable directive reached the shared file-sending path used by STORY-95/96's standalone preview server, whose own intent is silent on caching, and no criterion here claims it. Flagged rather than absorbed, which is the right handling | none |

## Notes for the Editor

**The two violations are one drift with one root cause, and they have a common
alternative resolution.** The capability body draws a careful line — this
capability owns *that the bytes and operations are reachable over this origin*,
the editing / write-path capabilities own *what they mean*. STORY-99 was written
against REQ-115's origin (workspace document, components, browser source,
channels, listing, publish) and never grew the two seams REQ-117 later added to
that same origin. So the capability promises a division of labour its only story
does not implement.

Either direction is defensible and the editor should pick one deliberately
rather than doing both:

- **Retain here** — add the two seams to the story's single-origin enumeration
  and author two ACs about *reachability and semantics-freeness only*. Risk:
  near-duplication with AC-1006 / AC-999. Mitigate by asserting the transport
  property (same functions the CLI dispatches to; refusal passed through
  unchanged) rather than re-asserting the refusal's content.
- **Narrow the capability body** — delete the two clauses from Scope and the
  matching Out-of-scope carve-outs, letting the editing capability own them
  whole. Cheaper, and the evidence already exists there.

**A structural note that made this check harder and is worth fixing upstream.**
STORY-99's `fields.updated_by` is a single scalar holding only the most recent
updater (`bug-ede1fb8c`), and ACs carry no `intent_uid` at all. The ledger above
had to be reconstructed from AC creation timestamps correlated against intent
completion windows. If a future check is expected to be deterministic, the story's
intent chain should accumulate rather than overwrite.

**Method limitation, declared.** `xgd ticket comments` is not in this session's
permission allowlist, so the operator-Claude dialogue on BUG-32 — the secondary
source of truth the prompt names for exactly the ambiguity in info #6 — could not
be read. Finding #6 is classified `info` on the strength of the code, the active
AC and the timing window; if the anchoring's provenance is ever disputed, BUG-32's
comments are the place to settle it.

**Not a finding, recorded for completeness.** AC-977's non-cacheable sweep
correctly covers routes owned by other capabilities (`/api/ai/*` from REQ-122,
`/api/copy` from REQ-117). That is appropriate — the criterion is "*every*
response this origin returns", and it would be wrong to narrow it to this
capability's own routes.
