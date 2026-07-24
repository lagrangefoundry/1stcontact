---
uid: comment-d296ef9d
id: COMMENT-309
type: comment
title: Comment on bug BUG-6
created_by: xgd
created_at: '2026-07-23T05:22:50.701347+00:00'
updated_at: '2026-07-23T16:39:24.860511+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b9eb2e3a
  kind: chat_transcript
---

<!-- xgd-turn id="7f1e6dc4-c25f-43e0-8141-648bd65d3774-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T05:22:48.340212+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="7f1e6dc4-c25f-43e0-8141-648bd65d3774-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T05:24:49.238728+00:00" -->
#### Claude
I'll start by reviewing the ticket and the relevant code before making changes.

The fold.ts already contains residual-emission code referencing "REQ-92 / BUG-6". Let me check the git history to understand what's already been done and whether it's committed under this ticket.

The BUG-6 work is already implemented and committed in `9e92a339`, but that commit is bundled with REQ-92 (textShadow). Let me check whether that commit is already claimed by REQ-92's ticket.

The BUG-6 work is already implemented and committed — but the commit `9e92a339` is **already claimed by REQ-92** (which is at `free_coded`). Let me check the test coverage to see how the residual behavior is tested and whether it's attributed to BUG-6 or REQ-92.

I now have the full picture. Let me confirm the residual tests actually pass, so my report is grounded.

I've investigated before touching anything, and this ticket is in an unusual state that I should surface rather than blindly "free-code."

## What I found

**BUG-6's work is already implemented, tested, committed — and the commit is claimed by REQ-92.**

- The signal-not-drop behavior is live in `tools/generate/src/l1/fold.ts`: the `FoldResidual` interface, `residualKindOf`/`capturedAxesOf`, and the `signal(...)` calls that replace the old silent `continue` for text-free elements, geometry-less runs, and empty text. This is exactly BUG-6's fix direction.
- It landed in commit **`9e92a339`** — `"feat(l1): fold textShadow + signal fold residuals instead of silent drop [FREE-CODED]"` — which **bundled REQ-92's textShadow work with BUG-6 (B2)**. The commit message explicitly says *"BUG-6 (B2) signal-not-drop … each becomes a typed FoldResidual."*
- That SHA is **already recorded on REQ-92's `fields.commits`**, and REQ-92 is at `free_coded`.
- Tests exist and **all 7 pass** (`tests/req92-fold-full-language.test.ts`), including the four residual tests — but they're named `test_UAT_FC_REQ-92_*` (e.g. `_textless_elements_signalled_not_dropped`, `_geometryless_text_run_signalled`, `_drop_stays_silent_without_the_collector`, `_covered_pixel_mover_not_a_residual`).

This matches REQ-92's own design note: *"[[bug-b9eb2e3a]] (B2) — signal-not-drop, **baked into this rebuild**."* BUG-6 was intentionally absorbed into REQ-92's folder rebuild.

## Why I'm not free-coding it

There is no new code to write — the behavior, tests, and commit all exist. And I **cannot** attach `9e92a339` to BUG-6: the `move-to-free-coded` gate enforces one-SHA-one-ticket, so it would reject a SHA already owned by REQ-92. Duplicating the code into a fresh commit would just re-add what's already in the tree.

## How I'd suggest resolving it (your call — these are status decisions I don't own)

1. **Mark BUG-6 as subsumed by REQ-92** (e.g. `deprecated`/`wont_fix` with a comment pointing at REQ-92 + `9e92a339`). Cleanest — reflects reality: B2 was baked into REQ-92 by design. When REQ-92 reconciles, the residual behavior gets matrix coverage there.
2. **Leave BUG-6 at `draft`** as a tracking placeholder until REQ-92 reconciles, then close it.

I'd recommend **option 1**. Which would you like — and do you want me to add the cross-reference comment to BUG-6?

<!-- xgd-turn id="ebae041c-d947-44b7-bb71-7776551e87bb-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T16:34:58.547646+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="ebae041c-d947-44b7-bb71-7776551e87bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T16:39:24.832973+00:00" -->
#### Claude
You're right to push. Let me re-examine BUG-6's acceptance for work that genuinely *isn't* yet satisfied by REQ-92's commit — specifically (a) tests named for **this** ticket, and (b) "gate report separates residuals from mispairing." Let me inspect the gate wiring.

Now the picture is precise. Acceptance items 1–3 (no silent drop, typed residuals, **gate separates fold residuals from mispairing residuals**) are all implemented. The **one unmet clause is BUG-6's own**: *"Tests named `test_UAT_FC_<this-ticket>_*`."* The existing tests are `test_UAT_FC_REQ-92_*`, so BUG-6 has **zero matrix coverage** and would be eliminated as drift on the next `test_fix`.

That's the honest, non-duplicative free-coding work: add `test_UAT_FC_BUG-6_*` UATs that lock BUG-6's contract independently — including the gate-separation clause REQ-92's tests don't cover. Let me read the existing test file and the gate probe types to build faithful tests.

BUG-6's distinctive clause vs REQ-92 is **gate-level separation** of fold residuals from probe mispairing residuals. Let me check whether `cmdL1Gate` is testable without a heavy on-disk bundle, and how existing tests exercise the gate.

Let me read the req88 fixture helpers so my gate test matches the established pattern.

Let me confirm the `sampleFidelity.residuals` shape so the separation assertion is precise.

All confirmed: `FoldResidual` (`kind/reason/capturedAxes/widths`) is structurally distinct from the fidelity probe's `FidelityDelta` (`text/dx/dy/dw`), and they live in separate report fields — that's the "separation" BUG-6 demands, and REQ-92's tests never exercise `cmdL1Gate`. 

Now the free-coding lifecycle. First I'll scope the ticket (preserving its body), then write the `test_UAT_FC_BUG-6_*` UATs.

Status is set via `--fields`. Let me scope the ticket (in_progress) and append a note recording the plan, preserving the existing body.

Now the UAT tests. I'll write `test_UAT_FC_BUG-6_*` covering BUG-6's contract — with emphasis on the gate-separation clause REQ-92 doesn't exercise.

All 4 pass. Per my memory note (green vitest ≠ typecheck-clean), let me run a typecheck before committing.

No root tsconfig includes `tests/`. Let me typecheck the test file directly against the base compiler options (it follows imports into the source packages).

Only errors are pre-existing `.astro` module-resolution noise in an unrelated package (`registry.ts`) — my test file itself is type-clean. Now the version bump, then commit.

Now move the ticket to `free_coded` — this validates the version bump against the commit and records the SHA.

Done. Let me verify the final ticket state.

BUG-6 is free-coded. Here's what I did and why.

## The situation

BUG-6's *behavior* (fold emits typed `FoldResidual`s instead of silently dropping text-free/geometry-less elements; the l1-gate keeps them in a `foldResiduals` channel separate from probe mispairing residuals) had **already shipped** — baked into REQ-92's folder rebuild, commit `9e92a339`, which is already claimed by REQ-92 (at `free_coded`). Acceptance items 1–3 were met in code. I couldn't re-attach that SHA to BUG-6 (the gate enforces one-SHA-one-ticket), and re-committing the production code would just duplicate what's in the tree.

But the **one unmet clause was BUG-6's own**: *"Tests named `test_UAT_FC_<this-ticket>_*`."* The existing tests are `test_UAT_FC_REQ-92_*`, so BUG-6 had **zero matrix coverage** and would have been eliminated as drift on the next `test_fix`. That's the honest, non-duplicative free-coding work.

## What I committed

`a4eef9db` — `tests/bug6-signal-not-drop.test.ts` (+ version bump 0.0.177→0.0.178), four `test_UAT_FC_BUG-6_*` UATs, all passing:

- **`no_element_silently_dropped`** — mixed capture → exactly the text leaf + two typed residuals; nothing vanishes.
- **`every_unexpressed_kind_is_a_typed_residual`** — image/field/geometry-less-run each surface with reason + capturedAxes + widths.
- **`gate_surfaces_fold_residuals_separate_from_mispairing`** — drives `cmdL1Gate` end-to-end and asserts `foldResiduals` is a distinct channel/shape from the fidelity probe's residuals. **This is the acceptance clause REQ-92's tests never exercise** (they only call `foldToL1`'s collector directly), so it's genuinely new coverage, not a duplicate.
- **`gate_clean_bundle_emits_no_fold_residuals`** — pure-text oracle → empty gap list.

## Lifecycle completed

- Ticket scoped (`in_progress`) with a note preserving the existing body, explaining the behavior shipped under REQ-92 and this ticket adds the independent UAT lock.
- Tests pass (4/4); test file is type-clean (only pre-existing `.astro` shim noise elsewhere).
- Committed `[FREE-CODED]`, version-bumped, and `move-to-free-coded` recorded SHA `a4eef9db` + version `0.0.178`. Status is now **`free_coded`**.

One note for reconcile: because the production behavior lives in REQ-92's commit and BUG-6's commit is tests-only, BUG-6's matrix coverage rides on REQ-92's code landing. If REQ-92 were ever reverted, these tests would fail — which is the correct coupling given B2 was designed to be "baked into" the REQ-92 rebuild.

<!-- xgd-chat-end -->