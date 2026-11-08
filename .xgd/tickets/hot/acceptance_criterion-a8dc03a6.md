---
uid: acceptance_criterion-a8dc03a6
id: AC-1755
type: acceptance_criterion
title: An identity carrying no email address, and no service-token mapping to a person,
  is refused rather than failing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:20.492007+00:00'
updated_at: '2026-11-08T01:40:47.705460+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An identity that carries no email address — an automated caller authenticating as
a machine name rather than a person — and whose machine name the deployment does
**not** map to a person has nothing to bind to and is refused. It is a refusal
reporting "no address", not a failure: automation reaching this surface without
a mapping is a configuration mistake rather than an attack.

This covers every emailless identity that reaches admission unresolved: a service
token whose name is absent from the deployment's service-token mapping, any
service token while that mapping is empty or undeclared, and an identity with
neither an address nor a machine name. An empty mapping means nobody, so
removing or omitting the mapping opens nothing — the refusal is the same one,
with the same reason, that every service token received before the mapping
existed.

A service token whose name *is* mapped is not an emailless identity for this
criterion: it is admitted, or refused, as the person it maps to (STORY-120).

## Verification

Attempt admission with no address present and no mapping for the identity's
name — once with the mapping empty, once with the mapping naming a different
machine name. Assert each attempt is refused, that the reported reason names the
absent address, and that nothing was raised or created.
