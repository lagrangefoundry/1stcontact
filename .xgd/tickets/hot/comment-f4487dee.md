---
uid: comment-f4487dee
id: COMMENT-4848
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-10-03T19:44:04.337502+00:00'
updated_at: '2026-10-03T19:44:04.337502+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#7` — iteration 7 re-measurement of the half-leading class on joyfulculinarycreations.com (captureSchema 14), with a correction about the overlaps.

**Still open, unchanged:** hero h1 spans at −11px ("Dreaming of healthier meals" ref `renderedTextBox` y 311.30 / ours 300.30; "on your dinner table?" 386.70 / 375.69). Ours places the L1 box at the reference's 97px content-area top (311.30) with a 75.40 line box, so the glyphs sit (97−75.4)/2 = 10.8 higher. Regions #1/#3/#5 = 25889.86 of 36140.73 = **71.64%** of the ranked score, plus 2 CRITICAL `position` deltas. The "What people are saying" full-line-box instance is also unchanged: 3009 → 2963 (−46), regions #4/#7/#8/#11/#12 = **6.32%**, 1 CRITICAL.

**Correction:** earlier comments, and REQ-366's body, counted the 12 hero overlap findings as this ticket's. They are not. The gate's overlap boxes equal the reference's own `multistate.json` boxes at every width (e.g. 320: (20,102.16,234.16×64.08) / (20,158.31,233.08×36)). Line-height is below content height at every width, so the content areas overlap in the reference too. That is a probe defect, appended to **BUG-186**. Landing this ticket's fix should therefore **not** be expected to clear those 12 overlaps; judge it on the position deltas and regions #1/#3/#5.
