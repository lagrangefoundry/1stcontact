---
uid: acceptance_criterion-003caa07
id: AC-1353
type: acceptance_criterion
title: The editing surface and the port import no filesystem module
created_by: xgd
created_at: '2026-08-20T15:43:36.500476+00:00'
updated_at: '2026-08-20T15:43:36.500476+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

The editing surface and the port's own modules reach no filesystem in their **imports**, not
merely in their behaviour.

- The module carrying the editing surface names no runtime filesystem or path module, and does
  not import the tree's filesystem helper barrel.
- The port's own supporting modules — its declaration, its assembly-and-validation path, its
  change-journal model and its filesystem-free store — likewise name no runtime module and no
  filesystem helper.
- The filesystem-backed adapter is the one place a filesystem import is expected, and it lives
  behind a separate entry point, so importing the port does not drag a filesystem behind it.

This is a distinct claim from every behavioural criterion here, and cannot be substituted by one.
Under the Node compatibility flag the Workers runtime *resolves* a filesystem import and supplies a
per-isolate filesystem that disappears with the isolate: a command that still reached for a file
would pass a behavioural run and silently lose the operator's work once deployed. A successful
import is not evidence; only an assertion over what the modules import is.

## Verification

Read each of the named modules' source at test time and assert the absence of those imports — the
structure is the deliverable, as it is for the two runtimes' inclusion rules, so the check is
structural by intent rather than for want of a behavioural route. Assert both the runtime-module
imports and the filesystem-helper import are absent from each module, and identify the offending
module by name when one appears.
