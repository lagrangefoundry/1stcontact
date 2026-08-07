---
uid: report-ad5cc5cc
id: REPORT-1626
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-07T20:54:29.275744+00:00'
updated_at: '2026-08-07T20:54:29.275744+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace — Chrome, Origin & Display Panel
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story tree: STORY-99 (story-e674c60a, `story_kind: feature`, the only story) ·
**22 ACs, all `active`** (21 at the previous attempt, +AC-1029).

**Attempt 2 of the `ac` cycle.** Attempt 1 (report-7285dd57) recorded 1
violation + 1 warning; the fix call (report-c11303d1) claimed both discharged.
Both claims were re-verified against the live tickets this attempt, not taken
from the fix report — see "Verification of the Previous Attempt" below. A full
independent coverage / consistency / exclusivity sweep of all 22 ACs was then
run from the story body and the intent ledger; it surfaced no new violation.

Per the level cascade, STORY-99's body is the working reference: the `story`
level passed at report-774ff873 (0 violations, 1 warning, 2026-08-07 20:36).
Intent was consulted only where the story body was silent (AC-979) or where a
seam is split across capabilities (AC-992, AC-1006).

## Cumulative Intent Considered

STORY-99 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
`merged_at_commit 1741ee5d`) and no `updated_by`. A bundle is not itself an ask,
so the ledger is walked at request/bug level. **Every status below was
re-derived from the tickets this attempt**, not copied from report-7285dd57.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (request-3b78151f) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight; `builder` is explicitly among its ungated offline verbs | YES — but lands outside this capability (STORY-79) |
| REQ-115 (request-a6740b4a) | free_and_reconciled | 2026-07-31 | T1 builder chrome: webui consumed through each package's `exports`, Node origin + `control-app` front, `site` tab, multi-mode panel, mode-declared toolbar, split + namespaced persistence, shared confinement, publish through the existing path | YES — the primary intent |
| REQ-116 (request-41796766) | free_and_reconciled | 2026-07-31 | The edit render channel | context only — CAP-87 / STORY-98 |
| REQ-117 (request-395b67e6) | free_and_reconciled | 2026-07-31 | T3 copy editing end to end. Three sections touch this capability: viewport-fill (`94ae6fee`), "the loop is closed" (`cda7fe4d` — `/api/copy`, `/framework/edit-client.js`), and freshness | YES (the chrome/origin parts) |
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 | Image selection; added `GET /api/assets` to this origin | YES — claimed by STORY-102 (capability-b4ac88fc) |
| BUG-32 (bug-5cabb340) | free_coded | 2026-08-05 | `WEBUI_SCOPE` `@gendevlabs` → `@lagrangefoundry`; webui suites assert rather than skip green | **NO — not yet.** Re-confirmed this attempt: `tools/generate/src/cli/webui.ts:33` on this branch still reads `'@gendevlabs'`, so the matrix correctly describes the code that is here |
| REQ-119 (request-64864801) | draft | 2026-07-31 | Request-time renders inside `control-app`; deletes the front | NO — `draft`, retires nothing (bears on AC-964, now correctly future-proofed) |

Cumulative picture: **nothing is retired.** REQ-115 establishes the surface;
REQ-117 adds the window-fill fix, the edit transport, the served bridge and the
freshness directive. Every AC under STORY-99 describes live intent; **no AC is a
candidate for `ac-deprecate`.**

## Verification of the Previous Attempt

Both repairs from report-c11303d1 were re-read from the live tickets and checked
against what report-7285dd57 actually asked for.

| Prior finding | Claimed fix | Verified this attempt |
|---|---|---|
| #1 violation — no AC asserts the workspace registers an editable mode | AC-1029 authored | **Genuine.** `acceptance_criterion-f1115dda` / AC-1029 exists, `active`, `story_uid: story-e674c60a`, `kind: behavior`, created 2026-08-07T20:47:47. Its criterion is scoped exactly as directed — *registration and which channel the mode points at* — and its body explicitly excludes what the edit channel contains (CAP-87 / STORY-98) and what the gesture does (STORY-101). It carries a written non-duplication clause naming why AC-968 and AC-969 do not discharge it. Shipped behaviour re-confirmed at `apps/control-app/src/builder/app.js:64-69` (`registerMode({id:'edit', src: ({site}) => previewUrl(site,'edit')})` chained after `view`→`draft`) |
| #1 side-condition — "do not weaken AC-968/AC-969 to absorb it" | untouched | **Held.** Both still read as before; AC-968 still verifies with "two modes registered" (unnamed), AC-969 still with a mode "defined entirely in the test". Their mode-agnosticism — the extensibility contract — is intact |
| #1 side-condition — "do not open STORY-99's body" | untouched | **Held.** STORY-99 `last_field_updated: body`, `updated_at 2026-08-07T20:27:53` — *before* the fix call (20:47). The body was not rewritten, so the attempt-2/3 read-from-stale regression did not recur |
| #2 warning — AC-964 written about a proxy, would become vacuously true when REQ-119 deletes the front | AC-964 rewritten | **Genuine and correctly done.** Title is now "…with nothing reinterpreted in between"; the criterion states the operator-observable invariant (one host; nothing reinterpreted; frame document URL and host origin match, so no request is cross-origin) and relegates the local-Node-behind-an-edge-front arrangement to a parenthetical naming it as the story's own transitional detail. The front-vs-origin byte comparison survives as a verification step **explicitly conditioned on a front being interposed**, with the instruction that absent a front it "must be skipped with a stated reason, rather than degenerating into a route compared with itself and passing vacuously". The loss-of-force failure mode is now named inside the criterion, so it cannot be silently reintroduced |
| #3–#7 — explicit *do-not-act* / informational rows | left alone | **Held.** AC-992 (`acceptance_criterion-9561711e`, STORY-100) and AC-1006 (`acceptance_criterion-a5d4eb9c`, STORY-101) both re-read this attempt and both still `active` and still claiming their halves; no duplicate was authored under STORY-99. AC-977's probe set was not narrowed. AC-979 untouched |
| Code | none | **Held.** No `code-issue` existed and none was invented. Spot-checks this attempt found the described source unchanged: `app.js:57-69`, `toolbar.js:71` (throws on an action id no registry entry matches), `webui.ts:33` |

## Alignment Ledger

All 22 ACs under STORY-99, mapped to the story-body passage each discharges.
`✚` marks the AC added since attempt 1; `✎` the AC rewritten since attempt 1.

| Element | Story-body surface / intent | Outcome |
|---|---|---|
| AC-959 single tab, stable id `site`, panel hosted inside it | "One tab, filling the window" / REQ-115 AC 2 | aligned |
| AC-960 one definition site per shown name | "Every name … has exactly one definition site" / REQ-115 AC 3 | aligned |
| AC-961 components byte-identical from an installed copy outside the repo | "consumed not copied" / REQ-115 D0 | aligned |
| AC-962 missing component names component + install command | REQ-115 D0 "the diagnostic upstream noted was missing" | aligned (`webui.ts:67`) |
| AC-963 references derived from each package's declared entry points | "an upstream file move is reported here" / REQ-115 D0 | aligned |
| ✎ AC-964 one origin, nothing reinterpreted, frame not a foreign document | "A single workspace, at one address" | **aligned — attempt-1 warning closed.** Now written about one origin and what an operator observes, as STORY-99's Technical Context requires; survives REQ-119 unaltered |
| AC-965 unconfigured vs unreachable are distinct explanatory failures | "An origin that is missing is not a blank page" | aligned |
| AC-966 View mode byte-identical to the rendered artifact | "the normal view is one [mode]" / REQ-115 AC 6 | aligned |
| ✚ AC-1029 the workspace registers an editable mode pointing at the edit channel | "the editable render is another"; "The editable *mode* is registered here and shows the editable rendering"; "Registering it is what proves the mode contract with two real modes" | **aligned — attempt-1 violation closed.** The mode contract is now true of two *real* modes |
| AC-967 selector lists exactly the store, choosing switches the site | "the site selector lists the sites the store actually holds" | aligned |
| AC-968 mode switch preserves the pane | "switching modes changes what is displayed without rebuilding the pane" | aligned (mode-agnostic by design — no longer a gap, AC-1029 carries the real-mode claim) |
| AC-969 an unheard-of mode works end to end | "Registering a mode is adding an entry — there is no branch" | aligned |
| AC-970 toolbar = exactly the active mode's declared controls | "A toolbar the active mode declares" | aligned; the unknown-control clause is grounded at `toolbar.js:71` |
| AC-971 open-in-new-tab equals the displayed URL | "lands on the identical URL the frame is already displaying" | aligned |
| AC-972 publish via the existing path, published channel served | "publish goes through the platform's existing publish behaviour" / REQ-115 AC 9 | aligned |
| AC-973 split, drag, collapse to rail, reopen to prior width | "A split, and it remembers" / REQ-115 AC 4 | aligned |
| AC-974 layout state survives reopen, every key namespaced | same bullet / REQ-115 AC 5 | aligned |
| AC-975 fills the window, follows a live resize, page never scrolls | REQ-117 follow-up `94ae6fee` | aligned, including "report loudly rather than skip" |
| AC-976 every declared tab option reaches the chrome intact | same follow-up ("`fill` was silently dropped") | aligned |
| AC-977 every response non-cacheable, document included | REQ-117 freshness + COMMENT-601 (`65b9be7a`) | aligned; probe set deliberately wider than STORY-99's own operations (info #2) |
| AC-978 traversal confined identically on every tree | "Confinement" bullet, incl. the clamp-reads-as-not-found note | aligned |
| AC-979 unknown channel / unconsumed component → not found | no direct story-body anchor; ships at `builder.ts:201-206`, `:253-258` | aligned to code — info #3, carried forward for a story-level cycle |
| Edit transport `/api/copy` reachability + expected refusal | "the read-and-apply steps of the write path … as a thin transport"; "a refused edit arrives as an *expected* refusal carrying the write path's own code, path and hint" | **claimed exactly once, by AC-992 (STORY-100, CAP-86)** — re-verified `active` this attempt |
| Served edit bridge `/framework/edit-client.js` | "the shared client code the editing gesture runs … served from the same source the renderer is built from … as one implementation" | **claimed exactly once, by AC-1006 (STORY-101, CAP-87)** — re-verified `active` this attempt |

**Coverage cross-check against REQ-115's own numbered ACs** (independent of the
story body, since REQ-115 is the primary intent): 1→AC-961/962/963, 2→AC-959,
3→AC-960, 4→AC-973, 5→AC-974, 6→AC-966/AC-967/AC-964, 7→AC-968/AC-969,
8→AC-971, 9→AC-972. All nine discharged. The three served channels are each
covered: draft by AC-966, edit by AC-1029, published by AC-972.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-99 (22 ACs) | — | The attempt-1 violation is closed. Every behavioural passage of STORY-99's body, and all nine of REQ-115's own ACs, now map to at least one active AC; the two "reachable here" seams map to exactly one AC each on the neighbouring capability's side (AC-992, AC-1006) | none |
| 2 | info | exclusivity | AC-977 vs STORY-102 (story-c46abfa6, capability-b4ac88fc) | — | AC-977's verification probes "the asset listing" — `GET /api/assets`, a route STORY-102 claims. No conflict: STORY-102 claims that listing's *existence and semantics*; AC-977 claims only that **no response from this origin is cacheable**, a whole-origin property whose entire force is that it admits no exemption. Narrowing the probe set would reintroduce the single-hole hazard COMMENT-601 (`65b9be7a`) describes. Same reasoning covers its "an address read" probe (the `/api/copy` GET owned by AC-992) | none — do not narrow AC-977 |
| 3 | info | consistency | AC-979 (acceptance_criterion-a54bfee4) | — | Carried forward from attempt 1, unchanged and still correct: AC-979 has no direct anchor in STORY-99's body (the Confinement bullet is about *escaping* a tree, not about a name that does not exist). It is nonetheless shipped (`builder.ts:201-206` "Unknown channel", `:253-258` "Unknown component") and is the natural negative space of "any rendered channel of any site in the store". A half-sentence in the story body would close it — that is a `story-body-edit` and therefore **not** this level's action | none here; for a future story-level cycle |
| 4 | info | exclusivity | AC-1029 vs AC-967 | — | Judged **not duplicate.** Both verifications change the selected site, but the criteria differ: AC-967's is selector fidelity (options equal the store exactly) plus that a selection changes the displayed site *in the current mode*; AC-1029's is that the workspace's own editable mode targets the edit channel and that mode and site *compose*. AC-967 passes with only one mode registered; AC-1029 cannot. Different criteria sharing one gesture | none |
| 5 | info | exclusivity | AC-969 vs AC-970 | — | Re-confirmed not duplicate (carried from attempt 1): AC-969's property is extensibility (a mode the panel never heard of works end to end, of which the toolbar is one leg); AC-970's is toolbar fidelity across a switch | none |
| 6 | info | — | BUG-32 (bug-5cabb340) | — | Remains `free_coded` and therefore uncounted. Independently re-confirmed this attempt at `tools/generate/src/cli/webui.ts:33` (`WEBUI_SCOPE = '@gendevlabs'`) — the fix is not on this branch, so the matrix as written correctly describes the code that is here. On promotion it lands on AC-961/AC-962/AC-963 and on the skip-versus-assert posture of the webui suites. Not `needs_review`: the ledger is not ambiguous, the state is simply not yet reconciled | none |

## Notes for the Editor

- **Nothing to repair at this level.** Zero violations, zero warnings, zero
  `needs_review`. All six findings are `info` — ledger entries, not actions.

- **The seam pattern is confirmed and should stay in force.** STORY-99 says
  "this one owns only that they are reachable over this origin" for two
  behaviours; in both cases the AC pinning that reachability lives on the
  *neighbour's* side (AC-992 under CAP-86, AC-1006 under CAP-87), and both were
  re-read `active` this attempt. Any future cycle on CAP-85, CAP-86 or CAP-87
  that reads a "reachable here" sentence as an uncovered claim must first read
  the neighbouring capability's **ACs**, not just its story body — the omission
  that produced report-774ff873's misdirected finding #1.

- **AC-964's conditioned verification step is load-bearing; do not simplify it.**
  Its whole point is that when REQ-119 (`draft`) deletes the front, the
  front-vs-origin comparison must read as *no longer applicable and skipped with
  a stated reason*, never as a route compared with itself and passing. A future
  editor tidying that clause into an unconditional comparison would silently
  restore the defect attempt 1 caught.

- **Level-cascade note for the `uat` cycle.** AC-1029 is new and is an immediate
  uat-level coverage gap by construction — no test discharges it yet, and
  `tests/req115-builder-composition.test.ts`
  `..._mode_switch_swaps_the_source_without_remounting` will **not**, being
  mode-agnostic by design. The fix report's forwarded recommendation is sound
  and is endorsed here: place the UAT in the gated composition suite with the
  other REQ-115 mode evidence and accept the declared, reported skip that
  STORY-99's Technical Context already names as a known coverage gap
  (`tests/support/webui-installed.ts`;
  `tests/req115-builder-composition.test.ts:26/77/136/190`) — rather than
  weakening AC-1029 to fit an ungated harness. Panel-only evidence would prove
  the panel's registry works, which is what AC-969 already covers, not that *the
  workspace* registers an editable mode.

- **Read-method note.** STORY-99's body was read via `xgd ticket get --json`
  (11 745 chars) and the truncation hazard flagged in earlier attempts did not
  recur; the story's `updated_at` (20:27:53) predates the fix call (20:47), so
  no write-from-stale-read could have occurred. All 22 AC bodies were read via
  `--json` and are well under any limit. Note for tooling: `AC-1029` is not yet
  resolvable by human ID (`xgd ticket get AC-1029` → `TICKET_ID_NOT_FOUND`)
  while `acceptance_criterion-f1115dda` resolves normally — a stale
  human-ID index entry, not a ticket defect.

- **Read-only.** No ticket, test or source file was modified by this check.
