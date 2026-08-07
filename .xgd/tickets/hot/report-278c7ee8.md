---
uid: report-278c7ee8
id: REPORT-1651
type: report
title: 'Technical Design: bug-5cabb340'
created_by: xgd
created_at: '2026-08-07T23:10:45.774511+00:00'
updated_at: '2026-08-07T23:10:45.774511+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: technical_design
  subject_uid: bug-5cabb340
---

# Technical Design: BUG-32 — WEBUI_SCOPE rebrand to `@lagrangefoundry`

## Summary

Move this repo's webui npm scope `@gendevlabs` → `@lagrangefoundry` in lockstep
with `lagrange-framework` BUG-7, and collapse the scope to **exactly one
definition** (`WEBUI_SCOPE` in `tools/generate/src/cli/webui.ts`). No new module,
class, or resolution path is introduced: every surface delegates to the existing
`webui.ts` / `builder.ts` component-consumption machinery that CAP-85 already
owns. The design's real content is **evidence**: because the existing
`WEBUI_INSTALLED` guard is presence-only, a one-sided rename is indistinguishable
from "not installed yet", so the UATs must be positive and unconditional — which
in turn makes the artifact store a hard, Phase-0 environment precondition of this
branch worktree rather than an optional nicety.

## Architecture Reviewed

**No `architecture_checklist` report exists in this project** — checked
`xgd ticket list --type report` and `--type doc`; none found. Reviewed instead
against the authoritative documents this intent cites.

| Source | Constraint that applies | Alignment |
|--------|------------------------|-----------|
| DOC-8 §9.5 / REQ-115 Deliverable 0 | Components arrive via a **shared artifact store** populated by upstream `bin/install`; resolution is Node's ordinary upward lookup; **no publishing, no workspace link, no submodule**. | **Using existing.** Unchanged — only the scope string moves. |
| `webui.ts` module contract | **No source is copied into this repo**; nothing patches or wraps a component; a gap is closed upstream. | **Using existing.** Re-asserted by UAT-1 (`dir` must be outside the repo). |
| CAP-85 / AC-960 | "Every name the workspace shows has exactly one definition site, so renaming it is a one-line change and no second copy can drift." | **Extended.** BUG-32 brings the npm scope — a name that had *three* definition sites — under the invariant AC-960 already states. This is why the ticket is an upgrade to an existing AC, not a new capability. |
| CAP-85 / AC-961, AC-962, AC-963 | Components served byte-identical from an installed copy outside the repo; a missing component names the install command; entry points are the component's own declared `exports`. | **Using existing.** `webuiPackageDir` / `webuiExports` / `MissingWebuiComponentError` are untouched apart from the scope value flowing through them. |
| DOC-2 (Security Policy) | Structured-only, typed sinks. | **N/A.** No instance data, no render path, no new sink. This is build-time module resolution. |
| CLAUDE.md — no legacy modes | No fallback path, no dual-scope auto-detection. | **Complied.** The old scope is deleted outright; there is no "try new, fall back to old" resolution. |

**Conflict check.** One tension, resolved by the intent itself: the one-definition
rule (AC-960) versus the three browser bare specifiers in
`apps/control-app/src/builder/*.js`, which are served as-is and therefore
*cannot* import a TypeScript constant. The intent resolves it correctly — the
browser sources are a **declared, bounded exception**, and UAT-3 pins them to the
generated import map so the exception cannot silently drift. No other conflict.

**Proposing new (one item, justified below):** the tree guard scans the
**git-tracked tree** rather than the intent's three hardcoded source roots. See
*Gap found in the intent's test plan*.

## Existing Capability Overlap

| Capability | Overlap | Key Stories | Design Decision | Reuse Target |
|------------|---------|-------------|-----------------|--------------|
| **CAP-85** Builder Workspace: Chrome, Origin & Display Panel (`capability-a994b8f3`) — its scope explicitly includes *"Component consumption — how the shared UI components enter this product"* | **Core** | STORY-99 (`story-e674c60a`); AC-960 (one definition site), AC-961 (installed copy outside repo), AC-962 (missing-component diagnostic), AC-963 (component's own declared entry point) | **EXTEND** — modify in place; no parallel implementation | `tools/generate/src/cli/webui.ts` → `WEBUI_SCOPE`, `WEBUI_PACKAGES`, `webuiPackageDir()`, `webuiExports()`, `MissingWebuiComponentError`; `tools/generate/src/cli/builder.ts` → `chromeHtml()`. Both already re-exported from the barrel `tools/generate/src/cli/index.ts:83-92`. The implementer's test file must `import { chromeHtml, webuiPackageDir, WEBUI_PACKAGES, WEBUI_SCOPE } from '../tools/generate/src/cli'`, and `builder.ts` must `import { WEBUI_SCOPE } from './webui'`. |
| **CAP-66** 1c CLI Argument Parsing & Output Hygiene | **Partial** — owns `assertInstall`/`checkInstall`, the *declared-runtime-dependency* preflight (AC-1013…AC-1017, `tests/reconciliation-1c-install-preflight.test.ts`) | story-e15a19ef | **N/A — do not extend** | That preflight gates on packages declared in `package.json` + lockfile drift. The webui store is *deliberately implicit* (nothing in `package.json` records it — DOC-8 §9.5 names this as the accepted cost), so it has no lockfile entry and cannot be expressed in that mechanism without changing the consumption route. `MissingWebuiComponentError` is already the analogous diagnostic for this dependency class and is reused unchanged. |
| CAP-63/64/65/67/68/69/70/71/72/73, CAP-80…CAP-88 | **None** — capture/diff fidelity, L1 substrate, behavior modules, copy-edit, asset store, deploy | — | N/A | — |

No new capability is created. This is an **upgrade** to CAP-85.

## Technical Direction from Intent

### Constraints (mandatory — adopted as design decisions, not re-decided)

| # | Constraint | Design response |
|---|-----------|-----------------|
| C1 | Rename must move **in lockstep** with upstream BUG-7; the store must be repopulated under the new scope **before** any edit (sequencing steps 1–2). | Phase 0 below. **Verified**: `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/` holds all 11 packages, each `package.json.name` under the new scope (checked 2026-08-07). Upstream is done. |
| C2 | `WEBUI_SCOPE` must have **exactly one** definition; `builder.ts`'s two hardcoded literals route through it. | `builder.ts:70,72` import `WEBUI_SCOPE` from `./webui`. Enforced by UAT-4. |
| C3 | `webui.ts` must **not** write the legacy scope literally anywhere, including its docstring, so a tree-wide guard can be exact. | Docstring rewritten to reference `{@link WEBUI_SCOPE}`. UAT-4 asserts `webui.ts` holds exactly one quoted scope literal. |
| C4 | Browser sources (`app.js`, `editor.js`) are renamed **in place** — served as-is, resolved by the import map, cannot import the constant. | Declared bounded exception in UAT-4; pinned to the map by UAT-3. |
| C5 | `.xgd/quality.yaml`'s `plugin: ai.gendevlabs.javascript_vitest_open` **stays** (operator decision 2026-08-05; file is main-only per REQ-709, absent from this worktree). | `.xgd/` is on the tree-guard exclusion list, and that exclusion is documented in the guard as *this* decision — not as a convenience. |
| C6 | Verification may **not** rest on "tests still pass". UATs are positive and unconditional. | The whole Test Architecture section. Drives Phase 0 from "nice to have" to "blocking". |
| C7 | Nothing is vendored into the repo. | UAT-1 asserts each resolved `dir` is outside `REPO`. |

### Suggestions (advisory)

| Suggestion | Verdict | Rationale |
|-----------|---------|-----------|
| Intent's four-UAT test plan, with the stated assertions | **Adopted**, with one extension | The four map cleanly onto four distinct failure modes. Extension: the tree guard scans git-tracked files (below). |
| Intent lists `index.html` (tracked chrome artifact) among the files to change | **Adopted, and promoted to covered evidence** | The intent changes it but no listed UAT asserts it. See below. |
| Six pre-existing failures are out of scope | **Adopted** | Not fixed here. Recorded for the quality gate; see Anti-pattern Mitigations. |

### Gap found in the intent's test plan (the one place this design adds to it)

The intent's UAT-4 scans exactly three roots — `tools/generate/src`,
`apps/control-app/src`, `packages`. The tracked chrome artifact **`index.html` at
the repo root is under none of them**, and UAT-2 asserts on `chromeHtml()`'s
*output*, not on that committed file. Verified in this worktree:
`index.html:11` carries `@gendevlabs/webui-shell|split|fields` in its import map,
and would survive all four UATs untouched.

**Design decision:** UAT-4 scans the **git-tracked tree** (`git ls-files`) filtered
to text/source extensions, with a small, *declared* exclusion list — `.xgd/**`
(ticket store + the C5 operator decision) and lockfiles. This closes `index.html`,
closes stale docstrings under `tests/`, and generalises: the next forgotten
surface cannot slip through a hardcoded root list. The literal-only-in-one-place
sub-assertion is unchanged.

Consequence to honour: the guard file must not itself contain the forbidden
literal — build it as `['@gendev', 'labs'].join('')`.

## Test Architecture

### Test Infrastructure

**Reuse first — nothing new is built.** Registered in the TAC/TAS:
`tests/support/webui-installed.ts` (`WEBUI_INSTALLED`, `WEBUI_SKIP_REASON`) stays
exactly as it is. Its presence-only semantics are **correct** for the mount
suites (`req115-builder-composition`, `req115-builder-shell`,
`reconciliation-builder-workspace-chrome`, `reconciliation-copy-edit-gesture*`)
and are **not** changed by this ticket. BUG-32's own suite deliberately does not
use it as a gate — it *asserts* `WEBUI_INSTALLED === true` as an outcome.

One new file: `tests/bug32-webui-scope-rebrand.test.ts`. Helpers it needs
(`sourceFiles`-style tracked-file enumeration, `importMapOf` import-map
extraction) are ~10 lines each and local to the suite; promoting them to
`tests/support/` is not justified until a second suite needs them.

**Phase-0 environment precondition (blocking, and the largest risk in this
ticket).** Three of the four UATs (1, 2, 3) transitively call `webuiPackageDir()`
— `chromeHtml()` calls `webuiExports()` calls `webuiPackageDir()` — so they need
the store resolvable from the test process. **It is not resolvable here.**
Verified: `node_modules`, `../node_modules`, `../../node_modules`,
`../../../node_modules` relative to
`/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/branch-BUG-32`
contain neither scope. The store lives at `/Users/martin/lagrangefoundry/node_modules/`,
which is reachable from the real checkout (`1stcontact/../node_modules`) but
**not** from an XGD branch worktree — the worktrees live under a different root.

Resolution — install at the **worktree parent**, so every worktree of this repo
(`branch-BUG-32`, `main`, `regression-*`, and all future ones) resolves it by
ordinary upward lookup, with no repo change and nothing vendored:

```
cd ../lagrange-framework   # /Users/martin/lagrangefoundry/lagrange-framework
bin/install --lang js --component all \
  --env /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git
```

**Confirmed viable by `--dry-run`** (executed during this design): the path is
accepted by `_reject_repo_paths`, and all 11 packages resolve to
`…/git_github.com_lagrangefoundry_1stcontact.git/node_modules/@lagrangefoundry/*`.
Rejected alternatives: `--env <worktree>` (disposable, must be redone per
worktree, mixes packed tarballs into pnpm's tree); `NODE_PATH` / vitest
`resolve.alias` (forks the upstream consumption route the `webui.ts` docstring
explicitly forbids).

**Do not treat a UAT-1 failure as a code defect until Phase 0 is done.**

### Validation Strategy

| Feature Area | Test Level | Evidence | Acceptance |
|--------------|-----------|----------|------------|
| Component resolution & identity | UAT (integration, real resolver, real store) | `test_UAT_FC_BUG-32_every_webui_component_actually_resolves` — for **each** `WEBUI_PACKAGES` entry: `webuiPackageDir()` succeeds; the resolved `package.json.name === '${WEBUI_SCOPE}/${name}'` (identity, not presence — a same-named leftover under the old scope must fail); `dir` is outside `REPO` (C7); and `WEBUI_INSTALLED === true`. Per-package so the message names *which* component. | Extends AC-961; unconditional |
| Generated chrome import map | UAT (integration, real generator) | `test_UAT_FC_BUG-32_chrome_import_map_keys_are_all_under_the_current_scope` — every key of `chromeHtml()`'s import map starts `${WEBUI_SCOPE}/`; every `WEBUI_PACKAGES` entry has a key; no key names the legacy scope; key set non-empty. | Extends AC-963; unconditional |
| Browser ↔ import-map coupling | UAT (integration, cross-surface) | `test_UAT_FC_BUG-32_builder_browser_imports_match_the_import_map` — every bare `@…/webui-*` specifier found in `apps/control-app/src/builder/*.js` is under `WEBUI_SCOPE` **and** has a matching key in `chromeHtml()`'s map; the specifier set is non-empty. | **New coverage** — the runtime-only failure the original scope list missed; unconditional |
| One-definition guard | UAT (static, tree-wide) | `test_UAT_FC_BUG-32_webui_scope_is_defined_in_exactly_one_place` — no git-tracked text file (minus `.xgd/**`, lockfiles) contains the legacy literal; only `webui.ts` and the declared browser-source exception write the scope at all; `webui.ts` contains exactly one quoted scope literal. | Extends AC-960; unconditional; **also the only cover for `index.html`** |

**Sufficiency argument.** The four failure modes are disjoint and jointly
exhaustive for a scope rename: *wrong value* (UAT-1), *wrong value in the
generator* (UAT-2), *wrong value in a surface the generator does not produce*
(UAT-3), *right value but a second copy left behind anywhere in the tree*
(UAT-4). Every one is a positive assertion, so an absent store fails loudly
instead of skipping green — which is the entire point of the ticket (C6).

### Test Boundaries

| Component | Owner | Test Strategy | External Boundary | Existing Infrastructure |
|-----------|-------|---------------|-------------------|-------------------------|
| `webui.ts` resolver | Ours | Real `require.resolve` against the real installed store — no injected resolver, no stub. The route *is* the thing under test. | The shared artifact store — **external but not mocked**; satisfied as a Phase-0 precondition (see above). Authenticity: the packages are real upstream `pnpm pack` output, not hand-crafted fixtures. | `webuiPackageDir`, `WEBUI_PACKAGES`, `MissingWebuiComponentError` |
| `builder.ts` `chromeHtml()` | Ours | Call the real generator; parse its emitted `<script type="importmap">`. Never assert against a committed snapshot. | None (pure function over resolved `exports` maps) | `chromeHtml` via the CLI barrel |
| Browser sources `app.js` / `editor.js` | Ours | Static read of the real files under `apps/control-app/src/builder`, cross-checked against the live generator output. | The browser — genuinely untestable here; the cross-check is the substitute, and that substitution is why UAT-3 exists at all. | none |
| Tracked tree (`index.html`, docstrings, tests) | Ours | `git ls-files` enumeration + literal scan, declared exclusions. | git — read-only, real repo, no temp clone needed. Independence: read-only, mutates nothing. | none |
| Mount suites (`req115-*`, `reconciliation-builder-*`) | Ours | **Unchanged.** They keep their `WEBUI_INSTALLED` skip gate — legitimate, because their subject is mount *behaviour*, not scope identity. | jsdom + the store | `tests/support/webui-installed.ts` |

### Anti-pattern check — testing gaps

- **Silent green (the ticket's own subject).** Mitigated structurally: all four
  UATs are positive and unconditional, so "store missing" and "scope wrong" both
  fail. Detection: if the implementer writes `describe.skipIf(!WEBUI_INSTALLED)`
  anywhere in the new suite, the ticket is not delivered.
- **Snapshot drift.** Asserting the committed `index.html` against itself would
  prove nothing. Mitigated: UAT-2 asserts the *generator*; the committed artifact
  is covered only by the tree guard (a literal-absence check), which is the right
  strength for a file nothing reads at runtime.
- **Mock hiding the integration.** Aliasing or stubbing the store would make all
  four UATs pass on a machine where the builder cannot actually run — the exact
  failure being fixed. Explicitly forbidden; the store is a precondition.
- **Self-referential guard.** A tree guard that writes its own forbidden literal
  fails on itself. Mitigated by the split-and-join construction.
- **Suites unmasking pre-existing failures.** Once the store resolves, the
  req115/builder suites RUN. Six known failures appear
  (`reconciliation-copy-edit-gesture-modal` ×5, `req115-builder-composition`
  `open_in_new_tab_matches_the_iframe_exactly` ×1), confirmed pre-existing by
  stash-and-rerun against the old scope. **Not in scope, not fixed here** — the
  quality gate must be told, or it will attribute them to this change.

## Implementation Architecture

### Component Boundaries

```
  tools/generate/src/cli/webui.ts
    WEBUI_SCOPE  ◄── THE single definition (one string literal in the file)
    WEBUI_PACKAGES, webuiPackageDir(), webuiExports(), MissingWebuiComponentError
          │
          │ import { WEBUI_SCOPE } from './webui'
          ▼
  tools/generate/src/cli/builder.ts
    chromeHtml()  ── emits <script type="importmap">{ "<scope>/<pkg>": "/webui/…" }
          │
          │ served at "/" by handleBuilderRequest (builder.ts:162)
          ▼
  apps/control-app/src/builder/{app.js, editor.js}
    bare specifiers  ── DECLARED EXCEPTION: served as-is, resolved by the import
                        map at runtime, cannot import a TS constant.
                        Renamed in place; pinned to the map by UAT-3.

  index.html (repo root)  ── tracked snapshot of chromeHtml() output; nothing
                             reads it at runtime. Updated for consistency;
                             covered by the tree guard only.
```

Responsibilities are unchanged. `webui.ts` owns *resolution and naming*;
`builder.ts` owns *chrome generation*; the browser sources own *mounting*. The
only structural change is removing `builder.ts`'s duplicate ownership of the
scope name.

### Interfaces & Contracts

| Interface | Contract | Why |
|-----------|----------|-----|
| `WEBUI_SCOPE: string` (`webui.ts`) | The **sole** definition of the npm scope. Exported from `./webui` and re-exported by the CLI barrel (`index.ts:86-92`) — both already exist; no export change needed. Value: `'@lagrangefoundry'`. | AC-960. Makes the next rename a one-line change. |
| `builder.ts` → `webui.ts` | `builder.ts` imports `WEBUI_SCOPE`; `chromeHtml()` composes keys as `` `${WEBUI_SCOPE}/${name}` `` and `` `${WEBUI_SCOPE}/${name}/${subpath}` `` at the two sites currently at lines 70 and 72. It already imports `WEBUI_PACKAGES, webuiExports, webuiPackageDir` from `./webui` (line 12) — extend that import. | Removes the duplicate definitions without adding a dependency edge. |
| Import map ↔ browser source | Every bare `@…/webui-*` specifier in `apps/control-app/src/builder/*.js` **must** appear as a key in `chromeHtml()`'s map. Enforced only by UAT-3. | The one contract with no compile-time or runtime-in-Node enforcement. |
| `webui.ts` literal budget | `webui.ts` matches `/'@[a-z]+'/g` exactly once. Docstring references `{@link WEBUI_SCOPE}` and never spells either scope. | C3 — makes the tree guard exact rather than heuristic. |

No API schema, endpoint, or data model changes. **No AAC created** — this intent
introduces no new API components; a renamed constant on already-exported symbols
is not an API asset.

### Build Order

**Phase 0 — Foundation (blocking, environment only, no code).**
Install the artifact store at the worktree parent (exact command above); confirm
`node -e "console.log(require.resolve('@lagrangefoundry/webui-shell'))"` from the
worktree resolves outside the repo. Without this, RED is unreadable: every
failure looks identical whether the code is right or wrong. **Nothing else can
be validated until this is done.**

**Phase 1 — RED (write the failing evidence first).**
Author `tests/bug32-webui-scope-rebrand.test.ts` with all four UATs against the
*unchanged* code. Expected RED: UAT-1 fails (resolves `@gendevlabs`, whose
`package.json.name` is `@gendevlabs/webui-shell` — the identity assertion is what
catches this, since the legacy directory *does* still exist in the store and mere
presence would pass); UAT-2/3 fail on scope prefix; UAT-4 fails on `webui.ts`,
`builder.ts`, both browser sources and `index.html`. A UAT that is green here is
mis-written.

**Phase 2 — GREEN (the rename; single sequential edit, no parallelism worth
taking — the surfaces are coupled through one constant).**
1. `webui.ts` — `WEBUI_SCOPE = '@lagrangefoundry'`; rewrite the docstring so it
   names neither scope literally (C3).
2. `builder.ts` — add `WEBUI_SCOPE` to the line-12 import; route lines 70 and 72
   through it (C2).
3. `apps/control-app/src/builder/app.js`, `editor.js` — rename the three bare
   specifiers in place (C4).
4. `index.html` — update the import-map keys and keep it consistent with
   `chromeHtml()`'s current output.
5. `tests/req115-builder-shell.test.ts:110,112`,
   `tests/reconciliation-builder-workspace-origin.test.ts:339` — replace the
   literal with `WEBUI_SCOPE` (imported from the CLI barrel).
6. Docstrings in `req115-builder-composition`,
   `reconciliation-builder-workspace-chrome`, `reconciliation-copy-edit-gesture`,
   `reconciliation-copy-edit-gesture-modal`, `tests/support/webui-installed.ts`.

**Phase 3 — Integration.**
Run the new suite (expect 4/4). Then run the now-unskipped scope:
`req115-builder-shell`, `req115-builder-composition`,
`reconciliation-builder-workspace-chrome`, `reconciliation-builder-workspace-origin`,
`reconciliation-copy-edit-gesture*`, `reconciliation-1c-install-preflight`,
`naming`. Record the six pre-existing failures explicitly as pre-existing, with
the stash-and-rerun evidence, so the quality gate does not attribute them here.

**Do not touch:** `.xgd/quality.yaml` (C5, and absent from this worktree anyway);
the `WEBUI_INSTALLED` skip semantics; anything in the six failing tests.

### Anti-pattern Mitigations

| Risk | Symptom | Prevention | Detection |
|------|---------|------------|-----------|
| **Hardcoding the scope again** | A fourth literal appears in a new surface | `WEBUI_SCOPE` imported everywhere it can be | UAT-4, tree-wide over tracked files |
| **Legacy/fallback mode** (CLAUDE.md violation) | `try new scope, catch, try old` in `webuiPackageDir`; a `LEGACY_SCOPE` export in `webui.ts` | The old scope is deleted, not deprecated. The legacy literal exists **only** inside the test guard, split-and-joined | UAT-4's exactly-one-literal assertion on `webui.ts` |
| **Hardcoded package list** | `['webui-shell','webui-split','webui-fields']` retyped in the test | Iterate `WEBUI_PACKAGES`; iterate `git ls-files` — never a hand-written file list | Review; a new component added upstream must be covered by adding one `WEBUI_PACKAGES` entry and nothing else |
| **Generalisation check** — "would this work for a project that looks nothing like ours?" | The tree guard assumes three source roots | Enumerate the tracked tree with declared exclusions instead of assuming a layout | The `index.html` miss is the concrete proof the hardcoded-roots version was wrong |
| **Silent skip returns** | `describe.skipIf(!WEBUI_INSTALLED)` on the new suite | Suite is unconditional by construction; `WEBUI_INSTALLED` is an *assertion target*, not a gate | Grep the new file for `skipIf`; UAT-1 asserts `WEBUI_INSTALLED === true` |
| **Faking the store** | `vi.mock`, `resolve.alias`, or vendored `node_modules` entries | Store is a Phase-0 precondition; DOC-8 §9.5 forbids vendoring | UAT-1's `dir.startsWith(REPO + path.sep) === false` |
| **Pre-existing failures misattributed** | Quality gate reads 6 new failures as regressions | Declare them in the RED report with the stash-and-rerun evidence before Phase 2 | Compare against the same six names |
| **Coupling leak** | `builder.ts` re-deriving the scope from a resolved path instead of importing it | One import edge, already present at `builder.ts:12` | UAT-4 |

### Observability

No logging or metrics change. The one diagnostic that matters —
`MissingWebuiComponentError` — already names the component and the install
command (AC-962) and is reused verbatim; UAT-1 asserts per-package so a failure
names which component is missing.

**Deferred (recorded, not built).** `MissingWebuiComponentError` does not name
`--env`, so its hint is incomplete when read from an XGD worktree (whose default
install root is wrong). Pragmatic filter: **deferrable** — it is a message-text
improvement that touches AC-962's contract, and Phase 0 plus this design record
the correct command. Likewise deferred: making `WEBUI_INSTALLED` *discriminate*
"no store at all" from "store present under the legacy scope only", which would
let the mount suites keep a legitimate skip while still failing loudly on a
one-sided rename. Deferrable because after this ticket the scope has exactly one
definition and UAT-4 guards the whole tracked tree unconditionally — a one-sided
rename can no longer reach a green run. Revisit if a second implicit-dependency
scope ever appears.

## Type 2 Stories

- **Test Infrastructure: none.** The only test asset this intent needs is the
  suite itself, which carries the acceptance evidence and therefore belongs to
  the upgrade story, not to a separate infrastructure story. The one reusable
  asset in this domain (`tests/support/webui-installed.ts`) already exists,
  is registered in the TAC, and is deliberately unchanged. The store-reachability
  work is an **environment precondition (Phase 0)**, executed by the operator via
  upstream `bin/install` — no repo artifact, so no story.
- **Interface Contracts: none.** `WEBUI_SCOPE` is already defined and already
  exported from both `./webui` and the CLI barrel (`index.ts:86-92`). No new
  interface crosses a boundary; only the constant's *value* changes and two
  duplicate definitions are removed.
- **Implied product story (input for `intent_plan`): exactly one.**
  Type **upgrade**, against **CAP-85** (`capability-a994b8f3`, STORY-99), extending
  **AC-960** (one definition site) and **AC-961** (installed copy outside the repo)
  to cover the npm scope. 2 story points. Pass-through decomposition: 1 task
  (RED then GREEN as above) — the six edited surfaces are coupled through a single
  constant and splitting them produces a broken intermediate state, so parallel
  tasks would be strictly worse.
