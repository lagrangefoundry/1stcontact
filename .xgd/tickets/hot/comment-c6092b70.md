---
uid: comment-c6092b70
id: COMMENT-1194
type: comment
title: Comment on request REQ-150
created_by: xgd
created_at: '2026-08-20T00:47:15.023004+00:00'
updated_at: '2026-08-20T00:56:50.316270+00:00'
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

<!-- xgd-chat-end -->