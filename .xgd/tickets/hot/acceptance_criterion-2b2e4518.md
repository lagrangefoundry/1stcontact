---
uid: acceptance_criterion-2b2e4518
id: AC-861
type: acceptance_criterion
title: A site declaring product distribution fails when a font it serves is not settled
  as redistributable; an unresolved answer is treated as no, and only a settled yes
  clears the gate
created_by: xgd
created_at: '2026-08-06T03:30:04.901453+00:00'
updated_at: '2026-08-07T18:44:58.899551+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The same font and the same record produce different verdicts depending on which
question the site is asking.

- A site that does not declare product distribution passes with a font whose
  product-redistribution answer is unresolved.
- A site declaring product distribution fails when a font it serves carries an
  unresolved answer, and the violation says so explicitly — reporting the answer
  as unresolved rather than as a plain refusal, so the reader knows the question
  was asked and not answered.
- A site declaring product distribution fails identically when the answer is a
  settled no, with the violation reporting it as not permitted.
- Only a settled yes clears the gate for a product-distributed site.

Every failing case is of the redistribution-not-permitted kind, names the site and
the family, and offers the remediation of resolving the licence question or using
a font that permits redistribution.

## Verification
Hold the record and the served font constant and vary only the two inputs. Assert:
unresolved + no product declaration passes; unresolved + product declaration fails
with kind redistribution-not-permitted and a message stating the answer is
unresolved; settled-no + product declaration fails with the same kind and a
message stating it is not permitted; settled-yes + product declaration passes.