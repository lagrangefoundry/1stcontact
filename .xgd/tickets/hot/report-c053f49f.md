---
uid: report-c053f49f
id: REPORT-1362
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T02:59:24.681942+00:00'
updated_at: '2026-08-06T02:59:24.681942+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-2e4e2c45
---

Done. One new test file, ten UATs, all passing.

**How the ACs map to probes** — the two boundaries are the envelope validator (`validateL1`) and the sole markup/CSS emitter (`renderL1Document`); where an AC asks for the page to be driven, the published page is parsed and driven in jsdom (which implements real same-document fragment navigation and focus, so the click and the focus move are genuine).

Notable findings while grounding the tests:

- **AC-843 scope.** The criterion claims the focus guarantee "holds for every kind that can take the link role", but a linked *image* is enclosed by a classless `<a style="display:contents">`, so the authored ring rule binds to the `<img>`'s identity rather than the focusable element. I followed the AC's own Verification clause (a linked node, its focus rule bound to the identity the published link carries, then driven) across the three **retag** kinds — text run, box, container — and documented in the test that the image enclosure is the story's explicitly declared exception, covered by AC-840. I did not assert the image case either way rather than silently encode the gap as correct.
- **AC-847 error locality.** Zod's strict-shape rejection collapses to `path: "/root"`, `message: "Invalid input"` for a nested node, so the offending node is placed at the root (where `/root` does locate it), and the "property of the vocabulary" claim is additionally proven at the schema level — `l1ControlSchema` / `l1SlotSchema` reject `link` as an unrecognised key, while the identical link validates on text/box/container/image.

**Pre-existing suite state** (unaffected by this file — it adds no runtime code): the full run is `8 failed | 898 passed | 62 skipped` across 7 other files — missing `storage/references/gigabytealchemy.ai` fixtures (`req96`, `bug17`), the font registry check, two 3-probe gate tests, an Astro-container test, and `test_UAT_AC820` in `reconciliation-l1-interaction-and-motion.test.ts`, which fails on the same validator error-path granularity described above.

```
UATs generated for story story-2e4e2c45 (plan item 7 of 12)

Story: story-2e4e2c45
Test file(s) created:
  - tests/reconciliation-l1-navigation.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-navigation.test.ts"
```
