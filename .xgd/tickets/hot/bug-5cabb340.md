---
uid: bug-5cabb340
id: BUG-32
type: bug
title: 'Rebranding gap: WEBUI_SCOPE still resolves @gendevlabs — components vanish
  silently after the framework rename'
created_by: xgd
created_at: '2026-08-05T22:28:10.455514+00:00'
updated_at: '2026-08-07T16:52:04.827937+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  story_points: 1
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-05T22:28:50.711957+00:00'
  commits:
  - working_sha: e77b933635f00ba8470bab1e9c50056be67f832f
    reconcile_sha: null
    main_sha: null
  version: 0.1.25
---

## Intent

The gendevlabs brand is being shelved. lagrange-framework BUG-7 renames its npm
scope `@gendevlabs/*` → `@lagrangefoundry/*`. This repo resolves those components
by bare specifier out of the shared artifact store (REQ-115 Deliverable 0,
DOC-8 §9.5), so it must move **in lockstep**.

This is a rebranding gap, not a defect in behaviour.

## The failure mode is a silent green

`tests/support/webui-installed.ts` computes `WEBUI_INSTALLED` by calling
`webuiPackageDir()` and catching the failure — absent components make suites
**skip**, not fail. That is correct behaviour for a genuinely-missing artifact
store, but it means a one-sided rename looks exactly like "not installed yet":
`require.resolve('@gendevlabs/webui-shell')` throws, `WEBUI_INSTALLED` goes
false, and `req115-builder-composition` / `req115-builder-shell` skip green while
the builder chrome silently ships an import map nothing can resolve.

So this ticket cannot be verified by "tests still pass". It has to assert the
components actually resolve.

## Surface

- `tools/generate/src/cli/webui.ts` — `export const WEBUI_SCOPE = '@gendevlabs'`,
  plus the module docstring describing `@gendevlabs/webui-*`.
- `tools/generate/src/cli/builder.ts` — `chromeHtml()` builds import-map keys
  with a **hardcoded** `` `@gendevlabs/${name}` `` in two places (lines ~67 and
  ~69) rather than using `WEBUI_SCOPE`. Route both through `WEBUI_SCOPE` while
  renaming, so the scope has exactly one definition and the next rename is a
  one-line change.
- `tests/req115-builder-shell.test.ts` — asserts import-map keys
  `` `@gendevlabs/${name}` `` (lines ~110, ~112).
- `tests/req115-builder-composition.test.ts` — docstring reference.
- `tests/support/webui-installed.ts` — docstring, and `WEBUI_SKIP_REASON` names
  the upstream `bin/install` invocation.

Not in scope: `.xgd/quality.yaml`'s `plugin: ai.gendevlabs.javascript_vitest_open`.
The `ai.gendevlabs.*` quality-plugin entry-point namespace is staying as-is —
operator decision, 2026-08-05. Leave that line alone.

## Sequencing

1. lagrange-framework BUG-7 lands the scope rename.
2. Operator re-runs `bin/install --lang js --component all` in lagrange-framework
   to repopulate the shared artifact store under the new scope.
3. This ticket.

Doing this before step 2 turns every webui suite into a skip.

## Test plan

- `test_UAT_FC_BUG-<id>_*`: assert `WEBUI_INSTALLED === true` and that
  `webuiPackageDir()` resolves for every entry in `WEBUI_PACKAGES` — a positive
  assertion, because the negative is indistinguishable from a missing store.
  This test should FAIL (not skip) if resolution breaks.
- `test_UAT_FC_BUG-<id>_*`: every `chromeHtml()` import-map key is under
  `@lagrangefoundry`, and no key is under `@gendevlabs`.
- `test_UAT_FC_BUG-<id>_*`: `WEBUI_SCOPE` is the only place the scope string is
  written in `tools/generate/src/` (guards the builder.ts de-duplication).
- Existing `req115-*` suites pass — and are confirmed to have RUN, not skipped.