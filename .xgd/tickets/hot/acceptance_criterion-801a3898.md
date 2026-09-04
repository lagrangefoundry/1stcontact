---
uid: acceptance_criterion-801a3898
id: AC-1597
type: acceptance_criterion
title: An invited and entitled person is admitted, and every arrival is recorded —
  including a refused one
created_by: xgd
created_at: '2026-09-04T05:52:32.954780+00:00'
updated_at: '2026-09-04T05:52:32.954780+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

An invited person with a live grant is admitted, and the admission reports who they are,
which account they may operate, and which grant admitted them.

Every arrival is recorded against the person, whether or not it ends in admission: the
first arrival sets a first-seen time once and never moves it again, and the most recent
arrival is updated on every visit — including a visit that is then refused, so an operator
can answer "did the customer whose access lapsed ever try to get in?"

## Verification

Invite a person, then admit them and assert the result reports the same person, the account
their ownership names, and their grant. Read the person back and assert both a first-seen
and a last-seen time are now set. Admit them a second time and assert the first-seen time is
unchanged while the last-seen time has advanced. Then withdraw their grant, attempt
admission again, and assert the attempt is refused while the last-seen time has advanced
once more.
