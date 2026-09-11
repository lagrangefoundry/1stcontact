---
uid: comment-c51b7259
id: COMMENT-401
type: comment
title: Comment on bug BUG-15
created_by: xgd
created_at: '2026-07-23T22:53:52.451777+00:00'
updated_at: '2026-07-23T23:05:56.752999+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9dafeb0b
  kind: chat_transcript
---

<!-- xgd-turn id="89e26e92-3391-42d2-88fe-f8e59634a567-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T22:53:50.287849+00:00" -->
#### You
PLease free code this ticket

<!-- xgd-turn id="89e26e92-3391-42d2-88fe-f8e59634a567-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T23:05:56.723734+00:00" -->
#### Claude
I'll start by reading the current ticket state and investigating the code involved.

The ticket is clear. But there are uncommitted changes in the tree (`fold.ts`, `render.ts`, `schema.ts`, `home.json`, and a scratch test) that are NOT values-diff code. Let me understand what those are and locate the values-diff code that BUG-15 is actually about.

Let me understand the uncommitted WIP changes first — I need to know if they belong to this ticket or a different one, and whether the scratch test should be removed.

The uncommitted changes belong to **BUG-14** (a `borderLeft` accent primitive) — a *different* ticket. Those must NOT be swept into my BUG-15 commit. BUG-15 is only about `values-diff.ts`. Let me deeply understand the values-diff extraction/pairing before changing anything.

While that agent maps the code, let me learn the test conventions for this area so my UAT fits in.

I'll wait for the mapping agent rather than duplicate its file reads. Let me do one non-overlapping check: the ticket suspects values-diff may read a *stale actual manifest* — let me see how the "actual" (our render) is produced/stored.

Key finding: the command handlers live in `cli/fidelity.ts`, not `values-diff.ts`. That's where "actual" is produced. Let me read that — it's complementary to the agent's work on the diff engine.

The "actual" side re-renders + re-extracts via `EXTRACT_SCRIPT` each run — so byte-identical output across two *different* renders means the actual extraction contributes ~nothing to the report both times (every target reads "missing"). The real question: does `EXTRACT_SCRIPT` even see the L1 flat DOM? Let me check the extractor.

The agent's map is thorough, but I'm not convinced the position-tiebreaker is the root cause — it wouldn't explain **byte-identical output across two different renders**. That symptom points at the *actual extraction returning ~empty* on the L1 DOM (every target → "missing"). The extractor iterates `signals.bands` (semantic sections); L1 emits a flat tree with no bands. Let me confirm by reading `EXTRACT_SCRIPT` and `flattenSignals`.

Let me find where EXTRACT_SCRIPT selects/collects the elements (runs/bands) — that's where the flat L1 tree may be dropped.

Now the picture sharpens. Bands = `document.body.children` filtered by `height >= 8` (line 890-891). L1 renders an absolutely-positioned flat tree — and **absolutely-positioned children don't contribute to parent height**, so the L1 root wrapper likely collapses to height 0 → filtered out → `bands=[]` → empty actual manifest → every target "missing" → byte-identical output regardless of render. Let me confirm the L1 render DOM structure.

Confirmed the mechanism: bands come from top-level `body.children` with `height >= 8`, but L1's root wrapper holds only absolutely-positioned children, so it collapses to height 0 and gets filtered → `bands=[]` → empty actual manifest → every target reads "missing" identically regardless of what we render. That precisely explains byte-identical output (the position-tiebreaker theory can't — different renders would tiebreak differently).

Let me verify the L1 root has no pinned height in the fold, then write a focused test to lock the diagnosis before fixing.

Root cause **definitively confirmed**: `fold.ts:955` builds the root as a geometry-less box → renders as `position: relative` with only absolutely-positioned children → collapses to height 0 → dropped by the `height >= 8` band filter → `bands=[]` → empty actual manifest → all targets "missing" identically. The position-tiebreaker theory can't produce byte-identical output; this does.

Now let me check how EXTRACT_SCRIPT is tested (CI has no Chromium) so my UAT can validate the fix.

Everything is confirmed. Now let me write the fix. I'll create a task list, then edit the extractor with a general fallback (not L1-specific), then add UATs.

The fix: when the top-level `>=8px` band scan finds nothing (a flat absolutely-positioned layout whose wrapper collapsed), fall back to a single body-spanning band so content is still collected. Semantic sites always have real bands, so this never fires for them.

Let me verify the edited region is coherent (the forEach body and its close still line up).

Now the UAT. Let me check the exact import paths/exports the sibling test uses.

Let me quickly verify `runsUnder` so my fixture DOM produces runs correctly.

All confirmed. The report exposes `matched`/`unmatched` counts — ideal for asserting the scoreboard "moves". Let me write the UAT (3 tests: extraction populates under collapse, scoreboard moves across renders, and no-regression for semantic multi-band DOM).

Now let me run the new test to validate the fix (and confirm it would fail without it).

All 3 pass. Let me confirm they genuinely fail without the fix (real evidence, not vacuous) by temporarily reverting just `extract.ts`.

The test fails without the fix (`matched=0`, everything "missing" — the exact frozen symptom) and passes with it. Solid evidence.

⚠️ Note: the working tree changed under me during the stash (package.json, a staged `bug11` deletion, a new `bug14` test appeared) — a concurrent actor is editing this shared branch. My commit must be surgical: only `extract.ts` + my test. First let me run the regression scope for the extractor change.

All 82 pass — no regression. Now the version bump. Let me check the project's bump script.

Version bumped 0.0.186 → 0.0.187. Let me see what file it edited — critically, `package.json` was already modified by the concurrent actor, so I must not sweep their changes in.

The `package.json` diff is only the version line — good. But the tree is actively changing under me. Let me get a precise current snapshot before staging anything.

The concurrent actor committed their BUG-14 work (commit count 2770→2775) — `render.ts`, `schema.ts`, `fold.ts`, the bug14 test all landed. What remains is only my BUG-15 fix (`extract.ts`), my test, my version bump, and someone else's `home.json` site-data WIP (exempt/not mine — leave it).

Let me typecheck my change before committing (vitest transpiles without full type checking).

No project-wide typecheck script exists; `tools/generate` typechecks clean and vitest (esbuild) imported the test fine. The `extract.ts` change lives inside the `EXTRACT_SCRIPT` string literal (zero TS surface). Staging only my three files — leaving the concurrent actor's `home.json` site-data alone.

Staged set is exactly my three files (home.json and a newly-appeared `playwright-driver.ts` edit remain unstaged — not mine). Committing.

Committed cleanly (3 files, only mine). Now the free-coded gate with the version bump.

Ticket is `free_coded` with the commit and version recorded. Now set story points and update the body to reflect what was actually found (the original body's root cause was marked "suspected" and the pairing theory; the confirmed cause is the collapsed-wrapper band filter). I'll preserve the symptom section and sharpen the rest.

Let me do a final verification of the ticket state and confirm my commit is clean.

Done. BUG-15 is free-coded and complete.

## Summary

**Root cause (confirmed, not the originally-suspected pairing):** `values-diff`'s in-page extractor (`EXTRACT_SCRIPT`) segments a page into style-scope *bands* = top-level `<body>` children ≥8px tall. The L1 renderer (`fold.ts:955` builds the root as a geometry-less box → `position: relative`) emits a **flat tree of absolutely-positioned leaves under one wrapper**. Absolutely-positioned children leave no in-flow box, so the wrapper **collapses to height 0**, gets dropped by the ≥8px scan → `bands=[]` → the *actual* manifest comes back empty → every target reads `missing` **identically**, regardless of what we rendered. That's exactly why the output was byte-identical across two totally different renders — the pairing theory couldn't explain that (it would tiebreak differently per render); an empty actual side does.

**Fix (`tools/generate/src/cli/capture/extract.ts`, 16 lines):** when the top-level ≥8px band scan finds nothing yet the body still paints content, fall back to a single body-spanning band so the flat tree's runs are still collected (paired downstream by text). It's general (any absolutely-positioned layout), and semantic sites always have real ≥8px bands so the fallback stays dormant — no regression. Pairing was left unchanged: once the actual manifest is populated, the existing text-key pairing produces real per-axis deltas — the simplest change that meets acceptance.

**Evidence:** `tests/bug15-values-diff-l1-flat-dom.test.ts` — 3 UATs running the real `EXTRACT_SCRIPT` under jsdom. Verified they **fail without the fix** (`matched=0`, all-missing — the frozen symptom) and pass with it. Regression scope (req63/req47/req31/req35/bug10/capture — 82 tests) all green.

**Ticket:** `free_coded`, commit `3e0c49f7`, version `0.0.187`, story_points 2, body updated to the confirmed diagnosis.

Two notes for you:
- This is a shared live branch — a concurrent actor committed BUG-14 work (5 commits) and is mid-edit on other files during my session. I kept my commit strictly to my three files; leftover `home.json`, `playwright-driver.ts`, and new `bug16-*`/`webfont` files in the tree are **not mine** and were left untouched.
- Per the process, `free_coded` is a resting state — promotion to `ready_to_reconcile` is your call when you're ready.

<!-- xgd-chat-end -->