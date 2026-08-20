---
uid: comment-c6092b70
id: COMMENT-1194
type: comment
title: Comment on request REQ-150
created_by: xgd
created_at: '2026-08-20T00:47:15.023004+00:00'
updated_at: '2026-08-20T21:20:35.464125+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-34dd9049
  kind: chat_transcript
---

<!-- xgd-turn id="9ba3f900-e9f1-482f-baa3-d98a36294d88-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:47:11.037651+00:00" -->
#### You
Plesae explain this ticket

<!-- xgd-turn id="9ba3f900-e9f1-482f-baa3-d98a36294d88-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:48:02.888255+00:00" -->
#### Claude
**REQ-150 — `1c` CLI: boot a plain Vite SSR server, not Astro's**

It's a small cleanup ticket that became possible the moment REQ-148 landed (it's listed as `depends_on: REQ-148`, and REQ-148 is in the last commit on this branch).

**The situation.** Every `1c` command boots through `tools/generate/bin/1c.mjs`, which spins up a Vite SSR server and loads the CLI via `ssrLoadModule`. That Vite server is configured through **Astro's** `getViteConfig()` — i.e. with Astro's Vite plugin attached. The only reason for that was that the render path imported `.astro` components, which need Astro's transform.

**Why it's now dead weight.** REQ-148 converted the two behavior-module components (and their fixtures) to plain TypeScript. I confirmed it: `find . -name "*.astro"` outside node_modules returns nothing. So the Astro plugin in the bootstrap now transforms zero files — it's pure overhead plus a source of boot noise.

**What the ticket asks for.** Swap `getViteConfig()` for a plain `createServer()` config (TypeScript + workspace resolution only), and delete the workarounds that only existed because Astro was in the path:

- the second inline *Astro* config passed solely to silence Astro's own logger, and the `[WARN] Missing pages directory` it suppresses (REQ-89);
- the `createRequire(import.meta.resolve('astro/package.json'))` dance used to find Vite — with no Astro dep, Vite is resolved directly;
- *possibly* the stdout→stderr diversion — but only after verifying against a `--json` command, since that guard is defense-in-depth against **any** boot chatter, not just Astro's.

Then check whether `astro` can come out of the three `package.json` files that still declare it (root, `tools/generate`, `packages/framework`). `@astrojs/markdown-remark` is a separate package and stays.

**Why it wasn't folded into REQ-148.** REQ-148 was already wide (both modules, 12 fixtures, the render seam, ~8 test files). The bootstrap is a distinct risk surface — every single `1c` invocation goes through it — and it keeps working untouched after REQ-148. Mixing a mechanical conversion with a launcher rewrite would make a boot regression hard to attribute. So the two are deliberately sequenced to fail independently.

**Acceptance criteria (provisional, 4):** no Astro plugin in the server; silent boot on stdout/stderr with `--json` still emitting one clean document; `1c assets` still bootstraps on a fresh checkout without loading the CLI barrel (the REQ-145 cycle); no test regressions, especially the CLI output-hygiene UATs.

Status is `draft`, 2 story points, low priority. Ready to implement whenever you want — say the word and I'll follow the free-coding flow from here.

<!-- xgd-turn id="7ca0924b-0712-43cb-9755-acc462425cd6-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:54:26.685141+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="7ca0924b-0712-43cb-9755-acc462425cd6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:56:50.166323+00:00" -->
#### Claude
I've done the legwork. Here's what I found, then two questions that change the shape of the work.

## Current state (verified)

- No `.astro` files remain anywhere (`find` outside `node_modules` → empty). REQ-148 landed on this branch.
- `tools/generate/bin/1c.mjs` boots via `getViteConfig()` + the `createRequire(import.meta.resolve('astro/package.json'))` Vite lookup. That `createRequire` dance exists because **`vite` is not a direct dependency of anything** — it only arrives transitively through `astro`. So the rewrite needs `vite` added as a real dep of `tools/generate`.
- `astro` is declared in three `package.json`s (root, `tools/generate`, `packages/framework`). `packages/framework/src` imports nothing from `astro` — only `@astrojs/markdown-remark`, which stays.

**But `astro` is still load-bearing in four places outside the bootstrap:**

| File | Use |
|---|---|
| `vitest.node.config.mts:2` | exports `getViteConfig({...})` as the whole node project config |
| `tests/req89-astro-lazy.test.ts:23` | `spyOn(experimental_AstroContainer, 'create')` — 2 assertions |
| `tests/reconciliation-1c-astro-free-render.test.ts:30` | same spy — **reconciliation UAT AC-739**, 3 assertions |
| `tests/test_UAT_FC_REQ-141_project_routing.test.ts:53` | asserts `vitest.node.config.mts` *contains* `from 'astro/config'` |

Plus `types: ["astro/client"]` in `tools/generate/tsconfig.json` and `packages/framework/tsconfig.json`, and the `@astrojs/compiler-*` entries in `pnpm-workspace.yaml`.

## Question 1 — how far does "check whether `astro` can be dropped" go?

The four ACs cover only the bootstrap; the dep removal is a sentence in "What to change". Two readings:

- **(a) Bootstrap only.** Rewrite `1c.mjs`, leave `astro` installed, and report that full removal is blocked on the vitest config + 3 test files. Small, self-contained, matches the ACs literally.
- **(b) Full removal.** Also convert `vitest.node.config.mts` to plain `defineConfig` (the Astro plugin there transforms nothing now either), retire the `astro/container` spies, fix the REQ-141 assertion, swap `astro/client` → `vite/client` in both tsconfigs, and drop the dep from all three packages.

**I recommend (b)** — (a) leaves a ~200MB dep and an Astro-plugin'd test transform in place for zero remaining `.astro` files, which is exactly the residue this ticket exists to clear, and it directly contradicts the no-legacy-modes rule in CLAUDE.md. But (b) is roughly 3× the ticket's 2 points.

## Question 2 — if (b): may I rewrite the AC-739 container-spy assertions?

Without `astro` installed there is no `experimental_AstroContainer` to spy on. The measurement "no Astro container was constructed" would be replaced by the **static** form REQ-148 already uses in `test_UAT_FC_REQ-148_astro_free_render.test.ts`: no `astro` specifier anywhere in the render graph. That's strictly stronger — the spy proves it for one render, the scan proves it for every possible one — but it does mean editing a **reconciliation** UAT (`reconciliation-1c-astro-free-render.test.ts`), which is reconciled truth, not free-coded test material. REQ-148 already flipped assertions in that file, so there's precedent; I want your explicit OK before touching it again.

## Things I'm *not* asking about (I'll just settle them)

- **The stdout→stderr diversion.** The ticket says verify before removing. I'll boot the new server, check both streams on `1c help`/`list`/a `--json` command, and keep the diversion if anything at all leaks. Default lean: keep it — it's cheap defense-in-depth for *any* boot noise, and AC-2 is about the observable streams, not about the guard's absence.
- **`vite` as a direct dep** of `tools/generate` — required either way.

Tell me **(a) or (b)**, and for (b) whether the reconciliation-UAT rewrite is authorized. Then I'll cut `branch-REQ-150`, update the ticket body with the settled scope, and implement.

<!-- xgd-turn id="1f7270a0-0f92-4d8a-bfd1-ab448c1dd07d-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T02:55:11.666401+00:00" -->
#### You
1 -> b
2 - yes

Please proceed

<!-- xgd-turn id="1f7270a0-0f92-4d8a-bfd1-ab448c1dd07d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T03:08:18.408859+00:00" -->
#### Claude
Protocol read. Starting Step 1 — scope the ticket with the settled decisions.

Now the dependency edits.

Now the workspace build-approval list, then install.

Now a spike to prove plain Vite actually boots the CLI (vite isn't linked yet, so resolve it by path):

Now the tsconfigs.

Now rewrite the two container-spy test files.

I need `pnpm install` to relink (it's blocked by permissions here). While that's pending, let me run everything that doesn't depend on it.

Everything that can be verified without a relink is done. I'm blocked on one step.

## Need you to run one command

`pnpm install` is denied to me by the permission rules, and the tree can't be verified until it runs — `astro` is still linked in `node_modules` and `vite` (now a direct dep of `tools/generate`) is not. There's no network in my sandbox, so it has to be the offline form:

```bash
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-150
pnpm install --offline
```

`vite@8.1.0` is already in that worktree's store (556 MB, populated), so offline resolution should work. If it complains about resolving `^8.1.0`, tell me and I'll pin it to exact `8.1.0`.

## What's done so far

| File | Change |
|---|---|
| `tools/generate/bin/1c.mjs` | plain `createServer()` from `vite`; `getViteConfig`, the inline Astro config, and the `createRequire(import.meta.resolve('astro/package.json'))` hop all gone. Kept `configFile: false`, `middlewareMode`/`ws: false` (REQ-37), `logLevel: 'error'`, the REQ-145 `assets` branch, and the stdout diversion |
| `vitest.node.config.mts` | `getViteConfig` → `defineConfig` from `vitest/config` |
| `vitest.config.mts` | routing rationale rewritten — the split now rests on the filesystem, not the `.astro` transform |
| `tools/generate/tsconfig.json`, `packages/framework/tsconfig.json` | `astro/client` out; framework pinned to `"types": []` |
| `package.json` ×3, `pnpm-workspace.yaml` | `astro` removed, `vite` added to `tools/generate`, `@astrojs/compiler-*` approvals dropped |
| `tests/support/astro-absent.ts` | **new** — `expectNoAstroContainerToConstruct()`, the container spy's replacement |
| `tests/req89-astro-lazy.test.ts`, `tests/reconciliation-1c-astro-free-render.test.ts` | 5 container spies → the resolution check; render assertions untouched |
| `tests/test_UAT_FC_REQ-141_project_routing.test.ts` | the "keeps the `.astro` transform" assertion inverted |
| `tests/req119-request-time-render.test.ts` | dropped a dangling `astroContainer` import — REQ-148 deleted that export, so it has silently been `undefined` ever since |
| `tests/test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts` | **new** — 5 UATs |

## Already proven, by spike

I ran the new bootstrap against a Vite resolved straight out of the `.pnpm` store, in this fresh worktree (which had no `apps/control-app/src/generated/` — the genuine REQ-145 cold-start state):

- `1c assets` → exit 0, correct report, **0 bytes on stderr**, on a checkout where the barrel could not have loaded. AC-3.
- `1c help` → exit 0, 17 KB of usage on stdout, **0 bytes stderr**. `1c list` → exit 0, **0 bytes stderr**. AC-1/AC-2.
- `1c assets --json` → parses as exactly one document, **0 bytes stderr**. AC-2.
- The pre-change launcher fails identically on the missing `generated/` dir, so that was worktree state, not a regression.

`tests/req119`, `REQ-141`, `REQ-148 astro-free-render`, and the CLI output-hygiene reconciliation UATs pass now (23 tests). The rest — every test that spawns `1c.mjs` — can't run until `vite` is linked.

Ping me when the install finishes and I'll run the full node suite, bump the version, commit, merge back, and set `free_coded`.

<!-- xgd-turn id="d73c556d-bc72-421b-8793-5c275fd0d432-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:05:00.462188+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="d73c556d-bc72-421b-8793-5c275fd0d432-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T21:20:35.375679+00:00" -->
#### Claude
I'll pick up where the prior session left off — checking whether the install landed and the worktree state.

All my edits are intact; the install still hasn't run. Let me try it now — bypass mode may allow it.

Hard deny on `pnpm install*` — a deliberate policy, so I won't work around it. Let me check whether the tree is actually usable as-is.

`vite` isn't resolvable and `astro` is still linked — the tree genuinely needs the relink, and `pnpm-lock.yaml` is still stale (not in the modified list), which only `pnpm` itself can regenerate. Let me do everything else first.

Ticket body is already complete and status is `free_coding`. Let me check exactly what the lockfile situation requires.

Lockfile is tracked with `astro` in 3 importers — only `pnpm` can regenerate that, so the commit is genuinely gated on their install. But I can still de-risk it now with ephemeral, reversible local scaffolding. Let me reconnoitre first.

Zero real `astro` imports remain and the manifests are clean. Now let me run the suite against a temporarily simulated post-install tree (ephemeral, gitignored, auto-restored).

59 failures — I need a baseline to know which are mine. Let me capture the full failing-file list and run the unmodified branch-base in parallel.

Main checkout has advanced past my branch base, so I'll take an exact baseline by stashing in place.

Baseline: **13 files / 59 tests failing**. Modified: **13 files / 59 tests failing**, with `+5` passes — exactly my new UAT file. Zero regressions. Let me confirm the REQ-150 regression scope explicitly.

All 10 regression-scope files pass (48 tests), tree restored cleanly. Let me check the remaining gates and CI expectations.

CI uses `pnpm install --frozen-lockfile` — so the stale lockfile is a hard blocker. But I need to resolve a contradiction: `astro` just appeared in `package.json` again.

Wrong cwd — those last greps read the main checkout. Let me re-verify in the worktree.

Manifests are correct. Let me check the one discrepancy — the ticket body says `vite` was also added as a root devDependency, but it isn't there.

Neither Vitest config imports `vite` — so the root devDependency the ticket body mentions isn't needed and was correctly omitted. Let me review the full diff before writing up.

The diff is coherent and complete. Let me correct the one inaccuracy in the ticket body and record the verification results.

Relative path broke (the CLI chdirs) and my `rm` fired. Let me rebuild with an absolute path.

Everything restored (the one stash entry is a pre-existing `free-REQ-146` WIP, not mine). Let me confirm the new UAT file's shape before reporting.

All work is complete and verified, but **not committed** — and it can't be, correctly, until one command runs that this session is denied.

## Where it stands

Every source change from the settled scope is written and passing:

| | |
|---|---|
| `tools/generate/bin/1c.mjs` | plain `createServer()` from `vite`; `getViteConfig`, the inline Astro config, and the `createRequire(import.meta.resolve('astro/package.json'))` hop all gone |
| `vitest.node.config.mts` | `getViteConfig` → `defineConfig` from `vitest/config` |
| `package.json` ×3, `pnpm-workspace.yaml` | `astro` removed; `vite` added to `tools/generate` as a runtime `dependencies` entry |
| tsconfigs ×2 | `astro/client` types dropped |
| 4 test files + 2 new | container spies → the stronger static resolution check; 5 new `test_UAT_FC_REQ-150_*` UATs |

**Verification** (full node suite run twice in the worktree, same `node_modules`, change stashed then applied, with the post-install tree simulated by store symlinks that I reversed afterwards):

- baseline: 13 files / 59 tests failing · applied: 13 files / 59 tests failing — **identical**, with `+1` file and `+5` passes that are exactly the new UAT file. Zero regressions.
- The 59 failures are pre-existing breakage at this branch point (`test_UAT_FC_REQ-129_l1_authoring` and others), untouched by this work.
- Declared regression scope run on its own: **10 files, 48 tests, all pass**.
- Statically: no source file imports `astro` or any `astro/*` subpath, and no `package.json` declares it. `@astrojs/markdown-remark` untouched.

The worktree and `node_modules` are fully restored — no scaffolding left behind.

## The blocker

`pnpm-lock.yaml` is **tracked** and still lists `astro` in all three importers, and both `.github/workflows/ci.yml` and `deploy.yml` run `pnpm install --frozen-lockfile`. Committing the manifest edits against a stale lockfile would land a commit that fails CI on contact. Only pnpm can regenerate it — hand-editing a lockfile that size isn't a defensible substitute, and the symlinks I used for verification don't touch it.

`Bash(pnpm install*)` is on your hard-deny list in `~/.claude-2/settings.json`, so I can't run it, and I didn't try to route around it.

**Please run:**

```bash
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-150
pnpm install --offline
```

`vite@8.1.0` is already in that worktree's store, so offline should resolve. If it objects to the `^8.1.0` range, say so and I'll pin it exact.

## After that

I'll re-run the full suite on the real tree, bump the version, commit with `[FREE-CODED]`, `xgd branch lock` + merge into `xgd-working`, `move-to-free-coded`, and `xgd branch clean`.

The ticket body is current: I corrected one inaccuracy (it claimed `vite` was also added as a root devDependency — it isn't, and shouldn't be, since both Vitest configs use `vitest/config` and Vitest carries its own Vite) and appended the verification numbers and this outstanding step. Status remains `free_coding`.

<!-- xgd-chat-end -->