---
uid: report-30a3346c
id: REPORT-1654
type: report
title: 'Capability Report: bug-5cabb340'
created_by: xgd
created_at: '2026-08-07T23:21:30.665714+00:00'
updated_at: '2026-08-07T23:21:30.665714+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_report
  subject_uid: bug-5cabb340
---

# Capability Report: bug-5cabb340

Generated: 2026-08-07
Intent: bug-5cabb340 (BUG-32 — WEBUI_SCOPE rebrand to `@lagrangefoundry`)

## 0. Validation Scope

Intent plan (REPORT-1652 / `report-b798881b`) contains **exactly one plan item**,
`item_type: upgrade`, targeting `story-e674c60a` (STORY-99, `story_kind: upgrade`).
Breakdown recorded in the plan: feature=0, upgrade=1, reconciliation=0, refactor=0,
test_infrastructure=0, composition=0.

```yaml
validation_scope:
  category_a_stories: []          # no feature/test_infrastructure items
  category_b_stories: ["story-e674c60a"]   # STORY-99, upgrade
  step_1_applies: false
```

| Category | Stories | Checks Applied |
|----------|---------|----------------|
| A (feature/test_infrastructure) | — (none) | SKIPPED — Steps 1 and 1c do not apply |
| B (upgrade) | STORY-99 (`story-e674c60a`) | Reduced: behavioral AC quality, intent consistency, upgrade coverage, capability assignment |

**In-scope for pass/fail (Step 4b):** STORY-99 only — `updated_by: ['bug-5cabb340']`.
Its `intent_uid` is `bundle-15c1f647`, so it is a cross-intent story modified by
this intent, which places it in scope. All other stories visible in the capability
map are out of scope and reported informationally only.

## 1. Coverage Findings

### Epic → Story Coverage (Category A only)

**Status**: SKIPPED (no Category A stories)

No feature or test-infrastructure items exist in this plan. STORY-99 pre-dates
this intent and is modified in place; it is not required to "cover" the intent.
Per the story-type rules, no epic→story coverage check is performed and no
"missing story" finding is raised.

### Story → AC Quality

STORY-99 carries 21 acceptance criteria. This intent modifies three — AC-960,
AC-961, AC-963 — and adds/removes none, matching the plan's
`acceptance_criteria_changes` exactly (`add: []`, `remove: []`, `modify: [960, 961, 963]`).

| Story | Category | Status | Issues |
|-------|----------|--------|--------|
| STORY-99 (`story-e674c60a`) | B (upgrade) | QUALITY OK | None blocking |

#### Upgrade coverage — does the AC set cover the scope the intent declares?

The intent declares six changed surfaces and one explicit non-change. Every one
maps to a modified AC:

| Intent-declared scope | Covering AC | Verdict |
|---|---|---|
| Scope moves to the new name and is written **once** | AC-960 | Covered |
| `chromeHtml()`'s two hardcoded literals route through the single declaration | AC-960 (one declaration, everything composes from it) + AC-963 (generated map keys) | Covered |
| Served browser sources renamed in place — the bounded exception | AC-960 (exception declared **and pinned**: every bare specifier the browser source names must appear in the freshly generated document) | Covered — this is the runtime-only failure mode the intent names as most dangerous, and it is the one an AC could most easily have missed |
| Tracked chrome artifact (`index.html`) must not sit stale | AC-960 (enumerates **every tracked text file**, not a fixed source-root list) | Covered |
| Resolution must reach the *correct* package, not a same-named leftover | AC-961 (resolved package's own published identity must be under the scope in use, checked per component so the failure names which one) | Covered |
| The silent-green defect: presence-gate makes "renamed upstream, not here" look like "not installed" | AC-961 — explicitly *"This is asserted, not skipped… It does not report that there was nothing to check"*, and installation is *"an outcome of the check rather than a precondition for running it"* | Covered — this is the ticket's central failure mode and the AC addresses it directly rather than by implication |
| Import map keys all under the current scope, none under the superseded one | AC-963 | Covered |
| `.xgd/quality.yaml`'s `ai.gendevlabs.*` plugin namespace deliberately retained | AC-960's declared exclusion list | Covered |

No coverage gap found.

#### Consistency with the updated story body and with the intent

AC-961's unconditional consumption evidence and AC-962's unchanged
missing-component diagnostic do **not** conflict. The story body's Technical
Context draws the same line the ACs do: evidence about *consumption* is
unconditional; evidence about *mounting* still skips with a stated reason. AC-962
governs the diagnostic, not the gate. No AC contradicts the intent, and no AC
describes behavior the intent removes.

#### Implementation-AC check — PASS

None of the three modified ACs can pass with dead code. Each asserts an outcome:
what a reader is served, what the generated document declares, what the resolved
package declares about itself.

#### Internal identifier leak check — PASS

This is the check most at risk here, because the plan and technical design are
saturated with internal identifiers (`WEBUI_SCOPE`, `WEBUI_PACKAGES`,
`chromeHtml()`, `webuiPackageDir()`, `tools/generate/src/cli/webui.ts`). **None of
them appear in any AC body.** The ACs speak in behavioral terms throughout — "its
single declaration", "the workspace's own browser source", "the installed package
that gets resolved", "the generated workspace document". The identifiers stay
where they belong, in the design artifacts.

#### Boundary evidence rule — PASS

| AC | Boundary |
|----|----------|
| AC-960 | The tracked repository content as a published artifact; the mounted workspace's rendered label and accessible name; the freshly generated workspace document |
| AC-961 | HTTP responses over the workspace origin (byte comparison); each resolved package's own published identity |
| AC-963 | The fetched workspace document, plus requesting each declared reference over the origin |

No AC requires importing an internal module and calling a function to verify it.

#### Generalization check — PASS, and notably well handled

The ACs never write either scope literal. They say "the scope in use" and "a scope
the components were previously published under". A future rename therefore does
not invalidate the criteria — which is precisely the property this ticket exists
to establish. AC-963 additionally forbids asserting against a committed copy of
the document ("never a copy of it committed to the repository — a committed copy
compared against itself proves nothing"), closing the tautological-assertion hole.

#### Behavioral term clarity (Step 1b) — PASS

The two load-bearing terms are defined behaviorally rather than by name:
- *"declared, bounded exception"* — defined by what holds it in step (every
  component the browser source names must also be declared by the generated
  document), not merely asserted as permitted.
- *"the right copy, not merely a copy with the right name"* — defined as the
  resolved package's own published identity, with the failure mode spelled out
  ("a same-named package left behind under a scope the components were previously
  published under does not satisfy this, even though it resolves and mounts").

Neither leaves room for a reasonable implementer to interpret them weakly.

## 2. Capability State

20 capability tickets exist (19 active, 1 superseded). All 25 stories in the
project carry a `capability_uid`; none is unassigned.

Capability relevant to this intent:

| ID | Name | Lifecycle | Stories |
|----|------|-----------|---------|
| CAP-85 (`capability-a994b8f3`) | Builder Workspace: Chrome, Origin & Display Panel | active | STORY-99 |

CAP-85's declared scope already contains *"Component consumption — how the shared
UI components enter this product"*, so this upgrade lands inside an existing
behavioral bucket. No new capability is warranted; creating one would have split
component consumption across two capabilities.

Populated capabilities (all within limits):

| ID | Capability | Stories |
|----|-----------|---------|
| CAP-70 | Framework Substrate: L1 Layout, Values & Behavior Modules | 7 |
| CAP-63 | 1c Capture & Diff Fidelity | 5 |
| CAP-82 | Site Delivery: Deploy & Public Serving | 3 |
| CAP-71 | L1 Reproduction Pipeline: Fold & Acceptance Gate | 2 |
| CAP-80, 81, 83, 84, 85, 86, 87, 88 | — | 1 each |

- Every story assigned to exactly one capability: **YES**
- No capability exceeds 10 stories: **YES** (max 7, CAP-70)
- Each populated capability's stories share a coherent behavioral theme: **YES**
- Capability names describe behavior, not layers: **YES**

## 3. Proposed Changes

- Created: None
- Deprecated: None
- Reassignments: None
- Split/merged: None

No capability action is required by this intent.

## 4. Validation Status

**Status**: PASS

All in-scope checks pass. The three modified ACs are behavioral, boundary-testable,
free of internal identifier leakage, generalized against the specific scope strings,
and collectively cover the full scope the intent declares — including the two
surfaces most likely to have been missed (the tracked `index.html` artifact and the
browser-source ↔ import-map coupling that fails only at runtime).

### Observations (non-blocking, no fix required before proceeding)

1. **AC-960's exclusion wording is slightly looser than its intent.** The AC
   excludes *"the ticket and workflow store"*; the retained `ai.gendevlabs.*`
   quality-plugin namespace actually lives in a quality-configuration file rather
   than in the ticket store proper. The technical design (REPORT `report-278c7ee8`,
   constraint C5) resolves this by excluding that whole directory and documenting
   the exclusion as the recorded operator decision (2026-08-05) rather than as a
   convenience. The behavioral requirement is unambiguous in effect; only the
   AC's shorthand for the excluded region is imprecise. Not worth a spec rewrite.

2. **AC-960 imposes a self-reference constraint on its own evidence.** Because the
   AC forbids the superseded scope from appearing in *any* enumerated tracked file,
   the file that asserts that absence must not spell the superseded scope as a
   literal. This is satisfiable, and the technical design already carries the
   consequence explicitly ("the guard file must not itself contain the forbidden
   literal — build it as `['@gendev', 'labs'].join('')`"). Recorded here so it is
   not rediscovered as a spurious failure during the build.

3. **A pre-existing narrower test plan was already corrected upstream of this
   report.** The intent ticket body describes a guard scanning three source roots;
   AC-960 requires a tree-wide scan. The technical design identified this as a gap
   and adopted the tree-wide form, noting the tracked `index.html` would otherwise
   survive all four UATs untouched. The AC and the design now agree; the intent
   body's narrower phrasing is the stale one. No action needed at the spec layer.

### Cross-intent recommendations (informational — NOT counted toward pass/fail)

Seven **active capabilities hold zero stories**: CAP-64 (`capability-36dd68c5`),
CAP-65 (`capability-18a822ac`), CAP-66 (`capability-ac7ca849`),
CAP-67 (`capability-6e088083`), CAP-69 (`capability-938f26ec`),
CAP-72 (`capability-ce902be4`), CAP-73 (`capability-8108afab`).

These appear to be pre-existing remnants of an earlier consolidation into CAP-63,
CAP-70 and CAP-71 — every story that would have populated them now sits in a
successor capability. Step 4's invariant ("no capability is empty unless explicitly
deprecated") does not hold for them.

This is **out of scope for bug-5cabb340**, which touches only CAP-85 and cannot
address it. Per Step 4b these findings are recorded as recommendations and do not
affect this report's status. Recommended action for a future maintenance pass:
mark the seven as `superseded` (as CAP-68 `capability-bd0b722e` already is), or
repopulate them if the consolidation was unintended. Note that CAP-66 is
referenced as a live boundary in this intent's technical design (it owns the
declared-runtime-dependency preflight, which the design deliberately does not
extend), so it should be verified rather than deprecated by reflex.

## 5. Next Steps

1. **Proceed to sprint planning / task decomposition.** The plan's pass-through
   decomposition (1 story → 1 task, RED then GREEN) is sound: all six edited
   surfaces are coupled through a single constant, so there is nothing to
   parallelize and no dependency ordering to establish.
2. **Honour the Phase-0 environment precondition before reading any UAT-1 failure
   as a code defect.** The technical design verifies the shared artifact store is
   not resolvable from this branch worktree (`branch-BUG-32`), and prescribes
   installing at the worktree parent so every worktree resolves it by ordinary
   upward lookup. Three of the four UATs transitively require it. A failure there
   is an environment failure, not a rename defect — and the story body already
   says a failure to resolve should be read as such.
3. **No AC edits are required.** Do not enter the fix loop for this intent.
4. **File the empty-capability cleanup against a maintenance intent**, not against
   bug-5cabb340.
