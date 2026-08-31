---
uid: acceptance_criterion-86d58437
id: AC-1445
type: acceptance_criterion
title: Rendering the same site source twice produces byte-identical output, and no
  render-path source reads the ambient clock
created_by: xgd
created_at: '2026-08-31T12:39:17.199780+00:00'
updated_at: '2026-08-31T12:39:17.199780+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0598c150
  kind: behavior
  regression_only: false
---

## Criterion

A site definition rendered twice, with no change between the two renders,
produces exactly the same set of output files, and each file's bytes are
identical between the two renders. This holds for the full site render and for
the standalone single-page render alike.

Independently of any particular render, no source file on the framework's render
path obtains the current time from the ambient clock. Prose describing the rule
does not count as a violation; executable code that reads the clock does.

## Verification

Render one validated site definition twice from the same in-memory source and
compare the produced file names and then each file's content byte for byte;
separately render one page twice through the standalone page renderer and
compare the results. Then scan every source file on the framework's render path,
with comments stripped, and assert none contains a clock read; the expected
result is an empty list of offenders, reported by path so a future violation
names itself.
