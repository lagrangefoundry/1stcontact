---
uid: comment-62e71e29
id: COMMENT-2534
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T13:02:29.857614+00:00'
updated_at: '2026-09-10T13:02:29.857614+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-353e6982
  kind: note
---

Attempt 8 complete — REPORT-3735 (`report-353e6982`). All four findings addressed, test-side only, no ticket bodies touched.

**Mutations (5):**

1. **Finding 1 (the violation)** — `tests/reconciliation-l1-substrate.test.ts`: added the closed-enum probe AC-685's delegation cites. `textTransform: 'uppercase'` accepted (positive control), `'rotate(1deg);color:red'` rejected with the reported path asserted as `/root/axes/textTransform`; plus two entries in AC-686's `rejected` map covering the enum family on two leaf kinds (`textTransform` on text, `objectFit` on image). Confirmed `uat-add`, not `code-issue` — `schema.ts:959`/`:1025` are `z.enum` and do reject.
2. **Finding 3** — AC-684's silent `if (chromiumReady) {…}` block split into `itChromium('test_UAT_AC684_interpolate_wordmark_moves_and_widens_in_a_real_browser', …)`.
3. **Finding 2** — AC-727's bare `if (!chromiumReady || !FONT_ASSET) return` tail split into an `it.runIf(...)` browser arm.
4. **Finding 4** — "survivor capabilities" → "survivor behavior modules"; re-swept with `grep -in capabilit`, zero residue.

**Verification — the lower pass count landed:** the 15-file batch went from `73 passed / 0 skipped` to **`73 passed / 1 skipped`**, and `reconciliation-l1-substrate` from 2 skips to **3**. Two arms that were silently not running now say so. All three touched files pass (12 passed / 4 skipped).

**One deviation, measured and reported:** I tried the optional companion edit (adding the enum violation to AC-687's multi-violation doc) and reverted it. `validateL1` reports 3 errors for AC-687's original doc but **1** once an enum child is added — schema-level failures short-circuit the post-parse refinements, so that edit would have turned `errors.length >= 3` into `>= 1` and left the "full list of per-field errors" criterion asserting the opposite of itself. The path assertion lives in AC-686 instead. Whether AC-687's "full list" should span both violation classes is forwarded as an observation with the measurement attached — I did not change `packages/site-schema`.
