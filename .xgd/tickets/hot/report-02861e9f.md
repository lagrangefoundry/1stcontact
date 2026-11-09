---
uid: report-02861e9f
id: REPORT-12014
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-09T20:16:02.094832+00:00'
updated_at: '2026-11-09T20:16:02.094832+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0881342c
  anchor_uid: bundle-0881342c
  overrides_audited: 2
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: 
**Anchor**: bundle-0881342c
**Stories Reviewed**: 8 (story-5349d01f, story-d34eccd8, story-d0a8cfad, story-6ccaedd5, story-325da65f, story-ed976856, story-1500b111, story-f2e5032c)

## Behavior Inventory

31 behaviours identified across the seven behavioural commits (923fa442, 12ffdb23, 82467050, 809d4ac2, 8168e001, c29be3d0, 1276ffa7).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Ladder built at publish via Images binding into revision out/assets/d/ | Covered | story-5349d01f (AC-2523) | UAT misnamed (see gap 4) |
| 2 | Rungs strictly below source, never upscaled, <=320 gets none | Covered | story-5349d01f (AC-2524) | UAT misnamed |
| 3 | Content-addressed renditions, tenant cache, zero transforms on republish | Covered | story-5349d01f (AC-2525) | |
| 4 | Draft and no-binding/CLI publish build no ladder | Covered | story-5349d01f (AC-2526) | UAT misnamed |
| 5 | Store-port parity; manifest is render input only | Covered | story-5349d01f (AC-2527) | UAT misnamed |
| 6 | Renditions served immutable; everything else keeps short cache | Partial | story-d34eccd8 (AC-2528 pending, AC-909) | AC-2528 pending with no UAT; AC-909 never requests an original asset |
| 7 | srcset/sizes on img from manifest | Covered | story-d0a8cfad (AC-2529) | |
| 8 | width/height from measured dimensions | Covered | story-d0a8cfad (AC-2530) | |
| 9 | Background per-width rules, smallest rung base, layer stack kept | Covered | story-d0a8cfad (AC-2531, AC-2532) | |
| 10 | Schema unchanged; rendition URLs sanitised | Partial | story-d0a8cfad (AC-2533) | AC says delivery keys are refused; code strips them (gap 5) |
| 11 | <picture> with typed WebP sources | Uncovered (flagged) | story-d0a8cfad | Correctly flagged as code-issue / outstanding intent |
| 12 | Publish lock, resizing message, determinate progress stream, bounded concurrency, rendition budget refusal | Uncovered, NOT flagged | — | Intent says 'Built, 2026-09-12'; code on branch and on main has none of it; story-5349d01f claims other stories own it (gap 1) |
| 13 | HEIC ftyp detection and JPEG conversion before material creation | Covered | story-6ccaedd5 (AC-2534) | |
| 14 | AVIF left alone; non-HEIC byte-for-byte | Covered | story-6ccaedd5 (AC-2535) | |
| 15 | Three distinct refusals, nothing written | Covered | story-6ccaedd5 (AC-2536) | |
| 16 | [images] binding in both environments | Covered | story-6ccaedd5 (AC-2537) | Part of UAT is source inspection (gap 6) |
| 17 | Picker accept list (names HEIC, no image/*) | Partial | story-325da65f (AC-2538 pending) | No UAT (gap 3) |
| 18 | Library-route refusal reported, cleared on next handover | Partial | story-325da65f (AC-2539 pending) | No UAT (gap 3) |
| 19 | Recipe vocabulary, refusals, ordered compile with dimension tracking | Covered | story-ed976856 (AC-2540..2546) | AC-2542/2544 wording vs behaviour (gap 7) |
| 20 | image surface, edit_image / list_image_edits, site assets refused | Covered | story-ed976856 (AC-2546, AC-2547) | |
| 21 | /api/material/file current, ?original=1, ?width= | Covered | story-ed976856 (AC-2548, AC-2549, AC-2550) | |
| 22 | Renditions under rendition/<tenant>/ outside orphan sweep | Partial | story-ed976856 (AC-2551) | Sweep never exercised (gap 8) |
| 23 | Assistant screenshot shows edited picture | Covered | story-ed976856 (AC-2552) | |
| 24 | Image modal from Library pane (button, keyboard) | Covered | story-1500b111 (AC-2553) | |
| 25 | Same modal from chat, scoped and unscoped URLs | Covered | story-1500b111 (AC-2554) | |
| 26 | picture-kind predicate; captures/drawings refused | Covered | story-1500b111 (AC-2555) | Drawing name-only modal deferred and recorded |
| 27 | Editable Library name, one field, feed guard, NAME_REQUIRED | Covered | story-1500b111 (AC-2556, AC-1718) | |
| 28 | Four tools commit recipe, re-fetch; undo/redo; refusals | Covered | story-1500b111 (AC-2557..2559) | |
| 29 | Preview lead route via shared handleLead, slug tenant | Covered | story-f2e5032c (AC-2560, AC-2504) | |
| 30 | Draft definition, channel provenance, identified bypass not obtainable by request | Covered | story-f2e5032c (AC-2561..2563, AC-2505) | |
| 31 | Rendered preview form actually posts to the preview lead route; edit channel refuses | Partial | story-f2e5032c (AC-2515) | End-to-end action resolution not pinned (gap 9) |

## Ungrounded Stories

| Story | Claim | Issue |
|-------|-------|-------|
| story-5349d01f | Out of scope: 'the ladder's concurrency and budget, and the publish's progress reporting belong to the other stories REQ-222 touches' | No story documents them, and no code on this branch implements them. The pointer is false and hides an intent/code divergence. |

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Delivery: publish width ladder | story-5349d01f, story-d34eccd8 | Partial: STORY-94 done; STORY-95 immutable-caching AC-2528 still pending, no UAT |
| 2. L1 renderer srcset/sizes/dimensions/backgrounds | story-d0a8cfad | ✓ |
| 3. Ingestion HEIC at the door | story-6ccaedd5, story-325da65f | Partial: STORY-140 done; STORY-145 AC-2538 and AC-2539 still pending, no UAT |
| 4. Image editing recipe / edit_image | story-ed976856 (new, STORY-178) | ✓ |
| 5. Library image modal | story-1500b111 | ✓ |
| 6. Preview submits | story-f2e5032c | ✓ |

## Supersession Check (Step 4c)

PASS. BUG-78 modifies AC-2504, AC-2505 and AC-2515 in place. Their published-site behaviour still holds, so nothing is superseded. No other rewrite in this bundle retracts a sibling AC.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary. Both pass.
- report-0712dc13 (code_frozen, story-1500b111, rung 1). Production edits are confined to the named builder files and `unnamed_files_touched` is empty. Each change is demanded by REQ-220:
  - the /b/<id> parser fix (Answered from EPIC-1, 2026-09-11);
  - the change-feed name guard (§8);
  - close/reopen through the shell's one close;
  - NAME_REQUIRED, the module's own refusal.

  Test edits are the AC-1718 expectation updates the planner ordered, plus one added markup-inertness UAT. `trust_boundary_touched` is false. The quality report REPORT-12013 passes 214/0.
- report-f9c72a40 (code_frozen, story-6ccaedd5, rung 2). Only `apps/control-app/wrangler.toml` was touched. It removes the duplicated [images] and [env.production.images] tables and folds in the REQ-222 rationale, with no binding renamed. This matches REQ-221 and REQ-222 (declared on both sides). No trust boundary.

## Gaps (for fix_reconciliation_review)

1. **Unflagged intent divergence (REQ-222, story-5349d01f).**
   - Intent: REQ-222's 'Operator decision, 2026-09-11' and 'Built, 2026-09-12' sections make these deliverables: the builder lock (`inert`, `role=status`, nothing dimmed); the 'First-time publication of images requires resizing…' message shown only when renditions must be built; a determinate progress stream on POST /api/publish selected by `Accept: text/event-stream`, where a terminal frame is required and a stream that ends without one is a failure; failure reporting that outlives the lock; bounded concurrency of 6; and a 1,200-rendition budget refused before writeRevision.
   - Code: none of this exists in this bundle's commits or on main (`toolbar.js` publishAction unchanged; `ladder.ts` sequential; no 'First-time publication' string anywhere).
   - Story: story-5349d01f's Out-of-scope says these 'belong to the other stories REQ-222 touches'. No story covers them.
   - Fix: correct that sentence, and add a Reconciliation Decisions entry to story-5349d01f flagging these as decided-but-unbuilt intent (a code-issue, not retracted), as story-d0a8cfad already does for typed sources.
2. **AC-2528 (story-d34eccd8, plan item 1) is `pending` with no UAT.** Activate it with a UAT that:
   - requests a content-addressed rendition under assets/d/ and asserts `immutable, max-age=31536000`;
   - requests an ORIGINAL picture under assets/ and asserts the short lifetime and no `immutable`.

   Also extend AC-909's UAT (`tests/reconciliation-published-site-serving.test.ts:467-468`, which requests only `/` and `theme.css`). It should request an original asset and a page with account chrome for the x-robots-tag check its verification names. As written, marking all of `assets/` immutable would pass.
3. **AC-2538 and AC-2539 (story-325da65f, plan item 3) are `pending` with no UAT.** The accept list (names HEIC/HEIF, no `image/*`) and the Library-route refusal notice (origin's sentence, not duplicated for a chat refusal, cleared at the next handover) need activating with builder-DOM UATs.
4. **Publish UATs carry the wrong AC numbers** (`tests/reconciliation-publish-ladder.test.ts`, header at :17; `tests/reconciliation-publish-ladder-cloud.workers.test.ts`, header at :13). Per-AC pass evidence is attached to the wrong criterion for four of five ACs. Rename as follows:
   - the test at :207 → AC2523;
   - the test at :310 → AC2524;
   - the test at :337 → AC2526;
   - the tests at :146 and cloud :84 → AC2527.

   Also add a non-JPEG (PNG) laddered picture so the 'rendition keeps its source format' claim of AC-2523 is distinguishable from always-JPEG output.
5. **AC-2533 says an asset reference carrying srcset/sizes/renditions is 'refused as an unknown key'.** `assetRefSchema` (`packages/site-schema/src/schema.ts:45`) is a non-strict z.object, so it strips rather than refuses. The UAT (`tests/reconciliation-l1-delivery-ladder.test.ts:406-409`) passes on stripping. Fix whichever is wrong:
   - if the intent is 'schema unchanged', reword the AC to what the code does (delivery keys never reach the document or the render);
   - otherwise assert refusal.

   Do not let the AC claim refusal that the code does not perform.
6. **AC-2537's UAT asserts by source inspection** (`tests/reconciliation-ingestion-images-binding.test.ts:49-53`, regexes over router.ts and heic.ts). Replace the 'it is the name the upload path reads' half with a behavioural assertion, for example a route call with `env.IMAGES` set versus unset showing conversion versus the no-binding refusal. Alternatively, drop that claim from the AC since AC-2534 covers it behaviourally.
7. **AC-2542 and AC-2544 say every malformed recipe is refused with REFUSED.** The UATs accept the framework's parameter error for a missing `edits` and for not-an-object/not-a-list (`tests/reconciliation-image-editing-recipe.workers.test.ts:437, :507-508, :539`). Align the AC text with the observed behaviour, or make the code answer REFUSED.
8. **AC-2551 claims renditions survive the orphan sweep, but its UAT never runs the sweep** (`tests/reconciliation-image-editing-recipe.workers.test.ts:874-884`, prefix reasoning only). Run the material orphan sweep and assert the rendition key still exists.
9. **AC-2515 / BUG-78 end to end.** No UAT renders GET /preview/<slug>/draft/… and checks that the contact form's action resolves to /preview/<slug>/draft/api/lead. That resolution relies on `relativizeUrl` (`packages/framework/src/l1/render.ts:157`). If it broke, the preview button would post to the builder's /api/lead and every current test would still pass. Add that assertion.

Minor (not failing on their own; worth fixing in the same pass):
- AC-2529: the fixture manifest is already ascending, so sorting is unproven.
- AC-2531: the column-anchor, fixed-px and capped-fluid background box widths are untested.
- AC-2546: the ambiguous Library item is not checked for being unwritten.
- AC-2547: the group names and the grant are not asserted.
- AC-2559: a 409 with no body is simulated by a stubbed saveRecipe.

## Judgment Calls

- Typed `<picture>` sources are absent from the code but correctly flagged in story-d0a8cfad as outstanding intent, so they are not a failure here.
- The REQ-229 seam (a recipe does not reach the published site) is recorded in story-ed976856, story-1500b111 and story-5349d01f as a known gap. That is acceptable.
- HEIC conversion not running in production (the account is not Enterprise) is recorded in story-6ccaedd5. That is acceptable.
- Drawings stay out of the modal until they have catalogue entries; this is recorded as a decision in story-1500b111. That is acceptable.
- Gap 1 is material. The operator called progress reporting 'a deliverable rather than a nicety'. A reader of STORY-94 would believe another story covers it, which is the silent absorption this review exists to catch.

## Verdict

FAIL. Coverage gaps and evidence gaps were found:
- REQ-222's publish lock, progress, concurrency and budget are neither built nor flagged, and are misattributed by story-5349d01f.
- AC-2528, AC-2538 and AC-2539 from plan items 1 and 3 are still pending with no UATs.
- The publish UATs are misnumbered.
- AC-2533 and AC-2542/2544 claim behaviour the code does not have.
- AC-2537 uses source inspection.
- AC-2551 and AC-2515 have unproven claims.

The fix loop should address gaps 1-9.
