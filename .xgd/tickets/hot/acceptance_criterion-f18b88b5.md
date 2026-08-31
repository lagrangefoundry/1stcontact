---
uid: acceptance_criterion-f18b88b5
id: AC-1412
type: acceptance_criterion
title: A site mounting a behavior module renders in the edge runtime, serving the
  component's own bytes
created_by: xgd
created_at: '2026-08-31T11:05:54.985660+00:00'
updated_at: '2026-08-31T11:12:57.349998+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
A site whose page mounts a behavior module renders **in the edge runtime**, not
only on the operator's machine, and the bytes it serves are the component's own
output.

- Requesting the draft channel of a site that mounts a behavior module from the
  platform's edge runtime returns the rendered page: the module's chrome, its
  behavioural attributes (the endpoint, the submission verb), and the L1 controls
  mounted into its slot. The same request previously failed with an error naming
  the work that would make it possible; there is no remaining capability the edge
  runtime refuses on the grounds that a page mounts a behavior.
- The page's invariant chrome reaches it the same way it always did — folded into
  the site stylesheet the same request serves — so the module renders *dressed*
  in the edge runtime, not merely without throwing.
- **The served markup contains exactly what calling the component in that same
  runtime produces**, given the instance's props. The renderer contributes only
  the editor hook it stamps on the module's root element; everything inside is
  the component's own bytes. A second, host-specific render path would show up
  here as a mismatch.
- Parity between the filesystem host and the edge runtime is therefore
  **structural, not compared**: both call the same function, so there is nothing
  to keep in step. The parity claimed is host-to-host. It is deliberately *not*
  parity with the output of the build transform this replaced — that output's
  inter-element whitespace differs, and whitespace-only text nodes are
  semantically inert.

## Verification
Seed a site whose page mounts a behavior module into the edge runtime's own
store, request the site's draft channel through the runtime's request handler, and
assert a 200 whose body carries the module's chrome, its endpoint and verb
attributes, and its mounted controls; request the same channel's stylesheet and
assert the module's invariant chrome is present. In that same runtime, resolve the
module from the catalog, call it with the seeded instance's props, and assert the
served body contains that exact output apart from the module root's opening tag.
Perform the equivalent render on the filesystem host from the same seed and assert
it contains the same component output, so the two hosts are shown to be running
one function rather than two implementations.