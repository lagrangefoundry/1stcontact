---
uid: comment-f76c6986
id: COMMENT-395
type: comment
title: Comment on bug BUG-9
created_by: xgd
created_at: '2026-07-23T17:23:50.290362+00:00'
updated_at: '2026-07-23T17:39:19.658683+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f983e8eb
  kind: chat_transcript
---

<!-- xgd-turn id="7eacf7ee-e0cf-492d-a126-8df85c4313c8-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T17:23:48.050175+00:00" -->
#### You
Please free code a fix to this

<!-- xgd-turn id="7eacf7ee-e0cf-492d-a126-8df85c4313c8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T17:39:19.623828+00:00" -->
#### Claude
I'll start by reading the current ticket state and the relevant code before making changes.

Let me look at the existing tests and related structure before designing the fix.

Let me look at the existing 3-probe gate tests and the promoteToFlow tests to understand the test patterns and fixture shapes.

I have a real multistate capture. Let me write a scratch script to fold it and run the probes, reproducing the actual failure before fixing.

I've reproduced the bug precisely against the real capture. Key findings:
- The fold is **flat**: root `box[flow]` with 55 pinned text children.
- `contentRobustness` fails with 35–63 overlaps/width, all among direct root children.
- `promoted == ["0"]` and **after recovery it still fails** (`CR false, OS false`) — the single flat pile leaves non-promoted pinned siblings behind, which the grown pile overruns.
- `sampleFidelity` passes (base untouched) — must stay so.

Let me check helper usage before rewriting.

Now I'll replace the recovery section with a region-aware, recursive implementation. Let me read the exact current block to replace.

Now I'll replace this whole block with the region-aware recursive implementation.

Now let me run the scratch repro against the real capture to confirm the fix.

The fix works on the real capture: `after CR true, OS true`, `promoted` lists 5 nested regions (not `['0']`), and `sampleFidelity` unchanged. Now let me remove the scratch test and run the existing suites.

All existing suites pass. Now let me write the BUG-9 UAT tests. Let me check the fold/capture helper types used in tests to build a proper fixture.

Existing suites green. Now let me write the BUG-9 UAT tests with a self-contained fixture that mirrors the real failure mode (flat page, multiple tightly-packed regions).

My fixture labels are too short to grow under perturbation. Let me check how the fold handles text height to build a correct fixture.

The fold gives text leaves natural (estimated) height — my labels were too short to wrap under perturbation. I need ~10-char labels (1 line at rest, 2 lines at 2.5×), like the `oracle()` fixture. Let me fix the fixture.

All 4 UATs pass. Now let me run the broader L1/repro test scope plus a typecheck to confirm no regressions.

Let me verify the typecheck actually ran against a real config, and lint the changed files.

Typecheck clean, no eslint config in repo (not a gate). Now the free-coding steps. First the version bump:

Now update the ticket body to reflect the implementation, preserving the existing content.

Now commit the code changes with `[FREE-CODED]`.

The version lives in `package.json` (not `xgd_source/__init__.py`). Let me stage the correct files.

Now promote the ticket to `free_coded` via the gate command.

Let me verify the final ticket state and confirm a clean tree.

Done. BUG-9 is fixed, tested, committed, and parked at `free_coded`.

## What was wrong

`promoteToFlow` (`tools/generate/src/l1/probes.ts`) recovered a failing page by promoting only the **pinned-text** children directly under one node into a **single flat flow pile** with one median gap — leaving every other pinned sibling absolute for the grown pile to overrun. Reproduced against the real gigabytealchemy capture: `promoted == ['0']` yet `contentRobustness` and `offSample` **still failed at every width** after recovery.

## The fix (region-aware, recursive)

`promoteToFlow` now walks the tree and, at each node:
- Builds a **perturbed-overlap graph** among the node's direct children (evaluate once per captured width; each overlap finding links two colliding leaves).
- Groups them into **connected components** (union-find) — the smallest sibling groups that actually collide, i.e. the distinct nested regions (hero / grid / footer).
- Promotes **each region into its own flow `stack`** with its own interior `medianGap`, and flows *all* the node's children so **nothing pinned is left behind** to be overrun.
- Leaves a node with no colliding group fully **absolute** (demand-driven, per DOC-27).
- Reports a single whole-node region as the node path (`['0']`, backward-compatible) and multiple regions as nested paths (`0.0`, `0.1`, …).

Fidelity is measured on the untouched absolute base, so recovery never regrades `sampleFidelity`. The old single-pile helpers (`groupKeyframes`, `failingSiblingGroups`) are deleted.

## Verification

- **Real gigabytealchemy capture**: `offSample` + `contentRobustness` now pass; `promoted == ["0.0","0.1","0.2","0.3","0.6"]` (nested regions, not `['0']`); `sampleFidelity` unchanged.
- 4 new UATs in `tests/bug9-region-aware-promote.test.ts` (`test_UAT_FC_BUG-9_*`) covering nested-region promotion, fidelity-never-regraded, single-region reporting, and the roomy-page (nothing promoted) case.
- Existing 3-probe / req86 / req88 suites and 9-file broader L1 scope (53 tests) stay green; `tsc` clean.

Committed `aaf91dae` `[FREE-CODED]`, version bumped `0.0.180 → 0.0.181`, ticket at `free_coded` with the SHA recorded. It's parked there for you to validate — promote to `ready_to_reconcile` when you're ready.

<!-- xgd-chat-end -->