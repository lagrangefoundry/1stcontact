---
uid: acceptance_criterion-1f9fd518
id: AC-849
type: acceptance_criterion
title: An authored page's L1 body is held to the safety envelope wherever a site definition
  is validated
created_by: xgd
created_at: '2026-08-06T03:03:05.138685+00:00'
updated_at: '2026-08-09T05:41:20.916694+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A site definition whose page carries an L1 body is accepted only if that body is
inside the safety envelope. Validation of the definition is one gate, not two
half-gates: the typed-shape check (typed axes, closed enums, no unknown keys)
and the envelope check (numeric bounds, the URL-scheme allowlist, the depth and
node-count caps, geometry-track well-formedness, unique node ids) both apply,
and a definition failing either is rejected with nothing written.

The guarantee is unconditional on how the page's L1 body was produced. A body
folded from a capture and a body typed into a definition file by a person or an
AI clear the identical envelope, so the path with a human free-typing numbers
and URLs is not the path with no bounds.

Because a single site-definition validation stands behind every consuming
operation, the guarantee holds for each of them alike: rendering a draft,
publishing a revision, applying an authored edit, and importing a reproduced
site all refuse an out-of-envelope page rather than emitting it. Each violation
is reported as a path anchored inside the offending page (see the criterion on
the full per-field error list), and a definition whose pages are all in envelope
validates and renders exactly as before — the gate is a boundary check, not a
blanket refusal of authored L1.

## Verification
Validate a site definition whose page's L1 body violates one envelope rule and
observe rejection with the violation reported against that page; validate the
same definition with the value returned to range and observe acceptance. Then
drive the same out-of-envelope page through the real render entry point over an
on-disk site and observe the command refuses, naming the offending node's path,
while the in-envelope page renders. Confirm a page carrying no L1 body is
unaffected.