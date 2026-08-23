---
uid: bug-5cabb340
id: BUG-32
type: bug
title: 'Rebranding gap: WEBUI_SCOPE still resolves @gendevlabs — components vanish
  silently after the framework rename'
created_by: xgd
created_at: '2026-08-05T22:28:10.455514+00:00'
updated_at: '2026-08-08T02:07:49.061505+00:00'
completed_at: '2026-08-08T02:07:49.061505+00:00'
last_field_updated: status
status: merged
fields:
  priority: medium
  story_points: 2
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-07T22:58:43.858813+00:00'
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 125f1dccf1d687ee30cea8ee6db751175296bc31
  version: 0.1.25
  pid: 21357
  merged_at_commit: 125f1dccf1d687ee30cea8ee6db751175296bc31
  chat_comment: comment-bc71b831
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

## What changed

Sequencing steps 1–2 were confirmed done before any edit: the shared store at
`../node_modules/@lagrangefoundry/` was repopulated (2026-08-07), and each
resolved package's own `package.json` `name` is under the new scope.

- `tools/generate/src/cli/webui.ts` — `WEBUI_SCOPE = '@lagrangefoundry'`. The
  module docstring is rewritten to state the one-definition rule and *why* (the
  rename is silent), and deliberately no longer writes the legacy scope literally
  so a tree-wide guard can be exact.
- `tools/generate/src/cli/builder.ts` — `chromeHtml()` hardcoded
  `` `@gendevlabs/${name}` `` in two places; both now route through
  `WEBUI_SCOPE`, imported from `./webui`. The scope now has exactly one
  definition and the next rename is a one-line change.
- `apps/control-app/src/builder/app.js`, `editor.js` — the builder's browser
  source imports `webui-shell` / `webui-split` / `webui-fields` by bare
  specifier. These are served as-is and resolved by the import map, so they
  cannot import the constant and are renamed in place. This surface was **not**
  in the original scope list and is the one that fails at runtime only — a
  specifier the map does not key throws in the browser and nowhere else.
- `index.html` (a tracked chrome artifact at the repo root) — **deleted**, not
  updated. A committed copy of the generator's output is itself a second
  definition site: renaming the scope inside it would leave exactly the drift
  this ticket exists to close, one rename away. Nothing read the file, and the
  origin serves `chromeHtml()` at `/`.
- `tests/req115-builder-shell.test.ts`,
  `tests/reconciliation-builder-workspace-origin.test.ts` — assertions now use
  `WEBUI_SCOPE` rather than restating the literal.
- Docstrings in `tests/req115-builder-composition.test.ts`,
  `reconciliation-builder-workspace-chrome.test.ts`,
  `reconciliation-copy-edit-gesture.test.ts`,
  `reconciliation-copy-edit-gesture-modal.test.ts`,
  `tests/support/webui-installed.ts`.

Left alone as decided: `.xgd/quality.yaml`'s
`plugin: ai.gendevlabs.javascript_vitest_open`. The `ai.gendevlabs.*`
quality-plugin entry-point namespace stays (operator decision, 2026-08-05).
That file is now main-only (REQ-709) and is not present in this worktree.

## Test plan / evidence

`tests/bug32-webui-scope-rebrand.test.ts` — four UATs, all **positive and
unconditional**, so a broken scope fails loudly instead of skipping green:

- `test_UAT_FC_BUG-32_every_webui_component_actually_resolves` — every entry in
  `WEBUI_PACKAGES` resolves, the resolved package's own `name` is under
  `WEBUI_SCOPE` (so a stale same-named component under the old scope cannot
  satisfy it), nothing was vendored into the repo, and `WEBUI_INSTALLED` is true.
- `test_UAT_FC_BUG-32_chrome_import_map_keys_are_all_under_the_current_scope` —
  every `chromeHtml()` key is under `WEBUI_SCOPE`, every package has a key, and
  no key names the legacy scope.
- `test_UAT_FC_BUG-32_builder_browser_imports_match_the_import_map` — every bare
  `@…/webui-*` specifier in `apps/control-app/src/builder/*.js` has a matching
  import-map key. Covers the runtime-only coupling above.
- `test_UAT_FC_BUG-32_webui_scope_is_defined_in_exactly_one_place` — no source
  under `tools/generate/src`, `apps/control-app/src` or `packages` names the
  legacy scope; only `webui.ts` (plus the browser sources, which cannot import
  it) writes the scope at all; `webui.ts` holds exactly one quoted scope literal.

Run: 4/4 pass. `reconciliation-1c-install-preflight`, `naming`,
`reconciliation-copy-edit-write-path`, `reconciliation-copy-edit-image-selection`
pass (35/35).

**The req115 / builder suites now RUN rather than skip.** Six tests fail in that
scope — `reconciliation-copy-edit-gesture-modal` (5) and
`req115-builder-composition` (1, `open_in_new_tab_matches_the_iframe_exactly`).
These are **pre-existing and unrelated**: confirmed by stashing this change and
re-running against the old scope, which produces the identical six failures. They
are not introduced here and are not fixed here.