---
uid: acceptance_criterion-875c0a08
id: AC-864
type: acceptance_criterion
title: 'The provenance record''s own integrity is a hard error, never a vacuous pass:
  absent, unparseable, structurally invalid, or declaring one family twice each stops
  the run'
created_by: xgd
created_at: '2026-08-06T03:30:36.649159+00:00'
updated_at: '2026-08-07T18:45:01.837048+00:00'
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
Checking against nothing would report clean over entirely un-provenanced fonts, so
the check refuses to run rather than passing when the record itself cannot be
trusted. Each of the following stops the run with an error naming the record and
the problem, and a non-zero exit from the command line — never a pass and never an
empty report:

- the record is absent, with the error stating where it is expected and that every
  font file must be accounted for
- the record cannot be parsed
- the record parses but violates its contract, with the error naming the first
  offending field and how many issues were found
- the record declares the same family more than once, with the error naming that
  family and the remediation of merging the entries

## Verification
Run the check against a project with no record and assert it raises an error
naming the missing record rather than returning a passing report. Repeat with a
record that is syntactically broken, one that is well-formed but violates the
contract, and one declaring a family twice; assert each raises an error whose
message identifies the record and the specific problem, and that the command-line
invocation exits non-zero in each case.