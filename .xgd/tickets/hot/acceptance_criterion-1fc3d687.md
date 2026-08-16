---
uid: acceptance_criterion-1fc3d687
id: AC-927
type: acceptance_criterion
title: The server addresses exactly one store tree, fixed in the server and never
  derived from a request
created_by: xgd
created_at: '2026-08-06T20:25:46.791904+00:00'
updated_at: '2026-08-16T07:23:55.928103+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The store tree a request may address is a property of the server, not of the
request. Exactly one tree is servable; no path segment, query parameter, header
or host contributes to which tree is read, so there is no address a visitor can
craft that reaches the other one.

A site deployed only to the non-servable tree is therefore not-found on every URL
the addressing scheme admits — its published address, its preview address with
the correct snapshot identifier, and a direct request for one of its files —
including a path that spells out its stored location tree-first. The response is
the ordinary opaque not-found, identical to that for a site that was never
deployed at all: nothing in it reveals that content exists elsewhere.

This holds for content that is otherwise entirely well-formed — really deployed,
really indexed, and readable at its key by anything that addresses that tree
directly — so the guarantee is confinement of the addressable key space, not a
rejection of malformed or unknown input.

## Verification

Deploy a site to the non-servable tree only, and confirm out-of-band that its
rendered entry page is genuinely present at its stored key. Then drive the real
public request entry point for that slug across every route form the addressing
grammar admits — the published root, the preview root at its real snapshot id, a
named file under each — plus a path whose leading segments name the non-servable
tree and the stored key verbatim, and assert not-found for every one. Assert the
same slug deployed to the servable tree serves normally, so the not-found is
attributable to the tree and not to the fixture.