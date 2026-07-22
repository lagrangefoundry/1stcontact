---
uid: comment-7591b3ca
id: COMMENT-254
type: comment
title: Comment on request REQ-84
created_by: xgd
created_at: '2026-07-20T21:36:41.168196+00:00'
updated_at: '2026-07-21T00:28:06.224359+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f243b6b9
  kind: chat_transcript
---

<!-- xgd-turn id="9f5bc673-7ace-4367-9669-106d5f14fccc-user" -->

<!-- xgd-chat role="user" ts="2026-07-20T21:36:39.144688+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="9f5bc673-7ace-4367-9669-106d5f14fccc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-20T22:06:42.188452+00:00" -->
#### Claude
I'll start by reading the current ticket state to preserve its body, then investigate the codebase to understand the scope of this deletion work.

This is a substantial deletion/refactor ticket that depends on REQ-82 (the L1 substrate) being complete. Let me investigate the current state of the codebase before touching anything.

L1 substrate is in place (REQ-82/83 landed). This is Phase C — stripping the old layout modules. Let me map the full dependency graph before deleting anything. I'll read the central files and run broad reference searches in parallel.

The export surface is large. The key question for a clean strip is: what do the surviving modules (`carousel`, `contact-form`) and the L1 renderer actually depend on? Let me read the surviving modules and shared helpers, and launch a thorough reference-mapping in parallel.

The surviving modules import from `../dials`, so `dials.ts` must survive but be trimmed. Let me read the remaining central files while the mapping agent runs.

`getModuleCss` iterates the registry naturally — once layout modules are gone it only reads capability modules. Now let me look at the render/scaffold in tools and the residual layout composition.

The working dir persisted into `packages/framework/src`. Let me reset to repo root and survey the full layout.

This `render/render.ts` is the old layout-composition path. I need to understand how deep the strip goes. Let me read it fully plus the site-schema module-instance shape and the conformance harness.

Now I understand the old render path fully. Let me read `dials.ts` fully (to classify layout-only vs shared dials) and the conformance harness (which the ticket says references `text-block`), while the mapping agent finishes.

`dials.ts` has a clear split. Let me verify exactly which dials the surviving modules' `.astro` files consume (the meta is one thing, the component another), and check the test landscape while the agent finishes.

I now have a full picture. This is a large but well-specified refactor: 6 module dirs + 6 helpers to delete, core files to trim, ~34 test files touching deleted code, plus site-schema and docs. Before deleting anything, let me establish the current build/test baseline so I know what "still green" means.

31 of 84 test files touch deleted code — this is a big refactor. The project uses pnpm + vitest. Let me confirm the toolchain works and get a baseline (without installing anything).

Toolchain is present. Let me establish the green baseline by running the full suite (capturing just the summary).

Baseline is green: **84 files, 814 tests pass**. Now I have everything I need. Let me verify the surviving shared helpers don't themselves depend on anything being deleted, then begin.

Surviving shared files are clean and I know the exact dials keep-set. Let me confirm no *surviving source* (tools, site-schema, apps, non-deleted framework) references the layout-only dials before I trim them.

Verified: `isLength` is used by `validate.ts` (keep it); no surviving source touches the layout-only dials. My plan is fully grounded. Let me mark the ticket in-progress and begin the source refactor with the deletions.

Deletions done. Now let me rewrite the three registry/index files.

I need to Read files before writing. Let me read the three files I'm about to rewrite.

Now `modules/index.ts` — drop the deleted helpers and metas:

Now `framework/src/index.ts` — drop the deleted re-exports:

Now the big one — trim `dials.ts` to the shared resolvers + capability-module subset. I'll rewrite it with the verified keep-set.

Framework package rewired. Now the site-schema `subScale`/`badge`/`checklist` cleanup. Let me read the relevant sections.

The subScale concept is woven through the **capture pipeline** (theme.ts, values-diff.ts, types.ts), not just layout modules. Full deletion would ripple far. The ticket's actual concern is the type-drift that fails a clean `tsc`. Let me read the schema to see the exact mismatch.

The type-drift is real but the empirical way to resolve it is a clean `tsc` after all source changes land — I'll defer the subscale decision until I see actual errors (per my "verify with clean rebuild" practice). Now the tools/generate render path. Let me rewrite it to drop layout composition.

Now the `renderModules` function — strip the layout composition down to plain band rendering:

Now the `renderPage` motion script and the theme.css CSS concat:

Now find and fix the `motionScript` usage in the body template and the theme.css concat:

render.ts stripped. Now scaffold.ts. Let me check what the page schema requires (can `modules` be empty?) before rewriting the starter.

`modules` can be empty. Let me rewrite scaffold to an empty starter (no layout modules exist to seed anymore).

Now let me verify compilation empirically. The framework imports from `@1stcontact/site-schema` (its built dist), so I need to typecheck in dependency order. Let me inspect the build setup without triggering installs.

site-schema resolves via its `dist`. Let me rebuild it (to surface the type-drift), then typecheck framework and tools.

Confirmed — exactly the predicted type-drift. Now I must decide: delete render-side subscales (ticket's lean) vs drop-responsive (fallback). Let me scope the render-side subscale footprint precisely before choosing — the capture subsystem has its *own* `ThemeSubScale` types, so I must not conflate them.

The subscale footprint is real: `req56` and `framework-tokens` tests assert the render-side `--subscale-*` vars, and the capture subsystem has its own types. The drift's **root cause** is that `subScaleSchema` was made responsive (REQ-61) but `subScaleVars` was never wired for it — an unimplemented, inconsistent capability. The ticket's fallback ("drop responsive from the schema") is exactly right and lowest-risk. Let me apply it.

Now rebuild site-schema and re-typecheck framework + tools:

All three packages typecheck clean. Let me confirm no *other* non-test consumers (builder-ui, apps, ui-kit) import deleted symbols, then run the full suite to get the real test-failure list.

Clean. Now the test suite — let me run it to get the actual failure list (the ground truth for triage).

Let me get the complete failing-file list and the summary counts.

42 test files fail — the bulk of the work. Before triaging, I need to know which reference *only* deleted code (pure delete) vs which also touch surviving modules/primitives (repoint). Let me classify mechanically.

Zsh doesn't word-split unquoted variables — let me redo the classification properly.

I have a data-driven signal but the counts are noisy (e.g. several "delete" candidates also test `contact-form`, meaning they're mixed). I need to calibrate the delete-vs-repoint pattern on a few representative files before delegating the bulk. Let me look at the repoint-shaped ones and the conformance harness fixture source.

req55 confirms the repoint pattern: it's mostly surviving-primitive assertions (`classifyLength`, `resolveContainerWidth`, `validateModuleContent`) with a few deleted-module render blocks — repoint to carousel/contact-form, keep the primitive coverage. The conformance harness is generic (parameterized by `ModuleMeta`). Let me check for shared test helpers/fixtures before I parallelize the triage.

The conformance tests are parameterized by `ModuleMeta` and use standalone synthetic `.astro` fixtures — repointable. I now have a calibrated rule and disjoint file batches. This is a large, parallelizable, well-defined transformation with a per-file green gate — ideal for parallel subagents. Let me dispatch 6 agents, each owning a disjoint set of test files and required to end green.

The 6 test-triage agents are running in the background. While they work, I'll make progress on the independent docs deliverables (CLAUDE.md, README, and the DOC-7/14/6 doc-tickets — all config/doc changes, committed directly, no reconcile). Let me first confirm the doc-ticket situation.

DOC-7/14/6 are doc-tickets. Let me handle the two files (CLAUDE.md, README) now — clear and in-scope — and read DOC-6 to plan the supersede. First the CLAUDE.md "Generalize Modules" section.

Batch 1 finished: 10 pure deletions done, and it carefully flagged 3 files (`req32-layer-treatments`, `req49-fidelity-primitives`, `req62-gradient-panel`) as NEEDS-REPOINT because they uniquely assert *surviving* `generateThemeCss` token values / `resolveSurfaceGradient` — I'll handle those 3 myself. Let me continue the docs while the other 5 agents run — rewriting the CLAUDE.md section with capability framing.

Now the framework README:

CLAUDE.md and README done. Now the 3 files batch 1 flagged for me (they uniquely assert surviving `generateThemeCss` tokens / `resolveSurfaceGradient`). Let me handle them — reducing each to just its surviving-primitive blocks. Starting with req49's token surface block.

The `REQ-49 token surface` block is pure `generateThemeCss` coverage. Let me reduce req49 to just that surviving block.

Now req32-layer-treatments — keep only the `--shadow-xl` token block. Let me read that block plus imports.

The unique surviving coverage in req32 is the `--shadow-xl` token emission. Let me reduce the file to just that (dropping the deleted `LAYER_CSS`/`renderLayer` and the heavyweight `minimalSite` fixture, keeping the token assertions).

Now req62-gradient-panel. Let me read it to identify the surviving `resolveSurfaceGradient` / values-diff blocks vs the text-block render blocks.

req62 is mostly surviving primitives (`resolveSurfaceGradient`, the values-diff `surfaceGradient` axis, and Chromium capture of a static fixture) — only the TextBlock-render blocks are dead. Let me repoint: keep the primitives, swap the gradient-field validation onto a synthetic meta, drop the text-block renders.

Let me verify my 3 repointed files pass while the other agents continue.

My 3 files pass (13 tests). Conformance batch finished (24 tests green, incl. real 3-engine). 4 agents still running. Let me plan the doc-ticket supersedes — first checking what DOC-6 and DOC-14 actually are.

Batch 2 done (6 files, 52 tests green). Note: **DOC-6 is "Project Context Summary"** (a generated index, `doc_kind: project_context_summary`) — not a layout-module doc. Stamping it "superseded" would be wrong; I'll flag that discrepancy to you rather than act on it. DOC-14 (Module Lifecycle & Two-Tier Composition) is unambiguously the old layout-module doc → supersede. Let me check the doc-update CLI options.

Only `--body` (replace) and `--append-body` exist — no prepend. For a proper top banner without risking corruption of a large body, let me get the raw body as JSON and prepend programmatically.

Batch 4 done (6 files, 39 tests; correctly set `registry.size` 8→2). 2 agents remain. Let me prepend the supersede banner to DOC-14 (via its raw JSON body).

Batch 6 done (5 files, 30 tests, incl. browser). Only batch 3 (reconciliation/responsive) remains. Now the DOC-7 split — prepend the split banner (semantic-layout-module half → superseded by L1; security half re-founded on L1).

DOC-7 split banner and DOC-14 supersede done. Now let me write the two REQ-84 acceptance UATs the ticket requires (`no_layout_modules`, `build_clean`).

All 6 agents complete (batch 3: 7 files, 37 tests). Every batch verified green in isolation. Now the real gate — the **full suite together**, including my new REQ-84 UAT. Let me run it.

**Full suite green: 74 files, 566 tests, 0 failed.** (814→566 tests: the ~248 dropped were coverage of the deleted layout modules.) Now the final clean-rebuild verification + git state check before committing.

<!-- xgd-turn id="b6006efd-a453-4c40-8bc5-96c99dec7879-user" -->

<!-- xgd-chat role="user" ts="2026-07-20T22:58:35.368521+00:00" -->
#### You
Can you finish this please

<!-- xgd-turn id="b6006efd-a453-4c40-8bc5-96c99dec7879-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-20T23:01:41.006461+00:00" -->
#### Claude
I'll pick up where the prior session left off. The refactor work is complete and the full suite was green (74 files, 566 tests). What remains: final clean-rebuild verification, commit, version bump, and ticket update. Let me check current state.

Good state. There's an untracked `storage/tmp/` I need to check (likely test artifact — should not be committed). Let me verify that and run the final clean-rebuild verification (clean `tsc` across packages) which is the outstanding gate.

`storage/tmp/` is pre-existing repro scratch (values-diff JSON, aligned crops) — unrelated to REQ-84, and I'll leave it untracked by staging explicit paths only. Now the critical outstanding gate: the clean full rebuild + typecheck across packages (per the "verify with clean rebuild" lesson). Let me run it.

Now let me run the clean rebuild: rebuild site-schema dist, then typecheck all three packages. Using local `tsc` binaries directly to avoid any install side-effects.

All three packages typecheck clean from rebuilt dist. Now the final full suite run to confirm everything is green together before committing.

All gates green: clean-rebuild typecheck passes across all three packages, full suite 74 files / 566 tests pass. Now bump the version and commit. Let me bump first.

Version bump confirmed in `package.json`. Now stage the explicit REQ-84 paths (excluding the unrelated `storage/tmp/` scratch), then commit.

71 files staged, `storage/tmp/` correctly excluded. Now commit with `[FREE-CODED]`.

Commit landed (`1a2faee`), tree clean except pre-existing scratch. Now move the ticket to `free_coded` via the gate command.

Ticket is `free_coded`. Now set story points and update the ticket body to reflect the final implementation (preserving the original scope, appending an outcome section).

Now append an "As implemented" section to the ticket body (preserving the original scope, per the read-before-write rule). Using `--append-body` so nothing is overwritten.

REQ-84 is complete. Here's the summary.

## Done — REQ-84 free-coded (v0.0.162, commit `1a2faee`)

The framework pivot phase C is landed: the semantic layout-module system is fully stripped, with L1 as the sole layout substrate.

**What shipped:**
- **Deleted** 6 module dirs (`header/ hero/ footer/ text-block/ services-grid/ layer/`) and 6 layout helpers (`layer/overlay/row/nav/motion/background.ts`).
- **Rewired** `registry.ts`, `modules/index.ts`, `framework/src/index.ts` — catalog now reduces to exactly `carousel` + `contact-form`.
- **Trimmed** `dials.ts` to shared resolvers + capability subset (~20 layout-only dials removed).
- **Stripped** residual layout-composition from tools `render.ts`; `scaffold.ts` emits an empty starter.
- **Resolved** the flagged subScale type-drift by dropping `responsive` from `subScaleSchema` (layout-module-era feature) — clean `tsc` now passes.
- **Deleted** ~19 pure-layout tests; **repointed** ~14 conformance/schema/fidelity tests onto capability or synthetic modules.
- **Added** the two REQ-84 UATs (`no_layout_modules`, `build_clean`).
- **Docs**: DOC-7 split banner, DOC-14 superseded banner, CLAUDE.md capability-framing rewrite, README refresh.

**Verification (both gates green):**
- Clean-rebuild `tsc` across site-schema → framework → tools: **clean**.
- Full suite: **74 files / 566 tests pass** (down from 814 — the ~248 dropped were coverage of the deleted layout modules).

**Ticket**: `status=free_coded`, `commits=[1a2faee]`, `story_points=8`, body updated with a full as-built section. Parked at `free_coded` — promotion to `ready_to_reconcile` is your call.

**Two things to flag for you:**
1. **DOC-6** — the ticket said "supersede DOC-6", but DOC-6 is the generated *Project Context Summary* index (`doc_kind: project_context_summary`), not a layout-module doc. I left it untouched rather than mislabel it. Confirm whether you meant a different doc.
2. **`storage/tmp/`** — untracked repro scratch (values-diff JSON, aligned crops) from earlier work, unrelated to REQ-84. I deliberately kept it out of the commit. It's not gitignored, so you may want to clean it up or add it to `.gitignore`.

<!-- xgd-turn id="fe9915b5-d486-4941-9244-8d7102e2fce3-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T00:27:42.497186+00:00" -->
#### You
please add the tmp directory to .gitignore

<!-- xgd-turn id="fe9915b5-d486-4941-9244-8d7102e2fce3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T00:28:06.193062+00:00" -->
#### Claude
This is a `.gitignore` change — configuration only, no free-coding ceremony needed. Let me read the current `.gitignore` first.

Done. Added `/storage/tmp/` to `.gitignore` and committed it.

`git status --short` now shows a clean tree — the untracked `storage/tmp/` scratch (values-diff JSON, aligned crops) is ignored and no longer clutters the working tree.

This was a config-only change (`.gitignore`), so it's committed directly with no ticket/free-coding ceremony — REQ-84 remains parked at `free_coded` as before.

<!-- xgd-chat-end -->