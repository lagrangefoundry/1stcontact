---
uid: acceptance_criterion-dc0940f3
id: AC-1789
type: acceptance_criterion
title: 'The toolchain''s image handling needs no native module: none is declared,
  none is loaded, and no verb can fail because one is absent'
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:47.777460+00:00'
updated_at: '2026-09-14T05:16:31.608267+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Installing the toolchain places no native imaging module, and the pixel-comparing
verbs run on a checkout where none exists:

- the tool's declared dependencies — runtime and development alike — name no
  imaging library
- no module under the tool's source imports one, whether eagerly or through a
  deferred load, so there is nothing left to be missing at run time and nothing to
  defer against

The claim is deliberately the narrow, honest one. The imaging module may still be
pulled in transitively by the harness that runs the serverless-runtime test
project, so a developer's install can still build a native module — for the test
harness, never for the tool. What is asserted is that nothing the toolchain ships
declares or loads one, and that no `1c` verb can fail because one is absent.

Prose explaining what the previous native module used to do is not a load: the
check reads code, not comments, since the history is worth keeping.

## Verification
Read the tool's dependency manifest and assert no imaging library is declared in
either dependency set. Walk every source module under the tool, strip comments,
and assert no import of one remains. Run the pixel verbs on a tree where none is
installed and assert they succeed.