---
uid: story-47fb84e6
id: STORY-158
type: story
title: 'The Assistant Can Compare And Judge: Perceptual Comparison And Fidelity Verdicts
  Over Any Two Pictures'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:16.482074+00:00'
updated_at: '2026-10-27T21:13:36.670589+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-5607a08d
  capability_uid: capability-00e77e55
  story_kind: feature
  story_points: 2
---

## Story
**As a** client working with the consultant on a site, **I want** the assistant to measure the difference between any two pictures of a site and to judge a reproduction against a captured reference with a named verdict, **so that** it can tell me, in the same terms as the platform's own diff and gate tools, whether what it built matches what I showed it and what to do next.

## Description
This builds on the read-only fidelity surface (story-58b2cec4, "The Assistant Can See"). That story gives the assistant the picture-source vocabulary and `screenshot`. This story adds the two judging operations:

- **compare(a, b)** takes any two picture sources (captured reference, draft, edit channel, published revision, URL) in any combination. It returns the perceptual verdict `1c diff` returns for the same pair: both sides anchored top-left and cropped to their common rectangle, the size actually compared, mean difference, percent of pixels over threshold, banded profile, and ranked difference regions as coordinates. Each side carries a label naming which picture it was.
- **check_fidelity(actual, reference)** judges a reproduction picture against a named captured reference. It runs the structural gate, the reference-coverage proxies, the perceptual comparison and the value gates, then reconciles them exactly as `1c gate` does. It names one of five verdicts (`pass`, `structural-failure`, `capture-incomplete`, `reproduction-wrong`, `unexplained-disagreement`), each with its own diagnosis and next step. The reference side is read at the viewport the actual side asked for. A bundle with no ladder member at that width falls back to its full-page shot and labels the picture as a fallback.

In scope: verdict equality with the CLI, cropping, viewport following, fallback labelling, the five verdicts and their distinct next steps, and refusing an unknown reference by name.

Out of scope: `capture_site` and the egress guard (plan item 6); `screenshot`, picture resolution, read-only guarantees and the grant (story-58b2cec4); heatmap rasters and crop-triptych files, which `1c diff` writes for an operator and this surface deliberately does not return.

## Technical Context
- Intent: REQ-157 (bundled in BUNDLE-32), ACs 4 and 5 plus the "Behaviour the build settled" section (common-rectangle crop, reference follows the actual viewport, labelled ladder fallback, five verdicts with distinct next steps).
- The reconciliation is shared by construction. The CLI `1c gate` and `check_fidelity` call the same gate reconciliation, so the CLI is a caller of it rather than its owner. That extraction is a refactor and leaves the `1c gate` story (STORY-86) and the `1c diff` story (STORY-77) unchanged.
- `compare` uses the same crop-then-diff core as `1c diff`, so the two agree by construction.
- Both operations are declared `effect: read` with `provenance: untrusted` returns. Neither can change a site (asserted under story-58b2cec4).
- The surface is bound to one site at construction, so no picture names a slug.
- Evidence: `tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts`, describe blocks "REQ-157 AC4" and "REQ-157 AC5".

## Reconciliation Decisions
- **Regions as coordinates instead of crop pairs** (decided at reconciliation, 2026-10-27): REQ-157's operations table is marked *provisional* and lists `compare` returning "perceptual verdict, ranked regions, crop pairs". The binding AC 4 asks only that the verdict equal `1c diff`'s. The landed code returns ranked regions (rank, area, mean difference) and deliberately omits the heatmap and crop-triptych files, because they are operator files with no meaning on this surface and no filesystem exists in a Worker. Formalized as AC-2036. This is not a contradiction: the provisional table was superseded by the AC.
- **Unknown reference refused by name before any browser is used** (decided at reconciliation, 2026-10-27): intent is silent. The code refuses `check_fidelity` against a reference name that holds no capture, before any gate or browser work runs. The error is the bundle reader's `Bundle '<name>' has no capture.json.`, which names the reference. It does not point at `list_references`: check_fidelity's own not-found wording is shadowed because the bundle reader throws first. Formalized as AC-2043 because a metered browser lease for a typo is a real cost and the error is what the model acts on.
- **The `pass` next step still points at outstanding value deltas** (decided at reconciliation, 2026-10-27): intent says each verdict has its own next step. The code's `pass` next step says nothing is outstanding when there are no value deltas. When deltas remain, it names their count and directs the reader to work them. Formalized within AC-2040.

## Dependencies
- Plan item 4: story-58b2cec4 (fidelity surface: the assistant can see — picture vocabulary and surface composition).

## Story Points
2