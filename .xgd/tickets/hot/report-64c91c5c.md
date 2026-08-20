---
uid: report-64c91c5c
id: REPORT-2354
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-20T03:41:44.457612+00:00'
updated_at: '2026-08-20T03:41:44.457612+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-77b28def
  plan_item_index: '5'
---

Upgrade mutations applied for plan item 5 of 9

**Target Stories**: story-3bf94bd4 (STORY-101 — the edit gesture)
**Primary Story UID**: story-3bf94bd4
**Stories Modified**: 1
**ACs Modified**: 4
**ACs Added**: 6
**ACs Removed**: 0

```yaml
tickets_modified:
  stories:
    - "story-3bf94bd4"
  acceptance_criteria:
    modified:
      - "acceptance_criterion-2d587432"   # AC-1138 — divergence closed, four parameters, asserted on the words
      - "acceptance_criterion-170a171f"   # AC-1050 — a painted panel is no longer a dead end
      - "acceptance_criterion-35907074"   # AC-1123 — the sheet now holds two control families
      - "acceptance_criterion-2f436fa0"   # AC-1001 — the nothing-to-edit example moves off the painted container
    added:
      - "acceptance_criterion-a60fb00d"   # AC-1279 — the colour row opens the palette in pick mode
      - "acceptance_criterion-23edf150"   # AC-1280 — the escalation row to the panel behind the words
      - "acceptance_criterion-2ec6cec9"   # AC-1281 — an empty palette opens as "no colours yet, add one"
      - "acceptance_criterion-4015c803"   # AC-1282 — a locked control is unavailable, with its reason, for both families
      - "acceptance_criterion-f86caf83"   # AC-1283 — an unlocked control carries no note
      - "acceptance_criterion-bf681cf0"   # AC-1284 — tracking reaches the words; the sheet stays chrome
    removed: []
```

**In scope for change**: story-3bf94bd4 and its 34 existing criteria. **Out of scope, left alone**: story-37a3921b (STORY-100, the write path — plan item 4, processed earlier), STORY-113/STORY-114 (the palette command group and its popup — items 1 and 2), STORY-99, STORY-98, and AC-1040 (the box's opening dressing — its claim that the box carries letter-spacing is still true; the "reaches the glyphs" half is the new AC-1284 rather than a rewrite of it).

Three things worth flagging, all recorded in the story's Technical Context rather than absorbed silently:

- **The divergence closed by a different route than it predicted.** STORY-101 predicted the evidence would fail "the day the words are drawn in something that carries" capitalisation. The fix instead re-declared the two inherited properties on the same control, so the outcome matched and the mechanism did not. The story now states both properties as one defect with one cause.
- **The CSS fix predates this bundle.** `builder.css`'s `text-transform: inherit; letter-spacing: inherit` landed on 2026-08-12 with REQ-138's reconcile (`2d46ee15d`); BUG-35's commit in this bundle (`90b762c`) adds only the browser-driven evidence for the tracking half — the half nothing had ever asserted. The matrix documents the behaviour, not the commit, but capitalisation-on-the-words is proven by `tests/reconciliation-copy-edit-live-preview.test.ts` and tracking by `tests/test_UAT_FC_BUG-35_*`, which is why AC-1138 and AC-1284 are separate criteria.
- **AC-1001 was not on the plan's modify list**, but it named "a container" as a worked dead end. Every painted container now exposes `surfaceFill`, and an unpainted one is not a region at all (`l1PaintsSurface` in `packages/framework/src/l1/render.ts:1839`), so the criterion contradicted shipped code and was corrected to the remaining case — a behavior-module instance.

Progress: 5 of 9 plan items complete
