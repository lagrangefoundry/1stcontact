---
uid: comment-2dff15e4
id: COMMENT-2569
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T17:36:10.181269+00:00'
updated_at: '2026-09-10T17:36:10.181269+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-58cfb44f
  kind: note
---

This call cleared the remaining warnings — **6 mutations**, filed as REPORT-3768 (`report-58cfb44f`) with `needs_more_work: false`, `violations_remaining: 0`.

**Exclusivity backlog, all three fourth-cycle warnings closed**

- **Warning 6** — AC-990 reduced to the full-fidelity readback; the multi-line-control rule now lives only in AC-980, which owns the descriptor shape.
- **Warning 9** — AC-1045 reduced to the read shape (which fields come back, image field only when a background is carried, no other paint parameter). AC-1270 keeps the every-painted-panel rule its title states, plus the write rule and the painted-only-by-a-reference case.
- **Warning 4** — finished with AC-1273, the judgement call: its cross-reader claim is kept but rephrased as a property of the derivation received by whatever reads the answer, rather than a second origin-parity assertion.

**Warning 7 (AC-1122)** — added the negative half the story body gained in today's repair: a size, a weight and a colour have no setting meaning "nothing declared", so those controls change a parameter and never clear one. This matches `writeTypography`, which writes-or-no-ops for `fontSizePx`/`fontWeight` (`packages/site-schema/src/l1/edit.ts:1289-1320`) while only `italic` and `textTransform` delete. Since that widened the AC, I extended its UAT in the same call to prove the asymmetry against the real `1c copy set`.

**Warning 10 (story body)** — AC-980 and AC-990 finally have a parent bullet: "Asking what a region exposes" now states that the words come back whole, never truncated or elided, and that a long or multi-line value asks for a control able to display it in full. Placed with the copy-region content; the body grew by exactly that addition (52,815 → 53,352 chars).

**Verification** — all seven affected suites green: 55 passed. No production code changed in either invocation.

One thing I left deliberately: AC-990's and AC-1045's UATs still assert slightly more than their now-reduced ACs (the textarea widget, the rounded-corner panel). That's over-coverage in a test rather than drift in the tree — both rules are independently proven under the ACs that now own them — so I didn't trim passing assertions. It's noted in the report for the assessor.
