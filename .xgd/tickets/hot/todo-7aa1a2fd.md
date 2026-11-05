---
uid: todo-7aa1a2fd
id: TODO-22
type: todo
title: 'Consultant prompt budget: revisit REQ-638''s overrun (193,700 vs 191,200 target)'
created_by: xgd
created_at: '2026-11-05T01:32:38.768227+00:00'
updated_at: '2026-11-05T01:32:38.768227+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: reminder
  auto_merge_back: true
---

Operator decision (EPIC-19, 2026-11-05): for REQ-638's first test, the consultant's priming is allowed over its size target. Revisit afterwards.

- **Measured on REQ-638's branch:** consultant authored 193,700 against the 191,200 target (+3,158 from 190,542; system +1,745, tools +1,413).
- **Red as a result:** `test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget`. REQ-466 was already red on the base (critic 8,653 against 8,600).
- **To decide later:** review the priming for what can go (the removed stage guides and gates should have freed some) or raise the target, once the run-throughs show which of REQ-638's new text earns its place. Don't trim unrelated text to fit.
- Re-measure after REQ-638 lands on xgd-working, since text landed since the branch was cut will have moved the numbers.
