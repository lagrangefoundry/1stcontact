---
uid: request-573521ab
id: REQ-120
type: request
title: Re-install dependencies after a workflow commit changes a manifest (plugin-delegated,
  core stays language-agnostic)
created_by: xgd
created_at: '2026-08-06T19:19:46.329060+00:00'
updated_at: '2026-08-06T19:19:46.329060+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Problem

Declaring a dependency does not materialize it. A manifest edit (`package.json`, `pnpm-lock.yaml`, `requirements.txt`, `Package.resolved`, `pom.xml`, …) says what *should* be installed; only the package manager puts it on disk. XGD has no step that closes that gap after a manifest change lands in an already-provisioned tree — so the tree silently drifts from its own lockfile, and the next prune is free to remove a package that is still **declared**, because as far as the installed tree is concerned it was never wanted.

Observed in the 1stcontact project (their [[REQ-44]]): a workflow commit added `sharp` to `tools/generate/package.json` + `pnpm-lock.yaml`. No install followed. `node_modules` lagged the lockfile, a reconcile pruned `playwright` — a declared dependency — and every browser-driving command failed with `Cannot find module 'playwright'` (Vite logged "lockfile has changed"). A manual `pnpm install` fixed it and changed **no tracked file**, confirming the manifests were correct throughout: only the on-disk install was stale.

## Why the existing hooks do not cover this

The plugin ABC (`xgd_source/quality/framework.py`, mirrored in the plugin SDK) already has the right *shape* — it just fires at the wrong moments. Every dependency hook today is keyed to **worktree creation**:

- `setup_worktree_dependencies(new_worktree_path, source_worktree_path)` — called immediately after `git worktree add`, from `core/worktree/provisioning.py`, `core/cherry_pick.py`, `core/regression/lifecycle.py` and `xgd.py`. The JS plugin implements it by **symlinking `node_modules` from xgd-working**, which is fast and correct at creation time — and means every worktree shares one install, so a prune in any of them corrupts the tree for all of them, xgd-working included. That is exactly the observed failure.
- `config_files_for_main_sync()` — `core/sync.py` overlays the manifests onto main so a freshly-cut branch starts with the current lockfile and `--frozen-lockfile` succeeds. It syncs the **declaration**, not the install.
- `check_dependencies()` — read-only, contractually forbidden from mutating the environment, and consulted by `quality_validator.py` and `workflow_v2/workflow.py`. It can *report* a missing tool; it cannot fix one, and it does not look at lockfile-vs-install drift at all.

So: nothing fires when a commit, merge, cherry-pick, rebase or checkout brings a manifest change into a tree that already exists. That is the hole.

## Ask

Add a **manifest-change → re-install** step, with the language knowledge entirely in the plugin.

**XGD core must stay language-agnostic.** Core must not know what `pnpm-lock.yaml` is, must not shell out to `pnpm install`, and must not special-case JS. Core's whole job is:

1. after an operation mutates the working tree (commit applied, cherry-pick, merge, rebase, checkout, resync),
2. ask the plugin which paths are dependency manifests,
3. diff those paths across the mutation using the git machinery it already has,
4. if any changed, call back into the plugin to re-materialize the install,
5. fail the step loudly if that call fails — a broken install must not be discovered three workflows later as a test failure.

### Proposed plugin surface

Two new methods on `TestFrameworkPlugin`, both with safe defaults so existing plugins keep working unchanged:

```python
def dependency_manifest_paths(self) -> list[str]:
    """Paths (relative to project_root, glob-able) whose change means the
    installed dependency tree is stale. Default [] — plugin opts in.

    JS: ["package.json", "**/package.json", "pnpm-lock.yaml", ...]
    Python: ["pyproject.toml", "requirements*.txt", "uv.lock", ...]
    Swift: ["Package.swift", "Package.resolved"]
    """
    return []

def sync_dependencies(self) -> DependencyReport:
    """Re-materialize the installed tree from the current manifests.

    Called by core when dependency_manifest_paths() report a change. MAY
    mutate the environment (this is the counterpart to check_dependencies(),
    which may not). MUST be idempotent — a no-op when already in sync.
    MUST raise with a descriptive message if the install fails.

    JS: `<pm> install` via the existing package-manager detection in the
    plugin SDK (_package_manager.py already resolves npm/pnpm/yarn/bun from
    packageManager, lockfile precedence, and a monorepo walk-up).
    """
```

The JS plugin already has everything `sync_dependencies` needs — `_package_manager.py` detects the manager and emits idiomatic commands. This is wiring, not new knowledge.

### Interaction with the symlink strategy

Worth deciding explicitly as part of this ticket: with `node_modules` symlinked across worktrees, a `sync_dependencies()` in any worktree writes through to xgd-working's install. That is probably *desirable* (one install, kept current) but it means the install is shared mutable state across concurrently running workflows. Either serialize it, or have `setup_worktree_dependencies` stop sharing when a manifest differs between the worktree and its source. Do not leave it implicit — the shared symlink is the mechanism that turned one stale tree into a repo-wide outage.

## Acceptance

- Core detects manifest changes purely from plugin-declared paths; `grep -r` over `xgd_source/core` finds no package-manager or language-specific string introduced by this work.
- A workflow commit that changes a declared manifest triggers `sync_dependencies()` before the next test / quality / build step in that tree.
- A plugin that declares no manifest paths sees no behaviour change (default `[]`).
- A failing `sync_dependencies()` fails the step immediately with the plugin's message — not a silent continue, and not a cascading `@fail`.
- Regression test reproducing the original: commit a manifest change into a provisioned worktree, assert the declared package is present and resolvable afterwards.

## Related

The consuming project has independently landed defence in depth on its own side (1stcontact REQ-44): its CLI now refuses browser commands with a distinct `ENVIRONMENT` exit code when a declared package fails to resolve or when the lockfile differs from the copy the package manager wrote at last install. That catches a stale tree whatever the cause — a plain `git pull`, an interrupted install — and needs nothing from XGD. It does not remove the need for this ticket: a preflight reports the problem, it does not prevent it, and only XGD is positioned to install after the commit that made the tree stale.
