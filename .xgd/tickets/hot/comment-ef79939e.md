---
uid: comment-ef79939e
id: COMMENT-707
type: comment
title: Comment on request REQ-44
created_by: xgd
created_at: '2026-08-06T18:59:56.858068+00:00'
updated_at: '2026-08-06T19:20:55.692697+00:00'
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

<!-- xgd-chat-end -->