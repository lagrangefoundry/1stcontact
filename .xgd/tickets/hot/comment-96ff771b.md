---
uid: comment-96ff771b
id: COMMENT-400
type: comment
title: Comment on bug BUG-14
created_by: xgd
created_at: '2026-07-23T22:37:36.102228+00:00'
updated_at: '2026-07-23T23:03:57.719821+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-29b55835
  kind: chat_transcript
---

<!-- xgd-turn id="47c26059-e93d-47af-8418-8ab30f24d75d-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T22:37:33.846879+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="47c26059-e93d-47af-8418-8ab30f24d75d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T23:03:57.682922+00:00" -->
#### Claude
I'll continue with the free-coding process for BUG-14. Let me first read the current ticket state and investigate the codebase to understand what needs fixing.

Let me check the ticket comments and the uncommitted change, then investigate the fold code.

The comment is just the chat transcript. Let me read the core fold code and the L1 types to understand the current structure.

Now let me understand the capture structure — the `SectionValues`, `ValueElement`, and how sections/bands are captured.

Let me examine how sections are captured and whether band fill/card structure is available.

Let me look at the actual gigabytealchemy capture bundle to see what's really in the data, and the `surfaceFillOf` extractor logic.

This is very informative. Now I can see the exact structure. Let me check the L1 schema to see what box axes are available (border, borderLeft, shadow, etc.).

The L1 box axes support `border` but not an asymmetric `borderLeft` (the coloured card accent). Let me check the probes/gate to ensure I don't break `sampleFidelity`, and the renderer.

Let me check whether the oracle has any textless `box` samples (which drive the fidelity box-pairing), and get a baseline gate/test run.

The 4 textless elements are all form controls (`control`), so the oracle has **zero box/image samples** — restructuring box emission won't affect `sampleFidelity` for this site. Let me run baseline tests and find the test setup.

There's a pre-existing failing test (`bug11` expects only `surface-\d+` ids but BUG-13 added `section-bg-0`). I'll be restructuring this area so I'll update it. Now let me read the renderer to understand box rendering and where to add `borderLeft`.

Let me examine the tests that exercise the real gate against these captures, to understand what "l1-gate stays green" must preserve.

Let me verify joyful's oracle also has no box samples, and check the `backgroundColor` availability on raw bands (to decide capture coupling).

I now have a complete understanding. Let me record my plan in the ticket, then implement. First, the schema change to add a typed `borderLeft` L1 primitive (the coloured card accent).

Now the renderer — emit `border-left`:

This is a substantial, well-understood change. Let me record the plan on the ticket first (preserving the existing body), then implement.

Now let me insert the band/card reconstruction helpers into fold.ts, right after `foldSectionBackgrounds`:

Now rewrite the main-loop surface handling and root assembly. First the text-branch surface block:

Now the root assembly block (band pick + surfaceNodes + root):

Let me typecheck the affected packages:

Two issues: site-schema `dist/` is stale (framework consumes compiled types), and a `b.geometry` optional guard. Let me check the site-schema build and fix the guard.

Typecheck is clean. Let me run the fold on the real capture to inspect the reconstructed hierarchy:

Vitest is intercepting console. Let me write output to a file instead:

This is an excellent result — bands tile correctly over their sections, cards render white with coloured left borders, badges are separate, mission grid splits into 3. Let me check whether card **box-shadows** are recoverable (issue #3 lists drop shadow) by examining how the capture composites surface treatments onto runs.

The fold reconstruction works well. Card box-shadow requires the capture to composite the card-container shadow onto runs (it currently doesn't — a separate capture-capability gap); the fold already carries `boxShadow` when present. Let me clean up and update the existing BUG-11 tests (which test the mechanism I've replaced). First, read the full bug11 test file:

The BUG-11 tests encode the superseded per-run-surface model. I'll replace that file's coverage with comprehensive BUG-14 tests for the new hierarchy. Let me delete the old file and write the new one:

All 10 BUG-14 UATs pass. Now let me run the broader regression scope — the L1/fold/gate tests plus static guardrails — to ensure nothing else broke:

A `reconciliation-l1-substrate` test now rejects a valid grid doc. Let me diagnose why `validateL1` rejects it — and whether my `dist` rebuild or schema change caused it:

`dist` isn't tracked (tests use source), so my rebuild is irrelevant. Let me confirm whether this failure is pre-existing (independent of my edits) by stashing my changes:

Confirmed **pre-existing** (fails on baseline too) — an unrelated AC-682 issue outside BUG-14's scope. My changes are clean. Let me run the naming guardrail and a wider capture/reconciliation scope to be sure:

Another test-file import failure. Let me check if it's pre-existing too (unrelated to my edits):

Both failures are **pre-existing** (baseline fails identically) — unrelated broken tests referencing modules that don't exist yet. My changes are clean. Per the "verify with a clean full rebuild" lesson, let me run a workspace-wide typecheck to catch cross-package type drift from the schema change:

site-schema/framework/generate are clean; builder-ui/ui-kit are stubs (no tsconfig). Let me verify the apps typecheck (they consume the framework):

All packages typecheck clean. Per the "clean full rebuild" lesson, let me do a workspace build (regenerates all `dist/`) and re-run the BUG-14 suite against fresh artifacts:

Clean build, tests green. Let me render the real gigabytealchemy fold and spot-check the emitted CSS for the key features (full-bleed bands, white cards, coloured left borders):

All perceptual features render correctly. The change is complete and directly resolves issues #1–#4 (drop-shadow deferred — a capture-data gap, documented below). Let me verify the working tree, bump the version, and commit.

Two unexpected items: `extract.ts` shows modified (I didn't edit it) and `home.json` was pre-existing. Let me inspect the extract.ts diff:

The `extract.ts` change is a **BUG-15** change (labeled in its own comment) — not mine, and `home.json` is pre-existing site data. Neither belongs in my commit. Let me check the version file and stage only my BUG-14 files:

Clear now: there's concurrent **BUG-15** work in the tree (`extract.ts` + `bug15-*.test.ts`) plus pre-existing `home.json` — none of it mine. The version bump touched `package.json` (this project's version file). Let me stage exactly my BUG-14 files and commit:

The staged set is exactly my BUG-14 work; BUG-15's files and the pre-existing `home.json` are correctly excluded. Let me commit:

Committed cleanly (SHA `67d413df...`), with BUG-15/home.json correctly excluded. Now let me update the ticket body — appending a resolution section while preserving the original description:

`--append-body` exists — I'll preserve the original body and append the resolution:

Now move the ticket to `free_coded` via the gating command and set story points:

Done. BUG-14 is free-coded and parked at `free_coded` (the operator decides when to promote to `ready_to_reconcile`).

## Summary

**Root cause** (as the ticket diagnosed): the fold in `tools/generate/src/l1/fold.ts` reconstructed surfaces **per text run** and **flat** — so every band paragraph got its own rectangle and cards lost their surface (the dominant run-fill heuristic even picked the white *card* colour as the page background).

**Fix** — rebuild the **section-band → card → text** hierarchy:
- **Section bands**: full-width runs with no card treatment define bands; consecutive same-fill runs group and **tile full-bleed** (`x:0`, `width:viewport`) from their top to the next band's top — so a band covers its whole section, cards included. A run on its band emits no box (kills per-paragraph rectangles).
- **Cards**: distinct-surface runs group by `same signature + x-overlap + vertical adjacency` — stacked card lines coalesce into one box (bridged by the wide body run), grid columns stay separate (3 mission cards), a badge is its own box. Treatments + inferred padding carried onto the box.
- **New typed `borderLeft` L1 axis** (schema + renderer) for the coloured card accent — a real `border-left`, not a full outline. Closed the layout gap *in L1*, per project policy.

**Verified**: rendered CSS for the real gigabytealchemy capture now emits the tan page base, dark alternating band, white product cards with orange/blue left accents, hero image, and 3-column mission grid — `sampleFidelity` unchanged, `l1-gate` green. 10 `test_UAT_FC_BUG-14_*` UATs pass; workspace typecheck + clean rebuild pass.

**Deferred (documented in the ticket)**: card **drop-shadow** — the capture composites the card fill and left accent onto runs but not the container `box-shadow`; the fold already carries `boxShadow` when present, so it flows through once a separate capture-capability change composites it. Footer dark band is a minor residual (behavior-module/contact area, out of scope).

**Ticket**: `free_coded`, commit `67d413df`, version `0.0.186`, story_points 5, body updated with the resolution + residuals.

**Heads-up**: your working tree has concurrent **BUG-15** work (`tools/generate/src/cli/capture/extract.ts` + `tests/bug15-values-diff-l1-flat-dom.test.ts`) and a pre-existing modified `storage/sites/gigabytealchemy/draft/pages/home.json` — I left all three untouched and out of my commit.

Note: one pre-existing failure — `tests/reconciliation-l1-substrate.test.ts` (`AC-682`) — fails on the baseline independent of my change (a `container/grid` doc rejected by `validateL1`); worth a separate look but not part of this bug.

<!-- xgd-chat-end -->