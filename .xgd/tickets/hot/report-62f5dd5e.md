---
uid: report-62f5dd5e
id: REPORT-1650
type: report
title: Test Architecture Summary
created_by: xgd
created_at: '2026-08-07T23:08:02.979217+00:00'
updated_at: '2026-08-08T00:28:54.594015+00:00'
completed_at: null
last_field_updated: body
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
flat `node_modules`, filled out of band by `lagrange-framework`'s
`bin/install --env <dir>`. It is never stubbed, faked or vendored — a stand-in
would fork the upstream consumption route (DOC-8 §9.5), which is most of the risk
these suites exist to cover. Tests declare it as a precondition, and a failure to
resolve it is an environment failure to be read as such, not a code defect.

**Vitest reaches that store through aliases derived from the single resolution
point — a route correction, not a stand-in.** Node's ordinary upward resolution
finds the store from the main checkout but not from a linked `git worktree`
parked elsewhere, so from any XGD branch worktree every component looked absent —
indistinguishable from "the install was never run", which is a skip by design.
Nine of story-e674c60a's criteria (AC-959, 967–971, 973, 974, 976) therefore lost
their evidence in every worktree *while reporting green*. The fix anchors
resolution at the main checkout (`webui.ts::mainCheckout`, via `.git`'s commondir)
and has `vitest.config.mts` derive `resolve.alias` from that same resolver, since
Vite resolves the builder's bare specifiers at transform time and must get the
identical answer. Three properties keep this from becoming the stand-in the rule
above forbids:

1. Every alias target comes from `webuiPackageDir` / `webuiExports` — the same
   resolution point production uses — so there is no second guess at where the
   store lives and no second copy to diverge from.
2. Every alias key is composed from `WEBUI_SCOPE`, so a one-sided rename still
   fails loudly in *both* directions: scope moved but browser source not → no
   alias matches and the transform fails; browser source moved but scope not →
   `webuiPackageDir` throws, `WEBUI_INSTALLED` goes false, and the unconditional
   identity UATs fail.
3. When the install has not been run there is nothing to alias, and the mount
   suites report their skip exactly as before.

The alternative this document previously prescribed — install the store at the
worktree parent (`~/.xgd/worktrees/<repo>.git/node_modules`) — was **not** taken.
It makes every mount suite's validity depend on an operator having performed an
undocumented install in a directory outside any checkout, and its failure mode is
the silent green above rather than a loud one. Recorded here because code and
this document disagreeing is worse than either choice: the next reader trusts the
document.

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

**Invariants claimed over "every response/route/tree" are probed structurally,
not by representatives.** Where a criterion says *there is no exempt case*, a
hand-maintained list of sample routes proves only that the samples hold — and a
class nobody listed ships broken while the criterion reports green (AC-977's JSON
responses did exactly this). Such a UAT reads the declaration out of the
production source (the origin's own routing table) and checks coverage in **both**
directions: every declared case must have a probe, and every probe must match a
declared case, so a route added later fails the test until someone states what it
returns, and a broken extraction cannot pass over an empty set.

## Section 2: Test Infrastructure Registry
| Story UID | Title | Summary | Code Location | Status |
|-----------|-------|---------|---------------|--------|
| story-e674c60a | webui install presence guard | `WEBUI_INSTALLED` / `WEBUI_SKIP_REASON` — presence-only gate letting mount suites skip when the artifact store is absent | `tests/support/webui-installed.ts` | Active |
| story-e674c60a | webui transform-time aliases | `webuiAliases()` — `resolve.alias` entries derived from `webuiPackageDir`/`webuiExports` and keyed on `WEBUI_SCOPE`, so Vite resolves the real out-of-repo store from a linked worktree. A route correction, never a stand-in; see Section 1 | `vitest.config.mts` | Active |
