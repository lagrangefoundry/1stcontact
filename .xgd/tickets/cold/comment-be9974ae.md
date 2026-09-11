---
uid: comment-be9974ae
id: COMMENT-256
type: comment
title: Comment on request REQ-86
created_by: xgd
created_at: '2026-07-21T20:23:09.032048+00:00'
updated_at: '2026-07-21T20:38:47.124650+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-58e96ad1
  kind: chat_transcript
---

<!-- xgd-turn id="3ff72f70-639f-4db2-887b-bbd18541837a-user" -->

<!-- xgd-chat role="user" ts="2026-07-21T20:23:06.915030+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="3ff72f70-639f-4db2-887b-bbd18541837a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-21T20:38:47.094158+00:00" -->
#### Claude
I'll start by reading the current ticket state and understanding the codebase structure for this end-to-end validation work.

Let me look at the capture types, the index exports, and the req82 test to nail the patterns.

I now have a full picture. Let me set up task tracking, scope the ticket, then build.

The pipeline pieces exist: `foldToL1` (capture→L1 + oracle), `renderL1Document` (the emitter), `captureL1`/`roundTripReport` (round-trip spine). What REQ-86 needs is the **end-to-end 3-probe gate** plus the **demand-driven flow promotion** (structure recovery), with UATs. Let me first record the scope on the ticket.

Now let me build the probes module.

Let me clean up two rough spots: the duplicate `Ctx` interface / no-op line, and the convoluted container re-insertion logic.

Now fix the ctx initialization and the container re-insertion logic:

Now export from the l1 index:

I need to refine two things before tests: make text-height scaling fractional (not `.repeat`), and let the gate check fidelity on the absolute base while checking the envelope probes on the structure-recovered doc (the "absolute-base, structure-overlay" split). Let me update:

Now update `threeProbeGate` to check fidelity on the base but the envelope probes on the recovered doc:

Now the tests. Let me write the end-to-end UAT that folds a capture fixture and runs all three probes plus the demand-driven promotion discriminator:

Let me verify the `ValueManifest` shape I used in the fixture matches, then run the tests.

My fixture manifest shape matches. Let me run the new tests:

`text` nodes have no `sizing` field (only image/box/container do) — adding it fails `.strict()`. A `<p>` fills its container naturally, so I just drop geometry:

The fixture was physically implausible: fixed y-positions with long text that wraps to 3 lines at narrow widths overruns even at rest. Real short runs at those y-positions stay one line. Let me use short runs so the base is genuinely sane at rest (perturbation is the discriminator):

All 4 UATs pass. Now let me run the regression scope — the adjacent L1 tests and a typecheck — to ensure nothing broke:

Now a clean typecheck across the workspace (my memory notes green vitest ≠ typecheck-clean — stale dist can mask type drift):

Code and types are clean, all UATs pass. Let me bump the version and commit the code (the free-coded part), then handle the docs.

Code is `free_coded`. Now the docs. Let me pull the current DOC-19, DOC-15, DOC-16.

I have the full 604-line module-era DOC-19. Per the ticket I'll rewrite it for the L1 world — keep the value model + gate methodology (they operate on rendered pixels/DOM and are module-agnostic), replace the section→module/variant/dial procedure with the L1 pipeline + 3-probe gate, and supersede the module catalog. I'll do this as an authoritative L1 front section plus a superseded banner on the module-era catalog (the house style used across DOC-7/9/14), preserving the hard-won methodology below.

Now DOC-15 and DOC-16 — concise L1-world update notes appended (both predate the pivot):

Both docs updated (auto-committed by the ticketing API). Let me verify the working tree and record the docs completion on the ticket, then do a final full-suite sanity check on the touched area.

Let me append a handoff note so the ticket body reflects the final delivered state:

Done. Here's what I delivered for **REQ-86 — end-to-end reproduction, gated by the 3-probe acceptance**.

## What it does

REQ-86 is the "do last" validation of the pivot pipeline: **capture → L1 → AI structure recovery → render**, gated by three probes. The pipeline pieces already existed (`foldToL1` for capture→L1+oracle, `renderL1Document` as the one emitter, the round-trip spine). What was missing — and what I built — is the **acceptance gate** plus the **demand-driven structure recovery**.

**`tools/generate/src/l1/probes.ts`** (free-coded, sha `b7d32cce`, v0.0.167):
- **`evaluateLayout`** — an analytic, browser-free layout evaluator that mirrors exactly what the renderer emits (absolute `interpolate|snap` geometry + CSS flow stacking) and estimates text natural height so content perturbation is expressible. Being analytic makes every probe deterministic and *always-run*, not a Chromium skip.
- **The 3 probes** — `sampleFidelityProbe` (vs the retained oracle at the 6 captured widths), `offSampleProbe` (envelope holds at 500/900px), `contentRobustnessProbe` (envelope holds under 2.5× content).
- **`threeProbeGate`** — the absolute-base / structure-overlay split: fidelity on the base, envelope probes on the recovered overlay.
- **`promoteToFlow`** — demand-driven recovery: wraps **only** the pinned sibling groups that fail content-robustness into flow `stack` containers, leaving passing regions absolute.

**Tests** (`tests/req86-e2e-repro.test.ts`, all green): the three acceptance probes, plus a discriminator UAT proving content-robustness **fails** on the pinned base and **passes** after demand-driven promotion — and that the gate is non-vacuous (fails without recovery).

**Docs:** DOC-19 rewritten for the L1 world (L1-pipeline header + 3-probe gate; value model & gate methodology kept; module catalog superseded but preserved as history); DOC-15 and DOC-16 given L1-world update notes.

## Verification
- L1 family (req82–86) green; `tsc --noEmit` clean on generate / site-schema / framework.
- Ticket at `free_coded`, commit + version recorded, story_points=4, body reflects the delivered state.

The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours to trigger when you've validated it.

<!-- xgd-chat-end -->