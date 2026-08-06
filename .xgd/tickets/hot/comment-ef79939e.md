---
uid: comment-ef79939e
id: COMMENT-707
type: comment
title: Comment on request REQ-44
created_by: xgd
created_at: '2026-08-06T18:59:56.858068+00:00'
updated_at: '2026-08-06T19:35:20.468064+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3b78151f
  kind: chat_transcript
---

<!-- xgd-turn id="52e01d65-dc21-4cb1-b115-dea1ff57409c-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T18:59:53.353550+00:00" -->
#### You
Is this a 1st contact requirement or a xgd requirement?

<!-- xgd-turn id="52e01d65-dc21-4cb1-b115-dea1ff57409c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:00:24.611361+00:00" -->
#### Claude
It's both — the ticket as written bundles two asks that live in different repos:

**1stcontact (this repo) — the fail-loud preflight.** Bullets 2 and 3 are about the `1c` CLI (`tools/generate/bin/1c.mjs`). Verifying that `playwright`/`sharp` actually resolve before launching Vite/Playwright, and erroring with "run `pnpm install`" instead of crashing mid-render, is 1stcontact tooling code. That belongs here, in REQ-44.

**XGD — the install-after-manifest-change rule.** Bullet 1 ("any XGD step / reconcile that edits `package.json` or `pnpm-lock.yaml` should run `pnpm install`") is a workflow-engine concern. The reconcile that pruned `playwright` was XGD machinery operating on a worktree; nothing in this repo can make XGD re-install. And it generalizes — any XGD project with a package manager has the same drift hazard, so the fix is in the workflow engine's post-commit/worktree-setup path, not here.

The root cause you diagnosed is the XGD half; the 1stcontact half is defence-in-depth that catches the drift regardless of what caused it. Worth keeping both — the preflight is useful even if XGD never installs anything, because a stale tree can also come from a plain `git pull`.

Suggested split: narrow REQ-44 to the `1c` preflight, and file the install-after-manifest-change ask as an XGD ticket. Want me to rewrite the body to that scope? I won't create the XGD-side ticket unless you ask.

<!-- xgd-turn id="47fa9184-6992-4123-ad25-4c05843fc64e-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:10:57.463702+00:00" -->
#### You
note that xgd core MUST NOT do anything language specific - it needs to call the plugin - can you implement 1c part of this and create a ticket in xgd for the other piece please

<!-- xgd-turn id="47fa9184-6992-4123-ad25-4c05843fc64e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:20:55.575498+00:00" -->
#### Claude
Now updating the ticket to scope it, then implementing.

Now the implementation.

Now the `ENVIRONMENT` error code and the CLI wiring.

Now the dispatch hook:

Now the UATs.

Now the XGD-side ticket.

Both halves done.

## 1stcontact — REQ-44, free_coded

`tools/generate/src/cli/preflight.ts` runs before any command that loads a declared runtime dependency, and checks two independent things:

- **Resolution** — does each package the command actually loads resolve from disk? This is the `Cannot find module 'playwright'` case, caught before the browser launches.
- **Drift** — does `pnpm-lock.yaml` still match `node_modules/.pnpm/lock.yaml`? pnpm writes that copy verbatim at install, so byte-inequality is an exact statement that the tree was never installed at the committed lockfile — no mtime heuristics.

Drift fails even while every dependency still resolves, because that is precisely the state the next prune turns into the crash. Catching it while the commands still work is what makes the check preventive rather than a post-mortem.

The gate is per-command on what each verb loads (`crop` → `sharp` only; `render`/`repro`/`l1-gate`/edit verbs ungated), so an offline seam is never blocked by a dependency it doesn't use. Refusal travels the existing REQ-11 failure contract via a new `ENVIRONMENT` code — exit 6, `{ok:false,error}` under `--json` — because the command and its input were both fine and only the tree was not.

Verified end-to-end: with a deliberately drifted lockfile (restored after), `1c crop` and `1c diff --json` both exit 6 with the `pnpm install` hint. 11 UATs pass; typecheck clean. Commits `10771a22b` + `a7fbde3b3` (version 0.1.16).

**Pre-existing failures, unrelated:** 10 tests across 5 files (`reconciliation-*l1*`, `reconciliation-scaffold-starter-l1`) fail identically with my changes stashed.

## XGD — REQ-745

Filed in `lagrangefoundry/xgd` (the CLI pins workspace via `XGD_PROJECT_ROOT`, so my first attempt landed here as REQ-120 — archived, refiled correctly).

The investigation sharpened the ask. XGD's plugin ABC already has the right shape, but every dependency hook fires at **worktree creation**: `setup_worktree_dependencies` (called from provisioning, cherry_pick, regression lifecycle), `config_files_for_main_sync` (syncs the *declaration*, not the install), and `check_dependencies` (contractually read-only). Nothing fires when a commit, merge, cherry-pick or checkout brings a manifest change into a tree that already exists.

The ticket proposes `dependency_manifest_paths()` and `sync_dependencies()` on `TestFrameworkPlugin`, both defaulting to no-ops. Core's job stays: ask the plugin which paths are manifests, diff them with the git machinery it already has, call back to re-materialize. It never learns what `pnpm-lock.yaml` is. Acceptance includes a grep assertion that no package-manager string enters `xgd_source/core`.

One thing I flagged there as needing an explicit decision: the JS plugin implements `setup_worktree_dependencies` by **symlinking `node_modules` from xgd-working**, so all worktrees share one install — which is the mechanism that turned one stale tree into a repo-wide outage. A `sync_dependencies()` in any worktree would write through to that shared install.

Two notes on the working tree: `apps/control-app/src/builder/{app,builder.css,config}.js` and an untracked `tests/req117-builder-viewport-fill.test.ts` are not mine and are not in either commit — they appeared during the session, likely from a background XGD workflow. I briefly stashed and restored them while confirming the pre-existing failures; `git status` shows them intact.

<!-- xgd-turn id="38526eb1-8900-4293-9c58-e60cc30f9548-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:32:43.711828+00:00" -->
#### You
Are there any changes required to the plugins?

<!-- xgd-turn id="38526eb1-8900-4293-9c58-e60cc30f9548-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:34:28.516213+00:00" -->
#### Claude
Correcting one thing I said earlier first — let me verify against the code rather than the ABC docstring.

Yes — and less than I implied. I checked the plugin code rather than the ABC docstrings, and one thing I said last turn was wrong.

**Correction:** the JS plugin does not symlink `node_modules` from xgd-working. That strategy was removed — pnpm rewrote hoisted symlinks *through* the link into xgd-working, leaving stale broken entries after teardown. `javascript_vitest_open.setup_worktree_dependencies()` now runs a real `pnpm install --frozen-lockfile --prefer-offline --ignore-scripts` in the new worktree, so worktrees are self-contained. REQ-745 is updated; the shared-mutable-install concern is gone.

## What the plugins need

**`javascript_vitest_open` — refactoring, not new capability.** Both halves already exist, triggered at the wrong moment:
- `config_files_for_main_sync()` already computes the manifest set (`package.json`, detected lockfile, `pnpm-workspace.yaml`) via `_package_manager.detect_package_manager` — Corepack, lockfile precedence and monorepo walk-up all handled. `dependency_manifest_paths()` is that plus `**/package.json` for workspace members, which is exactly where `sharp` landed.
- `sync_dependencies()` is the install body of `setup_worktree_dependencies` lifted into a `cwd`-parameterised helper. `setup_worktree_dependencies` then becomes the same install against a different directory.

**`--ignore-scripts` is a live problem for this exact bug.** The worktree install passes it. `sharp` and `playwright` both do real work in `postinstall` — a native binary and a browser download — so a tree installed that way has the package directory and not the artifact. Resolution succeeds, use fails, and my REQ-44 preflight cannot see it (it resolves the module, not the artifact). Either `sync_dependencies()` runs scripts, bounded by the project's existing `allowBuilds`, or the plugin declares which packages need them. Worth deciding rather than inheriting the flag by copy-paste.

**The ABC exists twice** — `xgd/xgd_source/quality/framework.py` and `xgd-plugin-sdk/src/sdk/framework.py`, drifted but overlapping. Both need the new methods, with `[]` / no-op defaults.

**The other four plugins** (`python_open`, `java_junit5_open`, `swift_xctest_open`, `example`) implement `setup_worktree_dependencies` nowhere — they inherit the no-op. Defaults keep them compiling, but leaving them there just relocates the bug to those languages.

## One core cleanup this exposes

`xgd_source/quality/worktree_setup.py:97` still has `_repair_source_node_module_symlinks()` — a pnpm-specific algorithm walking `node_modules/@*/` to rewrite hoisted symlinks — called unconditionally on every worktree setup. It exists solely to repair damage from the symlink strategy the JS plugin already abandoned. That is precisely the language-specific-code-in-core you want gone; it should move into the plugin or be deleted.

The other core hits are benign by comparison — `node_modules` in directory-skip lists (`state.py:602`, `workflow_v2/dependencies.py:861`, `config/discoverer.py:38`) — though they're the same smell in miniature.

Both findings are now in REQ-745. Want a separate ticket in `xgd-plugin-sdk` for the plugin-side work, or is tracking it under REQ-745 enough?

<!-- xgd-turn id="b2bb0d19-d3d9-4b38-82f2-de9203b081cc-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T19:35:20.328279+00:00" -->
#### You
I need a ticket in the plugin project too, if there is work there

<!-- xgd-chat-end -->