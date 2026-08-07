---
uid: report-7285dd57
id: REPORT-1624
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=ac)'
created_by: xgd
created_at: '2026-08-07T20:45:18.751741+00:00'
updated_at: '2026-08-07T20:45:18.751741+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace — Chrome, Origin & Display Panel
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-a994b8f3 (CAP-85) ·
Story tree: STORY-99 (story-e674c60a, `story_kind: feature`) only · 21 ACs, all
`active`.

**This is the first `ac`-level cycle on this capability.** The three prior
attempts recorded on this scope path were the `story`-level cycle
(report-c5a97ce2 FAIL → report-472feebd FAIL → report-3536002c FAIL →
report-774ff873 **PASS**, 2026-08-07 20:36). Per the level cascade, STORY-99's
body — as it stands after that pass — is the working reference here.

**Headline: the story-level report's forwarded warning must NOT be actioned as
written.** report-774ff873 finding #1 directed this cycle to author an AC under
STORY-99 covering the edit transport's reachability and refusal shape. That
behaviour is **already claimed exactly once** by AC-992 under STORY-100
(CAP-86), verified against the running origin. Authoring the directed AC would
create a cross-capability duplicate. The same holds for the served edit bridge,
already claimed by AC-1006 (STORY-101, CAP-87). Both are closed as `info` below
with the AC text that closes them.

The one genuine ac-level gap is different and was not previously named: **no AC
anywhere asserts that the workspace registers an editable mode displaying the
site's edit channel** — a behaviour STORY-99 claims in three separate passages,
that ships, and that two CAP-87 ACs silently presuppose.

**Read-method note:** report-774ff873 warned that `xgd ticket get --json`
truncates STORY-99's body at 11745 chars. Re-checked this attempt against
`git show HEAD:.xgd/tickets/hot/story-e674c60a.md`: the blob is 12235 B, the
frontmatter 490 B, the body 11745 B, and the CLI read is the **complete** body
(substring test: exact, with nothing following). The prior warning reflected an
earlier, longer body. No truncation affected this attempt; every AC body was
also read via `--json` and is well under the limit.

## Cumulative Intent Considered

STORY-99 carries `intent_uid: bundle-15c1f647` (BUNDLE-16, `free_and_reconciled`,
`merged_at_commit 1741ee5d`) and no `updated_by`. A bundle is not itself an ask,
so the ledger is walked at request/bug level. Statuses re-derived from the
tickets this attempt, not copied from report-774ff873.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (request-3b78151f) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight; `builder` is among its ungated offline verbs | YES — lands outside this capability (STORY-79) |
| REQ-115 (request-a6740b4a) | free_and_reconciled | 2026-07-31 | T1 builder chrome: webui consumed via each package's `exports`, Node origin + `control-app` front, `site` tab, multi-mode panel, mode-declared toolbar, split + namespaced persistence, shared confinement, publish through the existing path | YES — the primary intent |
| REQ-116 (request-41796766) | free_and_reconciled | 2026-07-31 | The edit render channel | context only — CAP-87 / STORY-98 |
| REQ-117 (request-395b67e6) | free_and_reconciled | 2026-07-31 | T3 copy editing end to end. Three sections touch this capability: viewport-fill (`94ae6fee`), "the loop is closed" (`cda7fe4d` — `/api/copy`, `/framework/edit-client.js`), and freshness | YES (the chrome/origin parts) |
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 | Image selection; added `GET /api/assets` to this origin | YES — claimed by STORY-102 (capability-b4ac88fc) |
| BUG-32 (bug-5cabb340) | free_coded | 2026-08-05 | `WEBUI_SCOPE` `@gendevlabs` → `@lagrangefoundry`; webui suites assert rather than skip green | **NO — not yet.** `free_coded` is the stable resting state; `tools/generate/src/cli/webui.ts:33` on this branch still reads `'@gendevlabs'` |
| REQ-119 (request-64864801) | draft | 2026-07-31 | Request-time renders inside `control-app`; deletes the front | NO — draft, retires nothing (bears on warning #2) |

Cumulative picture: **nothing is retired.** REQ-115 establishes the surface;
REQ-117 adds the window-fill fix, the edit transport, the served bridge and the
freshness directive. Every AC under STORY-99 describes live intent; no AC is a
candidate for `ac-deprecate`.

## Alignment Ledger

Every AC under STORY-99, mapped to the story-body passage it discharges.

| Element | Story-body surface / intent | Outcome |
|---|---|---|
| AC-959 single tab, stable id `site`, panel hosted inside it | "One tab, filling the window" / REQ-115 AC 2 | aligned |
| AC-960 one definition site per shown name | "Every name … has exactly one definition site" / REQ-115 AC 3 | aligned |
| AC-961 components byte-identical from an installed copy outside the repo | "consumed not copied" / REQ-115 D0 | aligned |
| AC-962 missing component names component + install command | REQ-115 D0 "the diagnostic upstream noted was missing" | aligned (`webui.ts` `MissingWebuiComponentError`) |
| AC-963 references derived from each package's declared entry points | "an upstream file move is reported here" / REQ-115 D0 | aligned |
| AC-964 single origin, front forwards verbatim | "A single workspace, at one address" | aligned to shipped behaviour; see **warning #2** on its proxy framing |
| AC-965 unconfigured vs unreachable are distinct explanatory failures | "An origin that is missing is not a blank page" | aligned (`apps/control-app/src/index.ts:26-33` 503, `:44-49` 502) |
| AC-966 View mode byte-identical to the rendered artifact | "the normal view is one [mode]" / REQ-115 AC 6 | aligned |
| — **the editable mode** — | "the editable render is another"; "The editable *mode* is registered here and shows the editable rendering"; "Registering it is what proves the mode contract with two real modes" | **GAP — violation #1.** Ships at `apps/control-app/src/builder/app.js:64-68`; no AC asserts it |
| AC-967 selector lists exactly the store, choosing switches the site | "the site selector lists the sites the store actually holds" | aligned |
| AC-968 mode switch preserves the pane | "switching modes changes what is displayed without rebuilding the pane" | aligned — but mode-agnostic ("two modes registered"), so it does not discharge the gap above |
| AC-969 an unheard-of mode works end to end | "Registering a mode is adding an entry — there is no branch" | aligned |
| AC-970 toolbar = exactly the active mode's declared controls | "A toolbar the active mode declares" | aligned; the unknown-control clause is grounded at `apps/control-app/src/builder/toolbar.js:71` (throws) |
| AC-971 open-in-new-tab equals the displayed URL | "lands on the identical URL the frame is already displaying" | aligned |
| AC-972 publish via the existing path, published channel served | "publish goes through the platform's existing publish behaviour" / REQ-115 AC 9 | aligned |
| AC-973 split, drag, collapse to rail, reopen to prior width | "A split, and it remembers" / REQ-115 AC 4 | aligned |
| AC-974 layout state survives reopen, every key namespaced | same bullet / REQ-115 AC 5 | aligned |
| AC-975 fills the window, follows a live resize, page never scrolls | REQ-117 follow-up `94ae6fee` | aligned, including the "report loudly rather than skip" clause |
| AC-976 every declared tab option reaches the chrome intact | same follow-up ("`fill` was silently dropped") | aligned; its mutation check correctly leans on AC-975's measurement |
| AC-977 every response non-cacheable, document included | REQ-117 freshness + COMMENT-601 (`65b9be7a`, "a hole in exactly one response is worse than none") | aligned; probe list is deliberately wider than STORY-99's own operations (see info #5) |
| AC-978 traversal confined identically on every tree | "Confinement" bullet, incl. the clamp-so-it-reads-as-not-found note | aligned |
| AC-979 unknown channel / unconsumed component → not found | no direct story-body anchor; ships at `builder.ts:201-206`, `:253-258` | aligned to code; see info #6 |
| Edit transport `/api/copy` reachability + expected refusal | "the read-and-apply steps of the write path … as a thin transport"; "a refused edit arrives as an *expected* refusal carrying the write path's own code, path and hint" | **claimed once, by AC-992 (STORY-100)** — info #3 |
| Served edit bridge `/framework/edit-client.js`, "as one implementation" | "the shared client code the editing gesture runs … served from the same source the renderer is built from" | **claimed once, by AC-1006 (STORY-101)** — info #4 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | coverage | STORY-99 (all 21 ACs) | `ac-add` | **No AC asserts the workspace registers an editable mode showing the site's edit channel.** STORY-99 claims this behaviour three times — in scope ("the normal view is one and the editable render is another"), in out-of-scope ("The editable *mode* is registered here and shows the editable rendering; the gesture that changes anything is not"), and in Technical Context ("The editable mode is registered, not implemented, here. Registering it is what proves the mode contract with two real modes"). It ships at `apps/control-app/src/builder/app.js:64-68` (`id: 'edit'`, `src: ({site}) => previewUrl(site, 'edit')`). Nothing covers it: AC-966 is View mode only; AC-968 and AC-969 are deliberately mode-agnostic (AC-968 verifies with "two modes registered", unnamed; AC-969 verifies with a mode "defined entirely in the test"), so both pass with zero shipped edit mode. Nor is it covered by a neighbour: STORY-98's 13 ACs (AC-948…AC-1008) own the edit channel's *output*, never its registration in the workspace; and CAP-87 **presupposes** it without asserting it — AC-993 verifies "over the page displayed in the workspace's edit mode" and AC-1005 "Display a non-editable rendering of a site in the workspace". Both would become unverifiable, not failing, if the mode were dropped | Author one AC under STORY-99: the workspace offers an editable mode among its modes, and selecting it displays that site's **edit channel** — asserted on the displayed document's URL/channel, with the site and mode round-tripping. Keep it strictly to *registration and what channel it points at*; what the edit channel **contains** is STORY-98 (AC-948…AC-958) and what the gesture **does** is STORY-101. Do not weaken AC-968/AC-969 to absorb it: their mode-agnosticism is the point of the extensibility contract |
| 2 | warning | consistency | AC-964 (acceptance_criterion-46d5804e) | `ac-edit` | **The criterion is written about a proxy, which its own story body says the ACs are not.** STORY-99 Technical Context states: "The acceptance criteria here are written about *one origin* and *what an operator observes*, not about a proxy, so they survive that change unaltered." AC-964 does not: its title says "forwarded verbatim", its criterion says "the front reinterprets nothing", and its verification requires comparing each response "against the same route fetched directly from the origin" — a second address that only exists while the front does. REQ-119 (`draft`, so it retires nothing yet) deletes the front; at that point the comparison degenerates to a route compared with itself and the criterion becomes **vacuously true** rather than failing. Silent loss of force, which is the failure mode this level exists to catch. The shipped behaviour is real and correctly described today (`apps/control-app/src/index.ts:38-41` forwards the `Request` unaltered) | Split the operator-observable invariant from the transitional mechanism: state the criterion as "the workspace document, its components, its browser source, the rendered channels and the workspace's operations are all reachable from one host, and no response is reinterpreted between the operator and the origin — the frame's document URL and the host's origin match, so no request is cross-origin". Keep the front-versus-origin byte comparison as a verification step **explicitly conditioned on a front being interposed**, so its removal reads as the step no longer applying rather than as a silently passing assertion |
| 3 | info | coverage | STORY-99 / AC-992 (acceptance_criterion-9561711e, STORY-100, CAP-86) | — | **report-774ff873 finding #1 is already discharged — do not act on it.** It directed this cycle to "author one AC … covering reachability and the shape of the refusal". AC-992 (`active`) already says: "The builder origin's editing endpoint exposes the same read and write operations as the command line, not a parallel implementation", and "A rejected edit … is answered as a **client fault** naming the offending field and carrying the same code, path and hint the command line reports, never as a generic server failure", verified "Against the running origin". That is the reachability half **and** the refusal-shape half. Adding the directed AC under STORY-99 would duplicate a criterion across CAP-85 and CAP-86 — an exclusivity defect traded for a coverage one. The story-level cycle checked neighbouring **story bodies** (its finding #6) but not their ACs, which is why it read the seam as unclaimed | none — no ac-level action. If the operator wants CAP-85 to hold the transport-reachability half, that is a *move* (narrow AC-992's first bullet as CAP-86 is validated, then add here), not an addition, and it belongs to a cross-capability decision rather than this cycle |
| 4 | info | coverage | STORY-99 / AC-1006 (acceptance_criterion-a5d4eb9c, STORY-101, CAP-87) | — | The served edit bridge is likewise claimed exactly once, on the other side. STORY-99 owns "that it is reachable here, and as one implementation"; AC-1006 (`active`) already asserts the resolution logic "reaches the browser as the same single source the rendering's address stamping is defined against, **delivered as a runnable browser module by the workspace's origin**, with its shared-contract import resolved to a fetchable address. No second, independently written copy … exists in the workspace's own browser source". Ships at `tools/generate/src/cli/builder.ts:327-346`. Adding a CAP-85 AC here would duplicate it | none |
| 5 | info | exclusivity | AC-977 vs STORY-102 (story-c46abfa6, capability-b4ac88fc) | — | AC-977's verification probes "the asset listing" — `GET /api/assets` (`builder.ts:219`), a route STORY-102 claims. No conflict: STORY-102 claims the listing's *existence and semantics*; AC-977 claims only that **no response from this origin is cacheable**, a whole-origin property whose whole force is that it admits no exemption ("There is no exempt response"). Narrowing the probe set to STORY-99's own operations would reintroduce exactly the single-hole hazard COMMENT-601 (`65b9be7a`) describes. Same reasoning covers its "an address read" probe, which is the `/api/copy` GET of info #3 | none — do not narrow AC-977 |
| 6 | info | consistency | AC-979 (acceptance_criterion-a54bfee4) | — | AC-979 (unknown channel / unconsumed component → not found) has no direct anchor in STORY-99's body: the Confinement bullet is about *escaping* a tree, not about a name that does not exist. It is nonetheless correct, shipped (`builder.ts:201-206` "Unknown channel", `:253-258` "Unknown component") and the natural negative space of "any rendered channel of any site in the store" and "components consumed" — a closed-set guarantee, not drift. Recorded so a later story-level cycle can add the half-sentence rather than a future ac cycle reading it as unsupported and proposing `ac-deprecate` | none here |
| 7 | info | exclusivity | AC-969 vs AC-970 | — | Both touch the toolbar: AC-969 asserts a foreign mode's declared controls render, AC-970 asserts the strip equals the active mode's declared set and re-derives on switch. Judged **not duplicate** — AC-969's property is extensibility (a mode the panel never heard of works end to end) and the toolbar clause is one leg of "end to end"; AC-970's is toolbar fidelity across a switch. Different criteria sharing one observation | none |

## Notes for the Editor

- **Exactly one repair belongs to this cycle: finding #1, one added AC under
  STORY-99.** Everything else is either a warning (#2, opportunistic) or an
  explicit *do-not-act* (#3, #4). In particular, **do not** implement
  report-774ff873's finding-#1 directive; it is closed by AC-992 and acting on
  it would put the same criterion in two capabilities.

- **Do not open STORY-99's body.** The story level passed at attempt 4 and its
  body already describes the editable mode three times over — the gap is the
  missing AC, not the story text. No `story-body-edit` is warranted here, and a
  body edit would re-enter the read/write regression that consumed attempts 2
  and 3.

- **Do not touch code.** There is no `code-issue` in this report. Every
  behaviour named above was verified present in the source this attempt
  (`app.js:64-68`, `toolbar.js:71`, `builder.ts:201-206/219/239/253-258/327-346/371-378`,
  `control-app/src/index.ts:26-49`). The working tree was not modified.

- **The seam pattern is now explicit, and future cycles should check it before
  raising a gap.** STORY-99 says "this one owns only that they are reachable
  over this origin" for two behaviours; in both cases the AC that pins that
  reachability lives on the *neighbour's* side (AC-992, AC-1006). Any cycle on
  CAP-85, CAP-86 or CAP-87 that reads a "reachable here" sentence as an
  uncovered claim must first read the neighbouring capability's **ACs**, not
  just its story body — that is the check the story-level cycle skipped.

- **Level-cascade note for the uat cycle.** Finding #1 is `ac-add`, so the uat
  level will inherit a new AC needing a substantive UAT. The existing evidence
  closest to it — `tests/req115-builder-composition.test.ts`
  `..._mode_switch_swaps_the_source_without_remounting` — is mode-agnostic by
  design and will not discharge it. Note also that the composition suite is
  `describe.skipIf`-gated on the implicit webui install (STORY-99 Technical
  Context; `tests/req115-builder-composition.test.ts:26/77/136/190`), so a UAT
  for the new AC placed in that file proves nothing on a fresh clone.

- **BUG-32 (bug-5cabb340) remains `free_coded` and uncounted**, re-confirmed
  this attempt at `tools/generate/src/cli/webui.ts:33` (`WEBUI_SCOPE =
  '@gendevlabs'`). On promotion it lands on AC-961/AC-962/AC-963 and on the
  skip-versus-assert posture of the webui suites. Both `type=request` and
  `type=bug` were swept this attempt; keep both.
