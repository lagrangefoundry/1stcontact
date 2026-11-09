---
uid: comment-75d148b6
id: COMMENT-8076
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T06:36:15.210536+00:00'
updated_at: '2026-11-09T06:36:15.210536+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f379333d
  kind: note
---

I wrote one UAT for each of the five new delivery-ladder ACs, and all 5 pass. I didn't touch any runtime code or existing tests.

```
UATs generated for story story-d0a8cfad (plan item 2 of 6)

Story: story-d0a8cfad
Test file(s) created:
  - tests/reconciliation-l1-delivery-ladder.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-delivery-ladder.test.ts"
```

| Test | What it checks |
|---|---|
| `test_UAT_AC2529_…` | `srcset` lists every rendition in ascending order with the original last. `sizes` is checked for the column-anchored, keyframed, fixed and capped-fluid cases. Uncapped fluid and hug get a `srcset` but no `sizes`. The three spellings of the asset path give the same `srcset`; absolute, subdirectory, query and fragment paths get none. `sizes` never appears without `srcset`. Rendering without a manifest, or for a picture not in it, is byte-identical to the plain render. |
| `test_UAT_AC2530_…` | `width`/`height` match the manifest entry, and stay present when no `srcset` survives. They are absent with no manifest, no entry, or a dimension that is 0, negative, NaN or infinite. The stylesheet is unchanged by the manifest. |
| `test_UAT_AC2531_…` | Snapped keyframes give the same rendition at 320 and 640 and a change at 1280. The base rule uses the 320 choice, the only override is at 1280 and it paints the original, and there is no `image-set()`. A full-bleed band overrides at each rung. No manifest, an empty manifest, a single-rendition entry or an empty width ladder all give exactly the plain output. |
| `test_UAT_AC2532_…` | With a scrim, a texture, a gradient and an image, each override is the base `background-image` value with only the image URL swapped, and it restates only `background-image`. The base rule's size, position and repeat lists each have four values. An unsafe chosen rendition falls back to the authored URL, so the image layer is never dropped. |
| `test_UAT_AC2533_…` | An image node carrying `srcset`, `sizes` or `renditions` is refused with an "Unrecognized key" error. Rendition URLs containing `javascript:`, a comma, whitespace or a quote are dropped while the safe ones remain. A background rendition goes through the same `url()` check. A `src` of `/assets/__proto__` gets no ladder. |

**The code doesn't do what AC-2533 says for asset references.** The AC says a delivery key on an asset reference is "refused as an unknown key". But `assetRefSchema` in `packages/site-schema/src/schema.ts:45` isn't strict, so it silently strips an unknown key instead of refusing it. The key never reaches the parsed value, which matches the intent that delivery is not part of the document. I didn't want to weaken the AC's claim, so for asset references the test checks two things: the schema has exactly `{id, src, alt, focalPoint}`, and a delivery key doesn't survive parsing. It does not assert a refusal. If refusal is really intended, `assetRefSchema` needs `.strict()`; otherwise the AC wording should say "discarded". The image-node part of the AC is fully enforced.

**Lint not run:** eslint wasn't installed locally, and fetching it from the npm registry was blocked by the sandbox's network allowlist.