---
uid: comment-656dda63
id: COMMENT-64
type: comment
title: Comment on doc DOC-21
created_by: xgd
created_at: '2026-07-08T18:38:16.608868+00:00'
updated_at: '2026-07-08T18:38:16.608868+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: doc-27a1e5be
  kind: note
---

**Terminology correction (operator).** This doc must not imply that an interactive free-coding session authors capability-matrix artifacts. In XGD, **capabilities are groupings of stories** (not specifications); **stories carry ACs that must cover them**; and **capabilities / stories / ACs / UAT-coverage are created by reconciliation (or the automated dev process), never by free-coding.** A free-coding session produces: a *requirement* described on a REQ ticket + code + UATs (`test_UAT_FC_*`) + `[FREE-CODED]` commit. Reconciliation derives the matrix from that. Where §1/§7 say 'L1 capability work' / 'each ships an AC', read that as 'framework change / requirement' and 'ships UATs' — the ACs are reconciliation's output. The matrix machinery in §8 is correctly framed as *future XGD extensions*, not something this loop authors. Body wording to be reconciled in a dedicated pass.