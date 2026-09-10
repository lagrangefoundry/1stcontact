---
uid: acceptance_criterion-26894f8d
id: AC-1624
type: acceptance_criterion
title: 'Conformance obligations are unweakened inside a seam: mountInL1 runs the same
  five dimensions'
created_by: martin-github@westhead.me
created_at: '2026-09-10T12:01:35.555541+00:00'
updated_at: '2026-09-10T12:01:35.555541+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion

A behaviour's conformance obligations are **unweakened inside a seam**. Mounted
is a shipping shape, so the harness offers `mountInL1` as a second position to
run from, and it runs *the same* five dimensions (safety, security,
cross-browser, responsive, isolation) against it — not a reduced set.

In that mode the harness binds the fixture's instance to a slot in a minimal L1
host page rather than serving the module standalone. The host is deliberately
non-interfering: a single `slot` carrying a geometry keyframe at **every** width
the run probes, each pinning the seam to exactly the viewport, so the wrapper can
never itself be the thing that overflows and a failure the mode reports is always
the module's.

The consequence is the reason the mode exists: **a fixture that conforms
standalone but overflows once pinned inside the seam is still a violation.** The
mounted position is where that class of defect becomes visible, and it is flagged
there exactly as it would be standalone.

## Verification

Run a survivor behavior module through the harness in `mountInL1` mode and
confirm the page it actually served is the slot-bound composition — the page
carries an L1 document, the instance names the host's seam, and the module's
rendered markup appears inside that seam in the output — so the mode cannot pass
by silently ignoring the flag. Confirm the host's slot carries a keyframe at each
probed width. Then run a fixture that is clean standalone but overflows its
container and confirm the mounted run flags it on the responsive dimension, and
that the five dimensions applied are the same set as in the standalone run.
