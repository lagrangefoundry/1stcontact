---
uid: report-5cbd5021
id: REPORT-12017
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-11-09T20:36:31.300379+00:00'
updated_at: '2026-11-09T20:36:31.300379+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-0881342c
  anchor_uid: bundle-0881342c
  overrides_audited: 2
  trust_boundary_overrides: 0
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: 
**Anchor**: bundle-0881342c
**Stories Reviewed**: 8 (story-5349d01f, story-d34eccd8, story-d0a8cfad, story-6ccaedd5, story-325da65f, story-ed976856, story-1500b111, story-f2e5032c)

This is a re-review after the fix pass (report-8af7989d) on the previous FAIL (report-02861e9f). It checks each of the nine prior gaps against the ticket, AC and test diffs since ece1bc7e9f, the intent body, the production code, and the scoped quality report REPORT-12016 (report-fca357bb): 219 passed, 0 failed, 0 skipped, lint and build clean.

## Behavior Inventory

The 31 behaviours identified in report-02861e9f stand; the fix pass changed no production code. Rows 6, 10, 12, 17, 18, 22 and 31 were the open ones; their status now:

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 6 | Renditions served immutable; everything else short-lived | Covered | story-d34eccd8 (AC-2528 now active, AC-909) | `test_UAT_AC2528_*` runs a real laddered publish (`imageLadder` with only the Images port faked) and asserts `public, max-age=31536000, immutable` on every `assets/d/` key. It also asserts `public, max-age=60` and no `immutable` on the original `assets/hero.jpg`, `/`, `index.html` and the clean URL `/about`. The AC909 UAT now requests `assets/logo.svg` and a chrome-bearing page (`private, no-store`, no x-robots-tag), so 'all of assets/ immutable' now fails. |
| 10 | Schema unchanged; rendition URLs sanitised | Covered | story-d0a8cfad (AC-2533) | The AC now states what the code does: the strict L1 image node refuses delivery keys and the non-strict `assetRefSchema` strips them (REQ-222: 'assetRefSchema does not change'). The UAT assertion is now unconditional (parse succeeds, keys exactly alt/id/src). |
| 12 | Publish lock, resizing message, progress stream, concurrency 6, 1,200-rendition budget | Uncovered, now FLAGGED | story-5349d01f | The false out-of-scope pointer is removed. A 'Not built, and owned by no story yet' paragraph and Reconciliation Decision 11 record these as decided REQ-222 intent with no code (publishAction unchanged, buildImageLadder sequential, no message string). This matches the flagged treatment of typed `<picture>` sources in story-d0a8cfad. |
| 16 | [images] binding in both environments | Covered | story-6ccaedd5 (AC-2537) | The source-regex half is replaced by `test_UAT_AC2537_the_converter_is_built_from_the_binding_under_the_declared_name`. It parses the TOML, builds the real `imagesHeicConverter` under the declared name, checks that the fake binding is called and its JPEG returned with `shopfront.jpg`, and checks that no binding, or one under another name, yields `null`. |
| 17 | Picker accept list | Covered | story-325da65f (AC-2538 now active) | Asserted from the rendered input: HEIC/HEIF (both extensions and both media types), picture and document formats, no `*`, `multiple` kept, and an off-list `.zip` drop still handed over with its area's role. |
| 18 | Library-route refusal reported, cleared on next handover | Covered | story-325da65f (AC-2539 now active) | Mounted-builder UAT: a two-file handover where one file is refused and the other listed; the origin's sentence shown; cleared by the next successful handover; the fallback used only when the origin gave no reason; a chat-route refusal not repeated in the Library. |
| 19 | Recipe refusals | Covered | story-ed976856 (AC-2542, AC-2544) | The ACs now state that the declared-type cases (not a list, not an object, missing or null `edits`) get the framework's parameter error, not REFUSED. The UAT asserts `(REFUSED)` is absent on those cases and present on the rest. |
| 22 | Renditions outside the swept keyspace | Covered | story-ed976856 (AC-2551) | The orphan sweep is not in this repository. The AC is narrowed to what the repo controls: renditions under `rendition/<tenant>/`, and none in a listing of `t/<tenant>/`. The existing UAT asserts exactly that, and the AC no longer claims to run the sweep. |
| 31 | Rendered preview form posts to the preview lead route | Covered (document-relative), divergence FLAGGED (root-relative) | story-f2e5032c (AC-2515) | The new end-to-end UAT GETs `/preview/<slug>/draft/` through `route()` against real D1/R2. It resolves the rendered `action` against the page URL to `/preview/<slug>/draft/api/lead`, reads the instance id off the rendered hidden input, makes a native POST to the resolved URL, and asserts exactly one contact lands. The edit channel renders no action or method. |

The remaining rows (1-5, 7-9, 11, 13-15, 20-21, 23-30) are unchanged and Covered, as in report-02861e9f. Gap 4's AC renumbering is confirmed in the file:
- `reconciliation-publish-ladder.test.ts`: :149 AC2527, :210 AC2523, :333 AC2524, :360 AC2526.
- `reconciliation-publish-ladder-cloud.workers.test.ts`: :84 AC2527.

The AC2523 test now carries a decodable PNG, so 'keeps its source format' is distinguishable from always-JPEG output.

## Ungrounded Stories

None. The story-5349d01f pointer flagged last time has been replaced by an accurate 'not built' record.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Site Delivery: publish width ladder | story-5349d01f, story-d34eccd8 | ✓ (AC-2523..2527 active; AC-2528 now active with a passing UAT) |
| 2. L1 renderer srcset/sizes/dimensions/backgrounds | story-d0a8cfad | ✓ |
| 3. Ingestion: HEIC at the door | story-6ccaedd5, story-325da65f | ✓ (AC-2534..2537 active; AC-2538 and AC-2539 now active with passing UATs) |
| 4. Image editing recipe / edit_image | story-ed976856 (new) | ✓ |
| 5. Library image modal | story-1500b111 | ✓ |
| 6. Preview submits | story-f2e5032c | ✓ |

No AC on the in-scope stories remains `pending`.

## Supersession Check (Step 4c)

PASS. BUG-78 modifies AC-2504, AC-2505 and AC-2515 in place, and their published-site behaviour still holds. No rewrite in this bundle unambiguously retracts a sibling AC.

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary. Both pass all items.

**report-0712dc13** (code_frozen, story-1500b111, rung 1):
1. `unnamed_files_touched` is empty.
2. Quality passes: REPORT-12016 219/0, after REPORT-12013 214/0.
3. and 6. Every production change is demanded by REQ-220: the scoped `/b/<id>` file-route parser, close and reopen reported through the shell's one close, the change-feed rename with the typing guard, and NAME_REQUIRED as the module's own refusal.
4. The diff stays within the planner's four items plus the ordered AC-1718 expectation updates.
5. `trust_boundary_touched` is false. The notes are test-only. The added markup-inertness UAT strengthens the boundary.

**report-f9c72a40** (code_frozen, story-6ccaedd5, rung 2): only `wrangler.toml` was touched. The change removes the duplicated `[images]` / `[env.production.images]` tables and folds in the REQ-222 rationale with no binding renamed, which matches `tip_evidence` and REQ-221/222. There is no trust boundary.

The `blocked_by_handoff` reports on story-d0a8cfad were ruled declined or denied, not superseded, so there is nothing to audit there.

## Judgment Calls

- **BUG-78 root-relative action: flagged, not absorbed.**
  - The intent ('Decision on finding 1', 2026-09-11; 'Not changed: the contact-form renderer still emits one root-relative action') holds that the one rendered `action` is correct both published and in the preview.
  - The code (`packages/framework/src/modules/contact-form/component.ts:110`) emits the configured action verbatim; REQ-109's `relativizeUrl` (`packages/framework/src/l1/render.ts:157`) is never applied to it. As a result, the operator's own `beta-form` (configured `/api/lead`, per the BUG-78 body) resolves in the preview to the builder's `/api/lead`, which has no lead route (`apps/control-app/src/router.ts:3005` matches only under `/preview/<slug>/draft`).
  - story-f2e5032c's 'Code-issue' section and AC-2515's 'Out of this criterion' paragraph state this divergence explicitly and do not formalise it as intended. The document-relative claim in AC-2515 holds on every page, because `renderSite` keeps pages flat at the snapshot root (render.ts:144-146).
  - Under this review's rules a flagged divergence is not a failure. It is still a real product defect: the form BUG-78 is about does not submit from the preview. The planner hand-off should take it to code, by applying `relativizeUrl` to the form action at the sink or by changing the homepage config to `api/lead`, rather than leave it parked.
- **REQ-222's publish lock, progress stream, concurrency and budget** are decided intent with no code. They are now flagged in story-5349d01f (Decision 11), consistent with how the typed `<picture>` sources are handled. They are not formalised as ACs because there is no code to evidence.
- **AC-2551** is narrowed rather than evidenced by running a sweep, because the sweep is not in this repository. That is legitimate: the property the repo controls (where renditions are written) is asserted behaviourally.
- **Minor, non-failing:**
  - In the AC2515 end-to-end UAT, the edit-channel check (`?? ''`) would pass vacuously if the edit page rendered no form at all; verification 1 of the same AC covers the edit render directly.
  - AC-2531 background box widths, the AC-2546 ambiguous-item write, AC-2547 group names and grant, and the stubbed 409 in AC-2559 are still as noted in report-02861e9f.
  - `tests/test_UAT_FC_REQ-222_width_ladder.test.ts` still exists with non-AC-named tests; that is for the fc-orphan gate.

## Verdict

PASS. All nine gaps from report-02861e9f are closed:
- Every plan item has produced active, UAT-backed ACs.
- Intent/code divergences (the REQ-222 publish experience, BUG-78's root-relative action, typed sources) are flagged in the stories rather than absorbed.
- ACs now claim only what the code does.
- The new UATs enter through real interfaces (route(), the mounted builder, the real publish and ladder) with fakes only at the Images binding and transport boundaries, and they all pass.

A developer reading these stories would have an accurate picture of what the operator intended and of where the code still falls short of it.
