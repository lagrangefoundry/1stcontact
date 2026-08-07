---
uid: report-eeee62e1
id: REPORT-1648
type: report
title: 'Report: intent_completeness for bug-5cabb340'
created_by: xgd
created_at: '2026-08-07T23:03:16.318866+00:00'
updated_at: '2026-08-07T23:03:16.318866+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: intent_completeness
  subject_uid: bug-5cabb340
  architecture_required: false
  intent_type: bug_fix
  has_technical_direction: true
  rationale: Single cross-cutting string constant (WEBUI_SCOPE) is renamed and consolidated
    to one definition, with three unavoidable literal copies in browser sources that
    cannot import it. No new components, no external system integration (the shared
    artifact store is an existing build-time resolution route, unchanged), no persistence,
    no concurrency, no extensibility surface. The component graph (webui.ts -> builder.ts
    -> chrome import map -> browser sources) already exists and is not restructured.
    Architecture design would add nothing beyond what the intent already specifies.
---

# Intent Completeness Report: bug-5cabb340

**Status**: PASS
**Architecture Required**: false
**Specification Type**: bug_fix
**Has Technical Direction**: true

## Summary

BUG-32 is a rebranding gap, not a behavioural defect: `lagrange-framework` BUG-7
renamed its npm scope `@gendevlabs/*` -> `@lagrangefoundry/*`, and this repo
resolves those components by bare specifier out of the shared artifact store, so
it must move in lockstep. The intent identifies the problem, explains the root
cause of why the breakage is *silent* (skip-not-fail resolution guard), lists
every surface to change with concrete before/after values, and specifies four
positive unconditional UATs that make a broken scope fail loudly. All four
bug_fix pass-bar criteria are met at Specified depth.

## Technical Direction Identified

| Kind | Direction | Source phrasing |
|------|-----------|-----------------|
| Constraint | The rename must happen **in lockstep** with upstream BUG-7; the shared store must be repopulated under the new scope *before* any edit (sequencing steps 1-2). | "it must move **in lockstep**"; "Sequencing steps 1-2 were confirmed done before any edit" |
| Constraint | `WEBUI_SCOPE` must have exactly **one** definition; `builder.ts`'s two hardcoded literals must route through it. | "The scope now has exactly one definition and the next rename is a one-line change." |
| Constraint | `webui.ts` must **not** write the legacy scope literally anywhere (including the docstring), so a tree-wide guard can be exact. | "deliberately no longer writes the legacy scope literally so a tree-wide guard can be exact" |
| Constraint | The browser sources (`apps/control-app/src/builder/app.js`, `editor.js`) are renamed **in place** — they are served as-is and resolved by the import map, so they cannot import the constant. | "These are served as-is and resolved by the import map, so they cannot import the constant" |
| Constraint (exclusion) | `.xgd/quality.yaml`'s `plugin: ai.gendevlabs.javascript_vitest_open` entry-point namespace **stays**. Operator decision, 2026-08-05. That file is main-only (REQ-709) and absent from this worktree. | "Left alone as decided" |
| Constraint | Verification may **not** rest on "tests still pass" — the UATs must be positive and unconditional. | "So this ticket cannot be verified by 'tests still pass'. It has to assert the components actually resolve." |
| Constraint | No source is vendored into the repo; a gap is closed upstream, never worked around (pre-existing, restated by UAT 1). | "nothing was vendored into the repo" |

No constraint conflicts with a behavioural goal. The one-definition rule and the
in-place browser rename are complementary, and the intent explicitly reconciles
them (UAT 4 permits the browser sources as the sole exception, and UAT 3 pins
them to the import map so the exception cannot drift).

## Checklist Evaluation

Mode is **bug_fix** — the behavioural checklist (sections 1-5, 7) is **N/A**:
externally observable behaviour is unchanged from the original REQ-115 intent,
which defines it. Evaluated against the bug_fix pass bar plus section 6
(Testability), which applies to every mode.

| Criterion | Depth | Status | Evidence |
|-----------|-------|--------|----------|
| Problem clearly identified | Specified | PASS | Named surface-by-surface: `WEBUI_SCOPE` still `'@gendevlabs'`; `builder.ts` `chromeHtml()` hardcodes the scope in two places; three browser bare specifiers. Verified against the tree: `tools/generate/src/cli/webui.ts:33`, `builder.ts:70,72`, `app.js:1-2`, `editor.js:1`. |
| Root cause explained | Specified | PASS | The silent-green mechanism is traced end to end: `tests/support/webui-installed.ts` computes `WEBUI_INSTALLED` by calling `webuiPackageDir()` and catching failure -> `require.resolve('@gendevlabs/webui-shell')` throws -> `WEBUI_INSTALLED` false -> `req115-builder-composition` / `req115-builder-shell` skip green while the chrome ships an unresolvable import map. Explains *why* the correct-for-absent-store behaviour is wrong for a one-sided rename. |
| Fix approach provided | Specified | PASS | Every file enumerated with the concrete change: `WEBUI_SCOPE = '@lagrangefoundry'`; both `builder.ts` literals routed through the imported constant; browser sources renamed in place; `index.html` chrome artifact updated; two test files switched from literals to `WEBUI_SCOPE`; five docstrings. Explicit non-change: `.xgd/quality.yaml`. |
| Verification criteria provided | Specified | PASS | Four named UATs with stated assertions, each mapped to a distinct failure mode — resolution + package-`name` identity (rules out a stale same-named package under the old scope) + no vendoring + `WEBUI_INSTALLED` true; import-map key coverage and legacy-scope absence; browser-specifier <-> import-map-key agreement (the runtime-only coupling); one-definition guard with an exact literal count. |
| Behaviour unchanged from original intent | Specified | PASS | Stated outright: "This is a rebranding gap, not a defect in behaviour." Original behaviour is defined by REQ-115 Deliverable 0 / DOC-8 §9.5, both referenced. |
| 6. Testability — specific assertions | Specified | PASS | Assertions are concrete and machine-checkable (set equality on import-map keys, package `name` field under scope, quoted-literal count in `webui.ts`), not "it should work". |
| 6. Testability — runtime execution required | Specified | PASS | UAT 1 and UAT 3 cannot be satisfied by reading static config: UAT 1 performs real resolution through Node's upward lookup into the shared store; UAT 3 cross-checks two independently-authored surfaces (browser source vs generator output). |
| 6. Testability — per-branch / boundary coverage | Specified | PASS | Not threshold-shaped work, so boundary enumeration is not applicable. Per-surface coverage is complete: each of the four changed surface classes (constant, generator, browser source, guard) has a dedicated positive UAT, and the skip-path is closed by making all four unconditional. |

## Complexity Assessment

| Factor | Present? | Note |
|--------|----------|------|
| >3 distinct components communicating | No | Four files touched, but the communication graph (`webui.ts` -> `builder.ts` -> import map -> browser sources) is pre-existing and unaltered; only a string value moves through it. |
| External system integration | No | The shared artifact store is an existing operator-populated build-time resolution route (upstream `bin/install`), consumed unchanged. No API, DB, or third-party call is added. |
| Stateful persistence beyond simple file I/O | No | None. |
| Real-time / concurrent processing | No | None. |
| Plugin / extensibility architecture | No | The `ai.gendevlabs.*` quality-plugin namespace is explicitly out of scope and untouched. |
| Cross-cutting concerns (auth/logging/caching) | No | The scope constant is cross-file, but is not a cross-cutting *concern* in the architectural sense; the intent's own one-definition rule is the design response and is already specified. |

**Rationale**: no factor triggers. The fix is a one-constant rename plus
consolidation of two hardcoded duplicates, with a declared, bounded exception for
three browser literals that cannot import the constant. `architecture_required:
false`.

## Internal Consistency (title/summary vs body)

| Promise in title | Substantiating mechanism in body | Status |
|------------------|----------------------------------|--------|
| "WEBUI_SCOPE still resolves @gendevlabs" | `tools/generate/src/cli/webui.ts` `WEBUI_SCOPE = '@lagrangefoundry'`, plus the two `builder.ts` literals routed through it. Confirmed still `'@gendevlabs'` at `webui.ts:33` in this worktree. | Substantiated |
| "components vanish silently" | The skip-not-fail chain through `webui-installed.ts` is traced explicitly, and the remedy is structural: all four UATs are positive and unconditional so the silent path cannot recur. | Substantiated |
| "after the framework rename" | Upstream `lagrange-framework` BUG-7 named; lockstep sequencing (store repopulated, package `name` fields under the new scope) declared as a precondition confirmed before any edit. | Substantiated |

No promise in the title or summary lacks a corresponding mechanism in the body.

## Red Flags Found

No blocking red flags. No "TBD"/"TODO"/"determined during implementation", no
generic "handle appropriately", no constraint/goal conflict. Two items are
recorded for the implementing session — neither is a specification gap:

1. **Declared precondition is not satisfied in this worktree (actionable).** UAT 1
   asserts unconditionally that every component resolves and `WEBUI_INSTALLED` is
   true. Neither `@lagrangefoundry` nor `@gendevlabs` is present in any
   `node_modules` reachable by upward resolution from this branch worktree
   (`node_modules`, `../node_modules`, `../../node_modules` all checked — absent).
   This is consistent with `webui.ts`'s own documented design (the dependency is
   implicit; a fresh clone gets nothing until the operator runs upstream
   `bin/install`), and the intent does name the repopulated store as a confirmed
   prerequisite. But because the new UATs are deliberately unconditional, they
   will fail in this worktree until the store is installed here. The implementing
   session must establish the store before treating a UAT 1 failure as a code
   defect.
2. **Pre-existing unrelated failures are pre-declared.** Six tests
   (`reconciliation-copy-edit-gesture-modal` x5, `req115-builder-composition`
   `open_in_new_tab_matches_the_iframe_exactly` x1) are stated to fail once the
   suites RUN rather than skip, confirmed pre-existing by stashing and re-running
   against the old scope. Recorded so they are not misattributed to this change,
   and not in scope to fix here. Note this means the change surfaces previously
   masked failures — expected and intended, but the quality gate should be told.

## Overall Status

**PASS** — ready for technical design.

The intent meets the bug_fix bar on all four criteria at Specified depth: the
problem is located to exact files, the root cause explains the silent-skip
mechanism rather than just naming it, the fix approach gives concrete before/after
values for every surface, and the verification criteria are four positive
unconditional UATs each closing a distinct failure mode — including the
runtime-only browser-specifier coupling that the original scope list missed.
Technical direction is present and internally consistent. Architecture design is
not required.
