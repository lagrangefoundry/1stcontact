---
uid: acceptance_criterion-2ed8fadb
id: AC-1706
type: acceptance_criterion
title: Retrieved material lands third-party, never republishable, exportable and as
  background to read, whatever the request claims
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:51.928065+00:00'
updated_at: '2026-09-11T04:42:51.928065+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

Material the platform retrieved on the client's behalf is recorded as somebody else's work that
may not be republished — and this is inferred from the provenance alone, never asked and never
accepted from the request. The record reads:

- provenance: **retrieved on the client's behalf** (distinct from a client upload);
- rights: **third-party**;
- **not republishable** — this is the marking that makes retrieved content unable to reach a site's
  public asset library, since promotion is refused for anything not republishable;
- **exportable** — the two distribution bits invert relative to a client upload, and neither is
  derived from the other;
- role: **background for the assistant to read**, never material intended for a site.

These five values are what the retrieval records regardless of what the request asks for: a
retrieval request that supplies a role, a rights claim, a republishable assertion or an ownership
assertion does not change any of them.

This recorded provenance **is** the untrusted marking for retrieved content: what came back becomes
corpus the assistant reads, so an entirely legitimate public address may still return content
written to be read by an AI, and the rights record is what bounds the consequences of that.

## Verification

Retrieve a permitted public address through the retrieval entry point and assert all five recorded
values on the stored material (not only in the response): provenance retrieved, rights third-party,
not republishable, exportable, role background. Compare against a client upload of the same bytes
and assert the two distribution bits are inverted between them. Repeat the retrieval with a role, a
rights value and a republishable value supplied in the request and assert every recorded value is
unchanged. Finally attempt to promote the retrieved material into a site's asset library and assert
it is refused — the non-republishable marking is effective, not merely recorded.
