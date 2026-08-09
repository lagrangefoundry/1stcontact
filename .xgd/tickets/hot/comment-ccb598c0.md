---
uid: comment-ccb598c0
id: COMMENT-862
type: comment
title: Comment on story STORY-82
created_by: xgd
created_at: '2026-08-09T01:36:20.151906+00:00'
updated_at: '2026-08-09T01:36:20.151906+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: story-46e3b3c7
  kind: note
---

## Finding from overlap resolution — cluster 7 (anchor report-69e94af9)

Cluster 7 ("the behavior-module contract accretes required members specified by
its consumers") reviewed this story against STORY-85 (behavior-module contract,
same capability CAP-70). **Capability assignment is correct and unchanged** —
CAP-69 (this story's original home) is deprecated and merged into CAP-70, which
now owns both destinations named in the body (L1 leaf axes; the behavior
contract). No reassignment was made.

**Residual, recorded rather than acted on** (it is a within-capability duplicate,
outside this pass's cross-capability mandate):

- **AC-718** ("contact-form presentation treatments are authored via capability
  config + L1 slots") asserts a contract shape that REQ-96 has since deleted: it
  requires declared `intro` and `submit` slots and a fallback rendering when the
  `submit` slot is absent. **AC-701** (STORY-85) states the opposite as the
  current contract — "the earlier `intro` and `submit` presentation slots are
  gone", replaced by one **required** `form` slot carrying `control` leaves, with
  a missing slot failing validation rather than rendering a plain button. The
  matrix therefore holds a proposition and its negation about the same module;
  AC-718 is `pending` / `uat_coverage=fail`, AC-701 is `active` / `pass`.
  AC-718 also still uses the pre-REQ-87 "capability module" naming.
- **AC-719** (card/band + footer treatments via L1 leaf axes) restates territory
  owned by STORY-83 / STORY-80 (the L1 substrate and the absolute-value axes),
  where it is already covered.

Suggested follow-up for the matrix owner: retire AC-718 as superseded by AC-701
(and AC-719 as covered by the L1 substrate stories), which leaves this story with
no criteria of its own and makes it a candidate for archival as a supersession
record. Not done here — archiving a story a prior reconciliation deliberately
repointed is a decision for a within-capability consolidation pass, not for
cross-capability overlap resolution.
