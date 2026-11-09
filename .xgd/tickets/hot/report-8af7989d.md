---
uid: report-8af7989d
id: REPORT-12015
type: report
title: 'Fix reconciliation review: bundle-0881342c'
created_by: xgd
created_at: '2026-11-09T20:27:22.470028+00:00'
updated_at: '2026-11-09T20:27:22.470028+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-0881342c
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-5349d01f (STORY-94), gap 1: the false out-of-scope pointer ("concurrency, budget, progress belong to the other stories REQ-222 touches") is gone. A new "Not built, and owned by no story yet" paragraph and Reconciliation Decision 11 flag these as REQ-222 intent that was decided but not built (a code-issue, not retracted): the builder lock (`inert` / `role=status`), the "First-time publication…" message, the `text/event-stream` progress stream with its required terminal frame, failure reporting that outlives the lock, concurrency of 6, and the 1,200-rendition budget refused before `writeRevision`. Verified against code: `publishAction` is unchanged, `buildImageLadder` is sequential, the message string appears nowhere, and `/api/publish` returns plain JSON.
- story-f2e5032c (STORY-177), gap 9: appended a code-issue note. The contact form emits its `action` verbatim (no `relativizeUrl`), so only a document-relative `api/lead` reaches `/preview/<slug>/draft/api/lead`. A root-relative `/api/lead` resolves to the builder's root, which has no lead route.
- AC-2528, gap 2: pending → active, with new UAT `test_UAT_AC2528_a_delivery_rendition_is_immutable_and_nothing_else_is`. A real laddered publish runs; every `assets/d/` rendition is served `public, max-age=31536000, immutable`; the original under `assets/`, `/`, `index.html` and a clean-URL page keep `public, max-age=60` and are not immutable.
- AC-909, gap 2: the verification now names an original asset under `assets/` and a page carrying account chrome. The UAT now requests `assets/logo.svg` (short lifetime, not immutable) and a chrome-bearing page (`private, no-store`, not immutable, no x-robots-tag).
- AC-2538, gap 3: pending → active, with new UAT `test_UAT_AC2538_the_picker_names_heic_and_the_formats_read_and_never_says_image_wildcard`. It checks the rendered input's accept list has HEIC/HEIF and the picture and document formats, has no `image/*`, keeps `multiple`, and that a file type not on the list still hands over when dropped.
- AC-2539, gap 3: pending → active, with new mounted-builder UAT `test_UAT_AC2539_a_library_route_refusal_is_reported_in_the_library_and_cleared_by_the_next_handover`. Covered: the origin's sentence for the refused file; the accepted file is listed; the notice clears on the next handover; the generic fallback is used only when there is no reason; a chat-route refusal is not repeated in the Library.
- AC-2523/2524/2526/2527, gap 4: the publish UATs are renamed to the right ACs:
  - :207 → AC2523
  - :310 → AC2524
  - :337 → AC2526
  - :146 → AC2527
  - cloud :84 → AC2527

  The file headers are corrected. The AC2523 test gains a decodable PNG, and it asserts PNG renditions are named `.png`, rendered as `image/png` and come from the PNG's own bytes, separate from the JPEG ladder.
- AC-2533, gap 5: reworded to what the code does. An image node refuses delivery keys (strict schema). An asset reference strips them, because the schema is deliberately unchanged per REQ-222. The UAT now asserts the parse succeeds and the key is absent, where before it only asserted that conditionally.
- AC-2537, gap 6: the source-regex half is replaced by a behavioural UAT, `test_UAT_AC2537_the_converter_is_built_from_the_binding_under_the_declared_name`. A binding under the name declared in the TOML yields a converter that calls it. No binding, or a binding under a different name, yields none. The AC text is updated to match.
- AC-2542 / AC-2544, gap 7: the AC text now states the two declared-type refusals (not a list, not an object) and the missing or null `edits`. These are framework parameter errors at the assistant boundary, not REFUSED. The AC-2544 UAT now also asserts that declared cases do not carry `(REFUSED)`.
- AC-2551, gap 8: the orphan sweep does not exist in this repository (it is not in control-app src or the generated ticketing bundle), so it cannot be run. The title and body are reworded: renditions sit outside the `t/<tenant>/` keyspace the sweep lists, and listing that keyspace holds no rendition. The existing UAT asserts exactly this.
- AC-2515, gap 9: new end-to-end UAT `test_UAT_AC2515_the_rendered_draft_preview_form_resolves_to_the_preview_lead_route_and_lands_a_lead`. It GETs `/preview/<slug>/draft/` through `route()` and resolves the rendered form's `action` against the page URL, asserting `/preview/<slug>/draft/api/lead`. It reads the instance id off the hidden input, then makes a native POST to the resolved URL, and exactly one lead lands. It also checks the edit-channel form has no action and no `method`. The AC text is corrected: the action is emitted verbatim and the document-relative form is pinned; the root-relative case is stated as out of scope.
- AC-2529 (minor): the renderer does not sort `srcset`; it keeps the manifest's order, which the ladder writes ascending. The AC now says "in manifest order".

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor. Note for the later gate: `tests/test_UAT_FC_REQ-222_width_ladder.test.ts` still exists, and its it() names are not AC-named.

## Code changes
Test files only; no production code was touched:
- tests/reconciliation-published-site-serving.test.ts: new AC2528 UAT, AC909 extended
- tests/reconciliation-upload-overlay.test.ts: new AC2538 and AC2539 UATs; the mount double now serves a mutable list
- tests/reconciliation-publish-ladder.test.ts: AC renumbering, plus the PNG format case
- tests/reconciliation-publish-ladder-cloud.workers.test.ts: AC renumbering
- tests/reconciliation-l1-delivery-ladder.test.ts: AC2533 strip assertion made unconditional
- tests/reconciliation-ingestion-images-binding.test.ts: source regexes replaced by a behavioural converter UAT
- tests/reconciliation-image-editing-recipe.workers.test.ts: AC2544 asserts no REFUSED on the declared cases
- tests/test_reconciliation_preview_lead_capture.workers.test.ts: new end-to-end AC2515 UAT

Not run here, per instructions: the tests themselves. Lint also did not run, because the sandbox blocks the npm registry.

## Production-code finding (not fixed; code frozen)
The contact form emits its configured `action` verbatim, so a root-relative `/api/lead` in the draft preview resolves to the builder's own `/api/lead`, which is not a lead route. The same applies to a published site under `/site/<key>/`. Only document-relative `api/lead` works in both places, and that is what the new UAT pins. Whether the renderer should relativize a form `action` the way it does `src` and `href` is a decision for the planner and operator.

## Minor items not addressed
- AC-2531: background box widths
- AC-2546: the ambiguous item is left unwritten
- AC-2547: group names and grant
- AC-2559: stubbed 409

The review classed these as non-failing on their own.

## Confidence
Moderate to high that the matrix findings pass on re-review. All nine gaps were acted on: each AC now claims only what the code does, and every pending AC in plan items 1 and 3 is active with a UAT. The main risk is the new UATs, which were not executed in this session. AC2539 (mounted builder: list-row selector, refresh timing) and the end-to-end AC2515 (preview GET of a slotted contact form in workerd) depend on rendering details I checked statically, not by running them.
