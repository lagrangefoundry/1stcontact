---
uid: report-62f5dd5e
id: REPORT-1650
type: report
title: Test Architecture Summary
created_by: xgd
created_at: '2026-08-07T23:08:02.979217+00:00'
updated_at: '2026-08-07T23:08:02.979217+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: test_architecture_summary
---

# Test Architecture Summary

## Section 1: Test Architecture Overview

**Runner / boundary.** Vitest (`vitest.config.mts`), suites under `tests/`, named
`test_UAT_FC_<TICKET>_<description>`. UATs drive real public entry points from
`tools/generate/src/cli` (the CLI barrel) rather than internal helpers.

**Skip-vs-fail policy for out-of-band artifacts (BUG-32).** Suites that mount the
shared `@lagrangefoundry/webui-*` components gate on `WEBUI_INSTALLED`
(`tests/support/webui-installed.ts`) and *skip* when the store is absent — correct
for a genuinely-uninstalled machine. That guard is **presence-only** and cannot
tell "not installed" from "installed under a different scope", so any suite whose
subject is *which scope/identity* the components carry MUST be unconditional.
Rule: **conditional for mount-behaviour evidence, unconditional for
identity/wiring evidence.** A conditional identity assertion is a silent green.

**Environment precondition, not a mock.** The webui store is an operator-populated
flat `node_modules` reached by Node's ordinary upward resolution. It is never
stubbed, aliased, or vendored — faking it would fork the upstream consumption
route (DOC-8 §9.5). Tests that need it declare it as a precondition satisfied by
`lagrange-framework`'s `bin/install --env <dir>`. For XGD branch worktrees the
store must be installed at the **worktree parent**
(`~/.xgd/worktrees/<repo>.git/node_modules`) so every worktree resolves it.

**Three evidence levels for cross-surface string/wiring invariants:**
1. *Resolution* — call the real resolver (`webuiPackageDir`) and assert the
   resolved package's own `package.json.name`, not just that resolution succeeded.
   Identity, not presence: a same-named leftover under the old scope must fail.
2. *Generated-artifact* — assert on the generator's output (`chromeHtml()`), so
   the assertion tracks the producer rather than a committed snapshot.
3. *Tree guard* — scan the **git-tracked** tree for the forbidden literal, with a
   small declared exclusion list. Catches surfaces nobody remembered, including
   committed artifacts and browser sources that cannot import a constant.

**Cross-surface coupling that no single surface tests.** Where two independently
authored surfaces must agree (browser bare specifier ↔ generated import-map key),
a UAT must cross-check them directly. Such coupling fails only at runtime in a
browser — no build, type check, or unit test observes it.

**Self-exclusion for tree guards.** A tree-scanning guard must not itself write
the literal it forbids; construct it as a split-and-join so the guard file is not
its own violation.

## Section 2: Test Infrastructure Registry
| Story UID | Title | Summary | Code Location | Status |
|-----------|-------|---------|---------------|--------|
| story-e674c60a | webui install presence guard | `WEBUI_INSTALLED` / `WEBUI_SKIP_REASON` — presence-only gate letting mount suites skip when the artifact store is absent | `tests/support/webui-installed.ts` | Active |
