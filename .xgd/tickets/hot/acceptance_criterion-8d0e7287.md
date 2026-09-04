---
uid: acceptance_criterion-8d0e7287
id: AC-1538
type: acceptance_criterion
title: What may be done with a file is decided from where it came from, and the client
  is never asked
created_by: xgd
created_at: '2026-09-04T03:53:27.244847+00:00'
updated_at: '2026-09-04T03:53:27.244847+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

What may be done with a piece of material is decided from where it came from, and the client is
never asked. Every created record states three things, and the two permissions invert with
provenance:

- A file the client gave us: rights recorded as the client's own; **may** be published on their
  site; **may not** leave the account as shared or aggregate knowledge.
- Something retrieved on the client's behalf: rights recorded as third-party; **may not** be
  published on their site; **may** leave the account as shared knowledge.

All three values are present on every created record — none is omitted, and neither permission is
derived from the other or from the rights value.

No input accepted at either entry point can set, override or widen any of the three. A caller that
supplies them is not honoured.

## Verification

Send a file through the upload entry point and assert the created record states the client's own
rights, publishable true, exportable false. Retrieve a permitted address and assert the created
record states third-party rights, publishable false, exportable true. Repeat both while supplying
rights and permission values in the request and assert the stored values are unchanged from the
provenance-derived ones. Assert the values are present on the record rather than absent-and-assumed
in each case.
