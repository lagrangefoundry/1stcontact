---
uid: report-5050fa64
id: REPORT-1352
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-06T02:17:59.580034+00:00'
updated_at: '2026-08-06T02:17:59.580034+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d2b5cb1c
---

Only the new test file is added — no runtime code, no existing tests touched.

```
UATs generated for story story-d2b5cb1c (plan item 4 of 12)

Story: story-d2b5cb1c
Test file(s) created:
  - tests/reconciliation-l1-interaction-and-motion.test.ts

Tests written: 10
Tests passed: 9
Tests failed: 1
```

⚠️ TESTS FAILING — downstream fix-it loop required

**Failure:**
- `test_UAT_AC820_interaction_and_entrance_admit_typed_values_only` — AC-820 requires every refused interaction/entrance declaration to be reported with "the offending field path and why it was refused". 10 of its 16 refusal classes do; 6 do not.

**Diagnosis (code diverges from AC — not a weak test).** The six failing classes are exactly those caught by the *shape* check rather than the envelope: an unrecognised key (`selector`, `css`, `keyframes`), an undefined state name (`active`), and a raw timing function on either axis. `l1NodeSchema` (`packages/site-schema/src/l1/schema.ts:1148`) is a plain `z.union` of the six node kinds, and a Zod union failure collapses to one issue at the union's own path — so all six report `/root` — `"Invalid input"`, naming neither the field nor the reason.

The information is discarded, not missing: parsing the same values against `l1BoxSchema` directly yields `interaction/hover` — `Unrecognized key: "selector"`, `interaction` — `Unrecognized key: "active"`, and `interaction/transition/easing` — `Invalid option: expected one of "linear" | … | "ease-in-out"`. The union is discriminated by `kind` in fact but not in type; `z.discriminatedUnion('kind', …)` would route to the matching branch and surface its issues verbatim. This diagnosis is recorded in the test file's header comment.

The assertion is left as the AC specifies and is deliberately no stricter — it accepts an unrecognised key being reported against its *enclosing* object with the key named in the message.

**Notes on the other nine:**
- Two tests observe a real page (AC-825, AC-826). Only the browser is stubbed — layout and `IntersectionObserver`. AC-826 models a real user agent by computing intersection from the `rootMargin` the driver actually declares, then jumps the scroll position in one step; bands 2–6 are asserted never to be partially visible at either position, and still settle. Pre-entrance appearance is observed by asking a real selector engine whether the gated rule matches (JSDOM's `getComputedStyle` silently ignores the `html[data-l1-motion] … :not(.l1-in)` rule, so it is not usable here).
- Three earlier failures were my own test bugs and are fixed: `l1-rv` counted inside the driver script, `'200'` matching the fixed `200000px` root margin, and `translate` matching the hover's `transform: translate(…)`.
- The adjacent suites (`req99`, `req100`, `reconciliation-l1-shared-axis-groups`, `req82-l1-substrate`, `naming`) all pass unchanged.
