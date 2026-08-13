---
uid: report-cfde9dd0
id: REPORT-1961
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-13T01:41:20.507171+00:00'
updated_at: '2026-08-13T01:41:20.507171+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: request-1ff09fab
---

Done. Everything the review flagged is addressed, and I verified the load-bearing claim myself rather than taking it on trust.

**Verification I ran first** (Chromium, `/tmp/probe-tt3.mjs`): a control with `.fields-control { font: inherit }` inside a box set to `text-transform: uppercase; font-weight:700; font-style:italic; font-size:20px` computes `{tt: "none", fw: "700", fs: "italic", size: "20px"}`. Weight, style and size inherit; capitalisation does not — the `font` shorthand doesn't carry it and the UA resets it on form controls. Confirmed in the installed `webui-fields` (`src/fields.css:183`). The divergence is real.

**Stories modified**
- `story-3bf94bd4` (STORY-101) — "The box follows the sheet" now claims size, weight and italic reach the words, and states capitalisation as a divergence rather than a delivered behaviour. Added a Technical Context bullet giving the mechanism (`font` shorthand + UA reset), stating it is neither a regression nor a decision (the property has been written on the box since the opening dressing), and noting that the covering test asserts both halves so the day it starts working the evidence fails. Also scoped the size-degradation sentence to "a guard, not a criterion", with the reason: `sizeField` (`packages/site-schema/src/l1/edit.ts:372`) gives a run that declares no size **no size control at all**, so there is no gesture reaching that path.

**ACs modified**
- `acceptance_criterion-2d587432` (AC-1138) — retitled to "Size, weight and italic restyle the words…"; criterion scoped to the three axes that arrive; capitalisation recorded as a stated divergence (including that it still *saves* correctly — only the preview is absent); the "off clears" paragraph now uses italic as its worked example. Verification now demands measurement on the element the words are drawn in, and demands the divergence be asserted as a pair (property set on the box **and** copy unchanged).
- `acceptance_criterion-803d7ad9` (AC-1139) — dropped the unasserted degradation clause (Finding 3); everything else untouched.

**Stories created / deleted**: none.

**Code changes** (`tests/reconciliation-copy-edit-live-preview.test.ts` only — no runtime code, per the review):
- Browser half now measures `.builder-modal__box .fields-control` (weight, style, size), driving size through the real gesture too; capitalisation is asserted as the divergence — `uppercase` on the box, `none` on the copy.
- Deleted the `builder.css` regex block and its `rulesOf`/`BUILDER_CSS` helpers (source inspection, and the thing that let the defect pass).
- Header docblock and inline comments updated; test renamed to `test_UAT_AC1138_size_weight_and_italic_restyle_the_words_as_confirmed_and_write_nothing`.

**Mutation check**: flipping the new capitalisation assertion to `'uppercase'` fails with `expected 'none' to be 'uppercase'` — so the browser half genuinely executes and the assertion discriminates. Restored, then re-ran: this suite 3 passed; with `reconciliation-copy-edit-typography` 12 passed.

**Confidence**: high on Findings 1 and 2 — both remediations are done exactly as prescribed and the evidence is now measured on the copy. Moderate on Finding 3: I dropped the clause rather than asserting it, which the review offered as an option, and recorded in Technical Context why the path is unreachable through the operator's interface — if the next reviewer prefers assertions there, it would need a fixture change and arguably a code-shaped answer.
