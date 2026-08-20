---
uid: report-8d70af88
id: REPORT-2336
type: report
title: 'UAT Coverage: Builder Workspace: Chrome, Origin & Display Panel'
created_by: xgd
created_at: '2026-08-20T03:02:28.502218+00:00'
updated_at: '2026-08-20T03:02:28.502218+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-a994b8f3
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Builder Workspace: Chrome, Origin & Display Panel

**Result**: PASS
**AC verdicts**: 31 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-2485c83c · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=upgrade`, 31 criteria) ·
Previous attempts: 4

**Supersedes REPORT-2103 (`report-97969c20`, 2026-08-16, FAIL 2/3/0).** Both of
that report's violations are closed, and two of its three warnings are closed by
work landed since. The closures were re-derived here against the criteria and
the test source, not taken from the intervening fix reports.

- **Violation 1 (the gesture's client bytes)** — closed by *ac-add + uat-add*:
  AC-1240 was authored (2026-08-20T01:54) and
  `test_UAT_AC1240_the_edit_client_is_served_derived_from_the_renderers_own_source`
  (`tests/reconciliation-builder-workspace-origin.test.ts:202-278`) asserts
  `served === derived` against the origin's own derivation. Its `uat_coverage`
  is moved `fail → pass` by this pass; it was the only non-`pass` criterion.
- **Violation 2 (the `/api/copy` transport)** — closed by *story-body-edit +
  cross-story pointer*, which is the second of the two resolutions REPORT-2103
  offered ("pick one owner; do not evidence it twice"). STORY-99's body now
  cedes the fidelity claim by name to AC-992 and retains only the transport
  claim. The pointer was verified rather than accepted: AC-992
  (`acceptance_criterion-9561711e`, `story_uid=story-37a3921b`, `uat_coverage:
  pass`) is evidenced by
  `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike`
  (`tests/reconciliation-copy-edit-write-path.test.ts:718-763`), which drives
  **this** origin (`startBuilder` → `/api/copy` GET and POST over real HTTP) and
  compares its answers field by field against the command line's. The behaviour
  is therefore evidenced, once, where the story says it is.
- **Warning 3 (AC-973's drag)** — closed: the test now dispatches a real
  `pointerdown`/`pointermove`/`pointerup` on the divider and asserts both the
  resulting ratio and the width written onto the primary pane
  (`chrome.test.ts:429-445`); the rail is read off rendered markers rather than
  `isCollapsed()` (`:451-454`). A narrower residue remains — warning 1 below.
- **Warning 4 (AC-964's route set)** — carried forward unchanged as warning 2.
- **Warning 5** of REPORT-2103 is subsumed by warning 3 below.

## Cumulative Intent Considered

Chronological; statuses re-read from the ticket store in this run.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUG-32 | `bug-5cabb340` | merged | created 2026-08-05, merged `125f1dcc` | Component scope rename in lockstep; one definition site; the declared browser-source exception; consumption evidence made unconditional. Rewrote AC-960/961/963 | YES |
| BUNDLE-16 (REQ-115 + REQ-117 + REQ-44) | `bundle-15c1f647` | free_and_reconciled | created 2026-08-07, merged `1741ee5d` | REQ-115: the chrome — component consumption, the `site` tab, the multi-mode panel, the mode-declared toolbar, split + persistence, confinement, the Node origin behind a verbatim front. REQ-117: the `/api/copy` transport and the gesture's client bytes derived from the renderer's source. REQ-44: preflight, expressed elsewhere | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | created 2026-08-08, merged `f1664c55` | Toolbar re-derives on mode **and** site; a replaced control is inert by design. Origin of AC-1110, widened AC-970 | YES |
| BUNDLE-17 (REQ-119 + REQ-122 + 6 more) | `bundle-e59210c5` | free_and_reconciled | created 2026-08-10, merged `0198704b` | REQ-119: request-time draft-side renders, one implementation behind a writer and a reader, no artifact on disk, invalid draft surfaced, `published` untouched. Origin of AC-1031…AC-1036. REQ-122: the chat panel filling the secondary pane | YES |
| REQ-145 / REQ-147 / REQ-148 | `request-b474390f`, `request-23fd6e61`, `request-7ae3c2cc` | ready_to_reconcile | 2026-08-15, unlanded here | `control-app` becomes the builder; L1 render in workerd; the proxy deleted. **Not in this story's intent chain and not in this tree** — `apps/control-app/src/index.ts:31` still reads `BUILDER_ORIGIN` and `tools/generate/src/cli/builder.ts` still exists; REQ-145's `commits` carry a `working_sha` with `main_sha: null` | Imminent, but **retires nothing yet** — see note below |

**No intent in the ledger retires any behaviour this capability describes.**
Every one of the 31 criteria is active; there are zero deprecations and zero
`needs_review`.

On REQ-145: it is `ready_to_reconcile`, so by the status table it is imminent.
It is nonetheless recorded as retiring nothing, deliberately. Its code is not in
this tree, it is absent from CAP-85's and STORY-99's `intent_uid`/`updated_by`
chains, and STORY-99's Technical Context already declares the present
arrangement "deliberate and temporary" and states that the criteria are written
about *one origin and what an operator observes* precisely so they survive that
move. AC-965 is the one criterion whose observable surface is arrangement-shaped
(`BUILDER_ORIGIN` unconfigured vs unreachable); deprecating it now would retire
behaviour the shipped code still has. The right moment is REQ-145's own
reconciliation, and this is recorded so that pass does not have to rediscover it.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-99 | BUG-32, REQ-115, BUG-33, REQ-119, REQ-122 | aligned | Origin, chrome, one-definition names, component consumption + working-tree anchoring, modes, derived toolbar + control lifetime, split + persistence, request-time channels, freshness, confinement — each described and each evidenced |
| STORY-99 | REQ-117 (client bytes) | aligned | Was `incomplete` in REPORT-2103; closed by AC-1240 + its UAT |
| STORY-99 | REQ-117 (`/api/copy` transport) | aligned | Was `incomplete`; closed by story-body cession to AC-992, whose test drives this origin. Not re-evidenced here, by design |
| STORY-99 | REQ-145 / REQ-147 | aligned | Nothing in the body claims the arrangement REQ-145 changes; the deviation is declared as temporary |

**31 criteria ↔ 38 AC-traceable UAT functions across 8 files**, enumerated from
`test_UAT_AC*` identifiers in `tests/` rather than from `.xgd/uat_index.json`
(that index is empty — `{"acs": {}}` — and would have reported every criterion
uncovered). Mapping is 1:1 except AC-960 (×3), AC-970 (×2) and AC-1030 (×5),
where one criterion has clauses needing different test shapes.

Read in full against their criteria rather than sampled: AC-959/960/968/969/970/
971/973/974/976 (chrome), AC-961/962/963/964/965/966/975/977/978/979/1240
(origin), AC-967/972/1029 (mounted, jsdom over a live origin — publish is
*clicked*, the listing is read off the store), AC-1031…AC-1036 (request-time
render, real HTTP), AC-1110 + AC-970's site half (subscriptions counted at the
panel across 20 re-derivations), AC-1030 (four checkout shapes as git-made
fixtures running the shipped resolver in a real `node`), AC-960's two scope
halves (tracked-file enumeration; browser source coupled to the freshly
generated document).

None is trivial and none mocks the thing under test. The three tests that read
repository text do so because the criterion's own subject is what the repository
says (AC-960's one-definition scan, AC-1240's no-second-copy clause) or to
*enumerate* routes that are then probed over real HTTP with a both-directions
coverage assertion (AC-977). None is structural in the disqualifying sense.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-973 (`acceptance_criterion-e1acae35`) | uat-edit | Residue of an otherwise sound repair. To make the drag reachable under jsdom (no layout, every box 0×0), `tests/reconciliation-builder-workspace-chrome.test.ts:393-406` replaces `HTMLElement.prototype.getBoundingClientRect` for **every** element with a fixed 1000×800 box. The stand-in is declared in the test's own comment and restored in a `finally` (`:465-467`). Because every element reports the same width, the test cannot distinguish "the component reduces the delta against its container" from "against the divider, the primary pane, or the body" — a mis-measured element yields an identical ratio. The criterion's subject (gesture wired to ratio) is evidenced; *which* box the reduction divides by is not | Override `getBoundingClientRect` as an own property on `app.split.element` alone, restored the same way, and leave the other elements at 0×0. The drag arithmetic then only works if the component measures the element the test intended. Low priority — the criterion passes as written |
| 2 | warning | uat | AC-964 (`acceptance_criterion-46d5804e`) | uat-edit | The criterion enumerates "the workspace document, its components, its browser source, the rendered channels and the workspace's operations" as the trees one host answers for, but `test_UAT_AC964_…` (`tests/reconciliation-builder-workspace-origin.test.ts:746-761`) runs the front-vs-origin verbatim comparison over four routes: `/`, a component module, `/preview/alpha/draft/`, `/api/sites`. `/builder/main.js`, `/builder/builder.css` and `/framework/edit-client.js` are served and appear in AC-977's and AC-979's sweeps but are never compared for reinterpretation. Not a gate: the criterion's own Verification asks for "a representative set of routes" and names exactly those four, so the test matches the criterion as written — the gap is between the criterion's prose and its Verification | Either add `/builder/main.js` and `/framework/edit-client.js` to the comparison list (two array entries), or narrow the criterion's prose to the trees its Verification actually names. Prefer the former — the browser source and the edit bridge are the two trees whose reinterpretation would be invisible anywhere else |
| 3 | warning | uat | AC-975 (`acceptance_criterion-86d9e15d`) | uat-edit | The criterion requires that "where no browser can be launched the measurement must report loudly rather than skip silently". `test_UAT_AC975_…` (`origin.test.ts:860-921`) `console.warn`s and then **returns green** in three separate conditions (components absent, playwright unresolvable, no launchable chromium). A warning in a scrollback is louder than nothing but still reports as a passing test, so a machine that can never launch a browser shows a green criterion indefinitely. Raised as a warning, not a violation: the criterion explicitly permits a report rather than a failure, and the test does report | Mark the run skipped (`ctx.skip()`) rather than returning, so the outcome is distinguishable from a pass in a machine-readable result, and keep the warning text |
| 4 | info | uat | `tests/reconciliation-builder-workspace-origin.test.ts` | — | **Ten of the eleven CAP-85 UATs in this file could not be executed in this environment**, so their verdicts above rest on reading them against their criteria — which is this check's stated rubric — and not on a green run. Reproduced here, not accepted from REPORT-2324: `pnpm vitest run tests/reconciliation-builder-workspace-origin.test.ts` → `1 failed \| 1 passed \| 9 skipped (11)`, `Error: listen EPERM: operation not permitted` on both `0.0.0.0` and `127.0.0.1`, thrown at `tools/generate/src/cli/builder.ts:623` (`server.listen`) inside `beforeAll`, and again from AC-965's own two-Worker probe. Only `test_UAT_AC962_…` (which binds nothing) ran. Environment-scoped and pre-existing — the component store is installed, so this is unrelated to the silent-skip hazard AC-1030 exists to rule out | None for the editor. The regression run must execute this file where an ephemeral local port can be bound; a green there is what turns these ten verdicts from read to observed |

## Notes for the Editor

**Nothing here requires a fix cycle.** All three warnings are optional
improvements to tests that already evidence their criteria, and the info row is
an environment fact, not an editor action.

**The two closures are structurally different, and both should be left alone.**
AC-1240 closed its gap by *adding* a criterion and a test; the `/api/copy` gap
closed by *not* adding one — the story cedes the claim to AC-992 under CAP-88
and keeps only the transport. Re-evidencing the copy transport under CAP-85
would recreate exactly the double-ownership REPORT-2103 warned against.

**One thing a later pass should not undo:** AC-966's never-rendered-site guard
(`origin.test.ts:146-162`) is what stops that criterion passing off a shelf
copy, and AC-1240's `served === derived` equality is against the shipped
derivation (`transpileForBrowser`, `builder.ts:123-135`), not a re-implementation
of it. Both are load-bearing.

**Carried forward for CAP-88, not actionable here.** AC-992 — which STORY-99 now
points at by name — asserts in its third bullet that a successful save
"re-renders both the editable rendering and the plain draft rendering before
reporting success", verified against "rendered outputs **on disk**". REQ-119
removed that step, and STORY-99's Technical Context says so. The two cannot both
be current. The pointer STORY-99 makes cites only AC-992's first two properties
(same read/write operations; same code, path and hint), both of which the test
genuinely asserts, so nothing in CAP-85's matrix depends on the disputed clause.
Forward it to CAP-88's own cycle.

**On field writes.** AC-1240's `uat_coverage` was moved `fail → pass`; STORY-99's
and CAP-85's were moved `fail → pass`. The other thirty criteria already carried
`pass`, which is this pass's verdict for each of them, and were deliberately not
rewritten: an unnecessary write bumps `updated_at`, and the alignment level above
this one reads those timestamps to decide whether its own verdict still stands on
the text it was issued against.
