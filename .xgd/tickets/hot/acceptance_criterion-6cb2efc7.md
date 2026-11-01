---
uid: acceptance_criterion-6cb2efc7
id: AC-2082
type: acceptance_criterion
title: A capture of the client's own domain is recorded republishable and not exportable;
  a capture of any other domain is recorded not republishable and exportable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:51:21.496673+00:00'
updated_at: '2026-11-01T01:51:21.496673+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
A capture's rights are set from its provenance and nobody is asked:
- **The client's declared domain, or a subdomain of it** (a leading `www.` on the declared domain is ignored): recorded `republishable: true`, `exportable: false`, `rights: owned`.
- **Any other domain**: recorded `republishable: false`, `exportable: true`, `rights: third_party`.

A host that merely ends with the declared domain's characters (e.g. `notexample.com` against `example.com`) is another domain. When no domain is declared, the capture is treated as another domain.

## Verification
Adopt fixture captures and read the ticket's fields:
- Declared `example.com`: assert `example.com` and `www.example.com` are owned (republishable, not exportable).
- Declared `example.com`: assert `notexample.com` and `other.org` are third-party (not republishable, exportable).
- No declared domain: assert any host is third-party.

Note: in production no caller currently supplies the client's declared domain to adoption (STORY-159 Known gap 9).
