---
uid: comment-b3022042
id: COMMENT-2218
type: comment
title: Comment on bug BUG-50
created_by: xgd
created_at: '2026-09-04T00:03:02.394090+00:00'
updated_at: '2026-09-04T01:39:16.368064+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4b0ef37f
  kind: chat_transcript
---

<!-- xgd-turn id="c1fbf74d-b7cc-430b-8f07-623f54cb0158-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T00:02:48.534602+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="c1fbf74d-b7cc-430b-8f07-623f54cb0158-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T00:07:21.814604+00:00" -->
#### Claude
I've verified the ticket's mechanism and found three things that change its framing. No code touched.

## The mechanism: confirmed

Read wrangler 4.106's own `getVarsForDev` (`wrangler-dist/cli.js:181855`):

```js
if (!envFiles?.length) {           // ← default .dev.vars lookup ONLY when no --env-file
  loadDotDevDotVars(resolve(configDir, '.dev.vars'), env)
}
if (loadedSecrets === undefined && loadDevVarsFromDotEnv()) {
  loadDotEnv((envFiles ?? getDefaultEnvFiles(env)).map(p => resolve(configDir, p)), …)
}
```

`--env-file` does replace the default lookup, later files do win (`override: true`), the flag is on by default (`CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV` defaults `true`), and paths resolve against the **wrangler config dir**, not cwd — so `.dev.vars` means `apps/control-app/.dev.vars` from anywhere. Composing the identical two flags in the CLI (which already spawns with `cwd: appDir`) is exactly equivalent to the package script.

One useful detail the ticket doesn't have: **a nonexistent `--env-file` is tolerated**, not fatal (`loadDotEnv` catches ENOENT → debug log → continue, 181813). So requirement 3's "warn, don't fail" needs no conditional argv — pass both flags always, and check existence only to decide whether to print the warning.

## Correction 1 — the divergence is uncommitted

The `--env-file` layering exists only in your dirty working tree:

```
 M apps/control-app/package.json
-    "dev": "wrangler dev --port 8788"
+    "dev": "wrangler dev --port 8788 --env-file .dev.vars --env-file ${ONECONTACT_SECRETS:-…}"
```

At HEAD, `pnpm dev:control` and `1c builder` are byte-identical (`wrangler dev --port 8788`) and **neither** loads the key. So the committed defect isn't "two paths diverge" — it's "no path names the secrets file", and the divergence is what your half-landed fix created. The ticket's comparison table describes the post-fix-to-one-side state. Worth rewording, because it changes what a reader is looking for.

## Correction 2 — `.dev.vars` has never been committed, and the tree now ignores it

`git ls-files` → nothing; `git log -- apps/control-app/.dev.vars` → empty. And the working tree adds `.dev.vars` / `.dev.vars.*` to `.gitignore` (also uncommitted).

That contradicts DOC-41 §2 directly — *"`.dev.vars` is committed and holds no secrets. It blanks `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` so that `ACCESS_DEV_OPEN=1` takes effect"* — and the file's own header is internally contradictory: *"Ignored by git (.gitignore)"* next to *"NO SECRETS IN THIS FILE. It holds the local-dev config every clone needs."*

The consequence is real and worse than BUG-50 as filed. `isUnconfiguredLocalDev` (`index.ts:86`) requires **both** Access vars empty; `wrangler.toml [vars]` fills both in. So on a fresh clone with no `.dev.vars`, `ACCESS_DEV_OPEN=1` does nothing, the Access gate runs, and there is no JWT on loopback — the local builder is unreachable by either entry point. This needs your call: commit `.dev.vars` (which is what its design and DOC-41 both assume) or keep it ignored and have something else supply the blanking. I'd commit it.

## Correction 3 — REQ-173 already removed the silent half

REQ-173 merged 2026-09-02 18:38 −0700, about **1h48m after** BUG-50 was filed. It added `aiConfigured` and a deployment-wide answer:

- `POST /api/material` and `/api/material/fetch` now `503` with `NO_API_KEY_MESSAGE` *before reading the bytes* (`router.ts:1041`, `1105`) — the comment there says exactly why: "the Library would fill up with rows saying why, one per upload, for a fact that is true of the whole deployment and is stated once at the top of the screen instead."
- `GET /api/status` reports `{ai: false, message: …}` (`router.ts:854`).

So *"uploaded images are never looked at, and nothing says so"* is no longer true — the upload is refused and the reason is stated once at the top of the screen. `defaultDescriber` still returns `undefined`, but nothing reaches it. What survives is a plain wrapper bug with loud symptoms: the operator has a key at the documented path and the builder truthfully reports it has none. Same fix, materially lower severity, and the ticket's "including the half that is silent" section should be rewritten rather than left to look like live evidence.

## Implementation shape

The ticket leaves the "defined once" location open. Two viable shapes:

**A — CLI owns the layering, package script becomes the caller** (my recommendation). `1c builder` composes `['wrangler','dev','--port',port,'--env-file','.dev.vars','--env-file', process.env.ONECONTACT_SECRETS ?? join(homedir(),'Documents/secrets/1c.dev.env')]`, warns when the secrets path is absent, and root `dev:control` becomes `./bin/1c builder` (which runs at repo root, so cwd is already right). `apps/control-app`'s own `dev` script then has to go, or it's the third place that knows half.

**B — package script owns it, CLI shells out** to `pnpm --filter @1stcontact/control-app dev`. Truly one definition, but `--port` and `--remote` can no longer be threaded cleanly (the script hardcodes the port, and dropping it collides with public-site on 8787).

One snag for A: `1c builder` derives `appDir` from `process.cwd()` (`index.ts:713`), so it only works from the repo root today. Fine if `dev:control` invokes it from the root, but resolving the repo root from the module's own location — the way `bin/1c` already does — is a one-line robustness fix worth folding in.

**UAT.** `run(['builder'])` currently spawns real wrangler, so the seam is `vi.mock('node:child_process')` — `spawn` is a static named import (`index.ts:13`), so that works. Then it's a real entry point with only the process boundary (a genuine external system) stubbed: assert the composed argv carries both `--env-file` flags, that `ONECONTACT_SECRETS` overrides the default, and that an absent secrets file names the path, states the consequence, and still spawns.

Three questions before I write anything: commit `.dev.vars` or not; shape A or B; and do you want the ticket body corrected for all three findings above (I'd fold the REQ-173 supersession and the uncommitted-`package.json` framing in, and add the `.dev.vars` decision as scope) before I cut the branch?

<!-- xgd-turn id="f5f6b2de-4f3c-4250-afb1-c63be822aa16-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:19:12.369313+00:00" -->
#### You
Sure lets do A

<!-- xgd-turn id="f5f6b2de-4f3c-4250-afb1-c63be822aa16-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:28:23.959824+00:00" -->
#### Claude
Shape A it is. Let me scope the ticket first — the body needs the three corrections plus language motivating each UAT.

Now the single definition of the layering:

Now wire it into the `builder` command:

Now the package scripts — one caller, no second author:

Now the UATs:

Now the DOC-41 update and a regression pass:

The merge-back is blocked by unrelated dirt in the standing main worktree — a whitespace-only YAML reflow of `.xgd/config.yaml` that isn't mine. I'll stash it (recoverable) rather than discard:

Shape A is landed and merged into `xgd-working`.

## What changed

**`tools/generate/src/cli/dev-env.ts`** (new) — `devEnvLayering()` is now the only place that knows the layering. It composes `--env-file .dev.vars --env-file <secrets>` in load order, resolves the secrets path as `ONECONTACT_SECRETS || $HOME/Documents/secrets/1c.dev.env` (empty override falls back, matching `:-`), and returns a warning line per absent file. Both flags are always passed — wrangler tolerates a named `--env-file` that doesn't exist, so existence is checked only to produce the message.

**`case 'builder'`** — spreads those args, prints the warnings after the banner and before wrangler's output, and derives `appDir` from `repoRoot()` instead of `process.cwd()`. That last one mattered once `dev:control` became a caller: the old cwd dependency would have turned into a package script's silent precondition.

**Package scripts** — root `dev:control` is now `./bin/1c builder`; `apps/control-app`'s own `dev` script is deleted, so there's no third place holding half the layering.

**DOC-41 §2** — the *"Gotcha: `1c builder` is not `pnpm dev:control`"* subsection is gone, replaced by a short note on `--remote`, the one flag that still differs. The false claim that `.dev.vars` is committed is corrected to describe what a fresh clone actually gets.

**Ticket body** — rewritten with the three investigation corrections, and every UAT traces to language now in it.

## Verification

6 UATs in `tests/test_UAT_FC_BUG-50_builder_env_files.test.ts`, driven through `run(['builder'])` with only `spawn` replaced (via `importOriginal` + spread, since `kb.ts` needs `execFileSync` from that module). They cover both flags in load order, the `$HOME` default and both override forms, the missing-secrets warning plus a present-file counter-test, the `.dev.vars` warning, and `--remote` + cwd-invariance. All 6 pass, plus 28 in four CLI-adjacent suites as a regression check. Commit `a922dac72f`, version 0.2.64, ticket at `free_coded`, branch merged and cleaned.

One pre-existing typecheck error surfaced and is unrelated: `apps/control-app/src/session-knowledge.ts` imports `SHIPPED_SOURCE` from `./system-knowledge`, which doesn't export it.

## Two things I did to your working tree

**Stashed your uncommitted `apps/control-app/package.json` edit** — `stash@{0}`, the `--env-file` line you'd added to `dev`. It blocked the merge, and it's the half-fix this ticket supersedes: that script no longer exists. Drop it when you're happy.

**Could not clean `.xgd/config.yaml`** in the standing main worktree. A whitespace-only YAML reflow is sitting there uncommitted, not from this work, and the sandbox denies writing that path — so `xgd merge-back` refused and I merged by hand via `xgd branch lock` + `git merge` (the path its own error message suggests). Worth clearing before the next merge-back.

## Still open, as flagged

Whether `.dev.vars` becomes tracked. Nothing here settles it — the CLI now names the file when it's missing and says Access won't be open on loopback, so the fresh-clone trap announces itself either way. DOC-41 records it as open. If you want it committed, that's a small follow-up and I'd need to know whether the working-tree `.gitignore` addition (also uncommitted) should be reverted rather than landed.

<!-- xgd-turn id="86a4d9a6-eb28-4e2b-b545-0a84a96ba7db-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:39:16.323369+00:00" -->
#### You
you tell me shoudl it be?

<!-- xgd-chat-end -->