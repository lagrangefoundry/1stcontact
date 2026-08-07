---
uid: report-b798881b
id: REPORT-1652
type: report
title: 'Intent Plan: bug-5cabb340'
created_by: xgd
created_at: '2026-08-07T23:13:01.605239+00:00'
updated_at: '2026-08-07T23:16:43.907821+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: intent_plan
  subject_uid: bug-5cabb340
  items:
  - index: 1
    component: WEBUI_SCOPE — webui component consumption (tools/generate/src/cli/webui.ts,
      builder.ts chromeHtml, apps/control-app/src/builder/*.js)
    item_type: upgrade
    story_points: 2
    dependencies: []
    description: Move the webui npm scope from @gendevlabs to @lagrangefoundry in
      lockstep with lagrange-framework BUG-7, and collapse it to exactly one definition
      site — WEBUI_SCOPE in tools/generate/src/cli/webui.ts — with builder.ts's chromeHtml()
      importing it and the served browser sources (app.js, editor.js) renamed in place
      as a declared, bounded exception pinned to the generated import map.
    justification: 'Effect on capabilities is an in-place change to CAP-85''s existing
      ''component consumption'' surface: webuiPackageDir(), webuiExports(), WEBUI_PACKAGES,
      MissingWebuiComponentError and chromeHtml() all keep their responsibilities
      and their existing exports — only the scope value changes and two duplicate
      definitions are removed. No new capability bucket, no parallel resolution path,
      and no fallback/dual-scope auto-detection (CLAUDE.md: no legacy modes — the
      old scope is deleted, not deprecated). Classified upgrade rather than reconciliation
      because production code must change (webui.ts, builder.ts, two browser sources,
      index.html), and rather than refactor because the resolved artifact identity
      changes. Per STORY-TYPES.md, bug fixes are Upgrade stories.'
    target_story_ids:
    - story-e674c60a
    acceptance_criteria_changes:
      add: []
      modify:
      - 'AC-960 (Every name the workspace shows for the site surface has exactly one
        definition site) — extend to cover the npm scope itself, which today has three
        definition sites (webui.ts plus two literals in builder.ts, plus the served
        browser sources). After this change the scope is written once as WEBUI_SCOPE;
        the only permitted second writing is the declared, bounded exception of the
        served browser sources apps/control-app/src/builder/{app.js,editor.js}, which
        are served as-is and resolved by the import map and therefore cannot import
        a TypeScript constant — that exception is pinned by asserting every bare @…/webui-*
        specifier in those files has a matching key in chromeHtml()''s generated import
        map. The guard is tree-wide over git-tracked text files (git ls-files) with
        a declared exclusion list (.xgd/** per the 2026-08-05 operator decision to
        keep plugin: ai.gendevlabs.javascript_vitest_open, and lockfiles), so the
        tracked chrome artifact index.html and stale docstrings cannot slip through
        a hardcoded source-root list.'
      - 'AC-961 (The shared UI components are served byte-identical from an installed
        copy that lives outside this repository) — strengthen from presence to identity,
        and from conditional to unconditional. For each WEBUI_PACKAGES entry the resolved
        package''s package.json.name must equal ${WEBUI_SCOPE}/${name} (a same-named
        leftover directory under the legacy scope must fail), the resolved dir must
        lie outside the repo (nothing vendored, per DOC-8 §9.5), and WEBUI_INSTALLED
        must be asserted true rather than used as a skip gate. Rationale: the existing
        presence-only guard makes a one-sided rename indistinguishable from ''not
        installed yet'', which is the defect this ticket exists to close.'
      - 'AC-963 (The workspace document references each component through the entry
        point that component itself declares) — extend to assert scope correctness
        of the generated chrome: every key of chromeHtml()''s emitted import map starts
        with ${WEBUI_SCOPE}/, every WEBUI_PACKAGES entry has a key, the key set is
        non-empty, and no key names the legacy scope. Asserted against the live generator,
        never against the committed index.html snapshot.'
      remove: []
    intent_delta_summary: 'CAP-85 already states that every name the workspace shows
      has exactly one definition site (AC-960) and that components come from an installed
      copy outside the repo (AC-961). The npm scope was outside that guarantee: it
      had three definition sites, and its verification was presence-only and skip-gated,
      so a one-sided rename could pass green. This upgrade brings the scope under
      the invariant AC-960 already asserts, and makes the component-identity evidence
      positive and unconditional. Prior intent is otherwise preserved: the consumption
      route (upstream bin/install into a shared artifact store, ordinary Node upward
      resolution, no publishing, no workspace link, no submodule, no vendoring) is
      unchanged; MissingWebuiComponentError (AC-962) is reused verbatim; the WEBUI_INSTALLED
      skip semantics used by the mount suites (req115-builder-composition, req115-builder-shell,
      reconciliation-builder-workspace-chrome, reconciliation-copy-edit-gesture*)
      are deliberately unchanged, since their subject is mount behaviour, not scope
      identity.'
    story_uid: story-e674c60a
  consolidation_hints:
  - category: scenario_helper_duplication
    pressure: Import-map extraction from chromeHtml() output is already parsed ad
      hoc in tests/req115-builder-shell.test.ts and tests/reconciliation-builder-workspace-origin.test.ts;
      this story's suite adds a third local importMapOf helper. The tracked-tree enumerator
      (git ls-files + text-extension filter + declared exclusions) is genuinely new
      and single-use for now.
    affected_items:
    - 1
    suggested_consolidation: 'If a fourth consumer appears, promote importMapOf (and
      the git-tracked-file enumerator) to tests/support/. Not promoted now: two of
      the three call sites pre-date this plan and only one story in this plan needs
      them.'
---

# Intent Plan: BUG-32 — WEBUI_SCOPE rebrand to `@lagrangefoundry`

## Summary

One story. This intent moves the webui npm scope `@gendevlabs` → `@lagrangefoundry` in lockstep with upstream `lagrange-framework` BUG-7 and collapses it to exactly one definition site (`WEBUI_SCOPE` in `tools/generate/src/cli/webui.ts`). It is an **upgrade** to CAP-85 (`capability-a994b8f3`, STORY-99 `story-e674c60a`), whose scope already explicitly includes *"Component consumption — how the shared UI components enter this product"*. No new capability bucket, no parallel resolution path, no new module. The six edited surfaces are coupled through a single constant, so decomposition is pass-through: 1 task, RED then GREEN.

## Plan Items

| # | Component | Type | Points | Dependencies | Description |
|---|-----------|------|--------|--------------|-------------|
| 1 | `WEBUI_SCOPE` — webui component consumption | upgrade | 2 | — | Rename the scope to `@lagrangefoundry` and collapse it to one definition site; `builder.ts` imports `WEBUI_SCOPE`; served browser sources renamed in place as a declared exception pinned to the generated import map. Targets `story-e674c60a`; modifies AC-960, AC-961, AC-963. |

**Breakdown:** feature=0, upgrade=1, reconciliation=0, refactor=0, test_infrastructure=0, composition=0.

## Execution Order

1. **Foundation** — none in-repo. See the blocking *environment* precondition below (Phase 0); it is operator work with no repo artifact, so it is deliberately not a story.
2. **Upgrades** — item 1 (the only item).
3. **Cleanup** — none.

## Classification rationale

| Question | Answer |
|----------|--------|
| Did the capability exist before? | Yes — CAP-85 owns component consumption; `webuiPackageDir()` / `webuiExports()` / `chromeHtml()` are unchanged in responsibility. |
| Must production code change? | Yes (`webui.ts`, `builder.ts`, two browser sources, `index.html`, three test literals) → **not** reconciliation. |
| Is behaviour identical afterwards? | No — the resolved artifact identity changes → **not** refactor. |
| New capability bucket? | No → **not** feature. |
| Sequential multi-component flow with uncovered integration risk? | The browser↔import-map coupling is cross-surface, but it is verified *inside* this story's own UATs against the real generator, and there is no second story to compose with → **not** composition. |

Per STORY-TYPES.md, *"Bug fixes are treated as Upgrade stories"*; the user label "bug" is advisory only and the classification is by effect on capabilities.

## Why one story and one task

The six surfaces (`webui.ts`, `builder.ts`, `app.js`, `editor.js`, `index.html`, the test literals) are coupled through a single constant. Splitting them produces a broken intermediate state — a repo where the generator emits one scope and the browser sources import another — so parallel tasks would be strictly worse than one sequential edit. Pass-through decomposition: **1 task**.

## Evidence the story must carry (from the technical design)

Four UATs, all **positive and unconditional** — an absent or half-renamed store must fail loudly rather than skip green, which is the entire point of the ticket:

1. `test_UAT_FC_BUG-32_every_webui_component_actually_resolves` — per `WEBUI_PACKAGES` entry: resolves; `package.json.name === ${WEBUI_SCOPE}/${name}` (identity, not presence); `dir` outside the repo; `WEBUI_INSTALLED === true`. *(AC-961)*
2. `test_UAT_FC_BUG-32_chrome_import_map_keys_are_all_under_the_current_scope` — every key of `chromeHtml()`'s live import map is under `WEBUI_SCOPE`; every package has a key; non-empty; no legacy key. *(AC-963)*
3. `test_UAT_FC_BUG-32_builder_browser_imports_match_the_import_map` — every bare `@…/webui-*` specifier in `apps/control-app/src/builder/*.js` is under `WEBUI_SCOPE` **and** has a matching generated key; set non-empty. *(AC-960 — the declared exception, pinned)*
4. `test_UAT_FC_BUG-32_webui_scope_is_defined_in_exactly_one_place` — no git-tracked text file (minus `.xgd/**`, lockfiles) contains the legacy literal; only `webui.ts` and the declared browser-source exception write the scope; `webui.ts` holds exactly one quoted scope literal. *(AC-960 — and the only cover for the tracked `index.html`)*

The four failure modes are disjoint and jointly exhaustive for a scope rename: wrong value; wrong value in the generator; wrong value in a surface the generator does not produce; right value with a second copy left behind anywhere in the tree.

## Notes

### Blocking environment precondition (Phase 0) — not a story

UATs 1–3 transitively call `webuiPackageDir()` and therefore need the shared artifact store resolvable from an XGD branch worktree. **It is not resolvable there today** — the store lives at `/Users/martin/lagrangefoundry/node_modules/`, reachable from the real checkout but not from `/Users/martin/.xgd/worktrees/…`. Resolution (confirmed viable by `--dry-run` during technical design — all 11 packages resolve, path accepted by `_reject_repo_paths`):

```
cd ../lagrange-framework
bin/install --lang js --component all \
  --env /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git
```

Installing at the **worktree parent** means every worktree of this repo resolves it by ordinary upward lookup, with no repo change and nothing vendored. **Do not treat a UAT-1 failure as a code defect until this is done.** No repo artifact is produced, so this is an environment precondition rather than a `test_infrastructure` story.

Upstream lockstep is already satisfied: `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/` holds all 11 packages under the new scope (verified 2026-08-07).

### Test infrastructure decision

**0 test_infrastructure stories.** The two-part gate is not met: the only reusable asset in this domain (`tests/support/webui-installed.ts`) already exists and is deliberately unchanged, and no new harness is a hard prerequisite for two or more stories in this plan — there is only one story. The story's own suite (`tests/bug32-webui-scope-rebrand.test.ts`) carries the acceptance evidence and belongs to the upgrade story's RED phase, not to a separate item (test-only stories are invalid). **1 consolidation_hint** emitted for softer pressure (ad hoc import-map extraction now in three suites); `test_consolidation` will decide whether to act.

### Scope exclusions

- `.xgd/quality.yaml`'s `plugin: ai.gendevlabs.javascript_vitest_open` **stays** (operator decision 2026-08-05; the file is main-only per REQ-709 and is absent from this worktree). `.xgd/**` is on the tree-guard exclusion list for exactly this reason.
- `WEBUI_INSTALLED` skip semantics are unchanged for the mount suites.
- **Six pre-existing failures** surface once the store resolves and the suites actually run: `reconciliation-copy-edit-gesture-modal` ×5 and `req115-builder-composition::open_in_new_tab_matches_the_iframe_exactly` ×1. Confirmed pre-existing by stash-and-rerun against the old scope. **Not fixed here** — the RED report must declare them with that evidence so the quality gate does not attribute them to this change.

### Deferred (recorded, not built)

- `MissingWebuiComponentError` does not name `--env`, so its hint is incomplete when read from an XGD worktree. Message-text change touching AC-962's contract; Phase 0 and this plan record the correct command.
- Making `WEBUI_INSTALLED` discriminate "no store" from "store present under the legacy scope only". Deferrable because after this ticket the scope has exactly one definition and the tree-wide guard runs unconditionally, so a one-sided rename can no longer reach a green run.

### Risks

| Risk | Mitigation |
|------|-----------|
| Silent green (the ticket's own subject) | All four UATs positive and unconditional; `describe.skipIf(!WEBUI_INSTALLED)` anywhere in the new suite means the ticket is not delivered. |
| Self-referential guard | The guard file must not write the forbidden literal — construct it as `['@gendev', 'labs'].join('')`. |
| Faking the store (`vi.mock`, `resolve.alias`, vendored `node_modules`) | Forbidden — it would make all four UATs pass on a machine where the builder cannot run, i.e. the exact failure being fixed. UAT-1 asserts `dir` is outside the repo. |
| A fourth hardcoded literal appears later | UAT-4 scans the git-tracked tree, not a hardcoded root list — the `index.html` miss in the original three-root plan is the concrete proof that mattered. |