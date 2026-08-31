---
uid: acceptance_criterion-1c5b368d
id: AC-1454
type: acceptance_criterion
title: The operator surface retains every invocation's log, declared for both environments
  and placed so the production route survives
created_by: xgd
created_at: '2026-08-31T17:17:59.003904+00:00'
updated_at: '2026-08-31T17:25:13.539616+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

The operator surface's deployment configuration declares that **every** invocation's log is
retained: retention is enabled at the top level and again for the named production environment,
and in both places the sampling rate keeps every invocation rather than a fraction of them.

Without that declaration the platform retains no per-invocation record at all — only aggregate
counters. It is then possible to establish *that* a request was killed and never *which* one,
which is what turned one production diagnosis into an inference chain across source and a billing
page instead of a single log read. This surface serves one operator's builder, so the volume
argument for sampling does not apply: a sampled log is a log that is missing exactly the request
the reader came for.

The production repeat is redundant for as long as the tool inherits this key into a named
environment, and it is written anyway, for the reason every other repeat in this configuration is
written — the rule is that nothing depends on remembering which declarations inherit. Losing the
production declaration fails silently in the worst way: the deploy succeeds and the logs are
simply absent, which reads as "nothing happened" rather than as a misconfiguration.

**Where the production declaration sits is load-bearing, not tidiness.** A named environment's
bare keys — its deployed name and its route list — belong to that environment's own table, and a
table header ends the table above it. A retention declaration written *before* the route list
therefore captures the route: the configuration still parses, the tool still deploys, and the
production route silently stops being declared at all. The declaration is placed after that
environment's bare keys, and this property is asserted against the **parsed** configuration rather
than against its text, because the broken form is indistinguishable by eye and entirely valid.

## Verification

Parse the operator surface's deployment configuration. Both retention declarations are present —
one at the top level and one for the named production environment — both enabled, and both
declaring a sampling rate that keeps every invocation rather than a sample of them.

From the same parse, read the named production environment's own bare keys: the environment is
present, and its deployed name and its route list are both still among them — so the retention
table declared beneath them has not absorbed the route.